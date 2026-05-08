const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("FreelanceEscrow - S-05 Yield Strategy Bypass Test", function () {
    let escrow, yieldManager, token;
    let owner, client, freelancer;
    let escrowAddress, yieldManagerAddress, tokenAddress;

    const JOB_AMOUNT = ethers.parseUnits("100", 18);
    const STAKE_AMOUNT = ethers.parseUnits("5", 18); // 5% of 100

    beforeEach(async function () {
        [owner, client, freelancer, otherAccount] = await ethers.getSigners();

        // 1. Deploy Token
        const MockToken = await ethers.getContractFactory("PolyToken");
        token = await MockToken.deploy();
        tokenAddress = await token.getAddress();

        // 2. Deploy YieldManager
        const YieldManager = await ethers.getContractFactory("YieldManager");
        yieldManager = await YieldManager.deploy(owner.address);
        yieldManagerAddress = await yieldManager.getAddress();

        // 3. Deploy Escrow (Simplified initialization for test)
        const FreelanceEscrow = await ethers.getContractFactory("FreelanceEscrow");
        escrow = await upgrades.deployProxy(
            FreelanceEscrow,
            [owner.address, otherAccount.address, owner.address, owner.address], // Use otherAccount as forwarder
            { initializer: "initialize", kind: "uups" }
        );
        escrowAddress = await escrow.getAddress();
        console.log("Escrow address:", escrowAddress);
        console.log("YieldManager address:", yieldManagerAddress);
        const signers = await ethers.getSigners();
        console.log("Signer 0:", signers[0].address);
        console.log("Signer 1:", signers[1].address);
        console.log("Signer 2:", signers[2].address);
        
        console.log("Owner address:", owner.address);
        console.log("Client address:", client.address);
        const hasAdmin = await escrow.hasRole("0x0000000000000000000000000000000000000000000000000000000000000000", owner.address);
        console.log("Owner has ADMIN role:", hasAdmin);
        const hasManager = await escrow.hasRole(await escrow.MANAGER_ROLE(), owner.address);
        console.log("Owner has MANAGER role:", hasManager);

        // 4. Setup YieldManager
        // Mock a pool for AAVE
        const MockPool = await ethers.getContractFactory("MockAavePool");
        const aavePool = await MockPool.deploy();
        const aavePoolAddress = await aavePool.getAddress();

        // Strategy 1 is AAVE in enum
        await yieldManager.setStrategy(1, aavePoolAddress, true);

        // 5. Setup Escrow
        await escrow.connect(owner).setYieldManager(yieldManagerAddress);
        await escrow.connect(owner).setTokenWhitelist(tokenAddress, true);

        // Fund client
        await token.transfer(client.address, JOB_AMOUNT * 2n);
        await token.connect(client).approve(escrowAddress, JOB_AMOUNT * 2n);
    });

    it("Should demonstrate the S-05 Strategy Mismatch (Bypass)", async function () {
        // Create a job with Strategy.NONE (0)
        const params = {
            categoryId: 1,
            freelancer: ethers.ZeroAddress,
            token: tokenAddress,
            amount: JOB_AMOUNT,
            ipfsHash: "QmTest",
            deadline: Math.floor(Date.now() / 1000) + 86400,
            mAmounts: [JOB_AMOUNT],
            mHashes: ["QmMilestone"],
            mIsUpfront: [false],
            yieldStrategy: 0, // NONE
            paymentToken: tokenAddress,
            paymentAmount: JOB_AMOUNT,
            minAmountOut: 0,
            zkRequired: false
        };

        // This should NOT deposit into yield manager if we follow user's choice (NONE)
        // BUT the current code defaults to AAVE (1) if yieldManager is set.
        await escrow.connect(client).createJob(params);
        
        const jobId = 1;
        const job = await escrow.jobs(jobId);
        
        console.log("Job Yield Strategy:", job.yieldStrategy.toString());
        
        // Check if funds were deposited into AAVE (via YieldManager)
        const ymTokenBalance = await token.balanceOf(yieldManagerAddress);
        console.log("YieldManager Token Balance:", ethers.formatUnits(ymTokenBalance, 18));
        
        // If ymTokenBalance > 0, it means it deposited even though user chose NONE.
        // AND job.yieldStrategy is still 0 (NONE).
        
        expect(job.yieldStrategy).to.equal(0n);
        expect(ymTokenBalance).to.equal(0n); // Fix confirmed: No funds should be in YieldManager/AAVE pool

        // NOW: Try to release milestone. It should fail to withdraw from AAVE because job.yieldStrategy is NONE.
        // But the escrow contract itself might NOT have enough tokens because they are in YieldManager!
        
        // Pick freelancer
        await token.transfer(freelancer.address, STAKE_AMOUNT);
        await token.connect(freelancer).approve(escrowAddress, STAKE_AMOUNT);
        await escrow.connect(freelancer).applyForJob(jobId);
        await escrow.connect(client).pickFreelancer(jobId, freelancer.address);
        await escrow.connect(freelancer).acceptJob(jobId);

        await escrow.connect(client).releaseMilestone(jobId, 0);
        
        // Verify freelancer can withdraw
        const initialFreelancerBalance = await token.balanceOf(freelancer.address);
        await escrow.connect(freelancer).withdraw(tokenAddress);
        const finalFreelancerBalance = await token.balanceOf(freelancer.address);
        
        expect(finalFreelancerBalance - initialFreelancerBalance).to.equal(JOB_AMOUNT);    });
});
