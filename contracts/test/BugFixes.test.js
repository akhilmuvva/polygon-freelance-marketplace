const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("FreelanceEscrow Bug Fixes", function () {
    let FreelanceEscrow;
    let escrow;
    let owner, freelancer, client, other;
    let mockToken; // We can use address(0) for native or deploy a mock
    // For simplicity, we'll use Native (address(0)) to avoid deploying ERC20 mock if not needed,
    // but logic handles ERC20. createJob with address(0) checks msg.value.

    beforeEach(async function () {
        [owner, freelancer, client, other] = await ethers.getSigners();

        // Deploy Mock Dependant Contracts (Addresses)
        const forwarder = other.address;
        const sbt = other.address;
        const entry = other.address;

        const FreelanceEscrowFactory = await ethers.getContractFactory("FreelanceEscrow");
        // Initialize with admin, forwarder, sbt, entry
        escrow = await upgrades.deployProxy(FreelanceEscrowFactory, [owner.address, forwarder, sbt, entry], {
            initializer: "initialize",
            kind: "uups",
        });
        await escrow.waitForDeployment();
    });

    describe("Insolvency Protection (createJob)", function () {
        it("Should revert if milestone sum does not equal total amount", async function () {
            const amount = ethers.parseEther("1.0");
            const mAmounts = [ethers.parseEther("0.5"), ethers.parseEther("0.4")]; // Sum 0.9 != 1.0

            const params = {
                categoryId: 1,
                freelancer: freelancer.address,
                token: ethers.ZeroAddress,
                amount: amount,
                ipfsHash: "QmHash",
                deadline: Math.floor(Date.now() / 1000) + 3600,
                mAmounts: mAmounts,
                mHashes: ["Hash1", "Hash2"],
                mIsUpfront: [false, false],
                yieldStrategy: 0, // NONE
                paymentToken: ethers.ZeroAddress,
                paymentAmount: 0,
                minAmountOut: 0
            };

            await expect(
                escrow.connect(client).createJob(params, { value: amount })
            ).to.be.revertedWithCustomError(escrow, "InvalidStatus");
            // Note: We used `revert InvalidStatus()` in the fix.
        });

        it("Should succeed if milestone sum equals total amount", async function () {
            const amount = ethers.parseEther("1.0");
            const mAmounts = [ethers.parseEther("0.5"), ethers.parseEther("0.5")]; // Sum 1.0 == 1.0

            const params = {
                categoryId: 1,
                freelancer: freelancer.address,
                token: ethers.ZeroAddress,
                amount: amount,
                ipfsHash: "QmHash",
                deadline: Math.floor(Date.now() / 1000) + 3600,
                mAmounts: mAmounts,
                mHashes: ["Hash1", "Hash2"],
                mIsUpfront: [false, false],
                yieldStrategy: 0,
                paymentToken: ethers.ZeroAddress,
                paymentAmount: 0,
                minAmountOut: 0
            };

            await expect(
                escrow.connect(client).createJob(params, { value: amount })
            ).to.emit(escrow, "JobCreated");
        });
    });

    describe("Double Spend Protection (refundExpiredJob)", function () {
        it("Should only refund remaining amount if milestones were released", async function () {
            const amount = ethers.parseEther("1.0");
            const mAmounts = [ethers.parseEther("0.4"), ethers.parseEther("0.6")];
            const expiry = Math.floor(Date.now() / 1000) + 3600;

            // 1. Create Job with Upfront Milestone (0.4)
            const params = {
                categoryId: 1,
                freelancer: freelancer.address,
                token: ethers.ZeroAddress,
                amount: amount,
                ipfsHash: "QmHash",
                deadline: expiry,
                mAmounts: mAmounts,
                mHashes: ["Hash1", "Hash2"],
                mIsUpfront: [true, false], // First one is upfront
                yieldStrategy: 0,
                paymentToken: ethers.ZeroAddress,
                paymentAmount: 0,
                minAmountOut: 0
            };

            const tx = await escrow.connect(client).createJob(params, { value: amount });
            const receipt = await tx.wait();
            const event = receipt.logs.find(l => l.fragment && l.fragment.name === 'JobCreated'); // ethers v6
            // In upgrades tests, logs format might vary. Assuming we get jobId 1.
            const jobId = 1;

            // Check totalPaidOut
            let job = await escrow.jobs(jobId);
            // job.totalPaidOut should be 0.4 ETH (from upfront release in createJob -> _setupMilestones -> _releaseMilestoneInternal)
            expect(job.totalPaidOut).to.equal(ethers.parseEther("0.4"));

            // 2. Fast forward to expiry
            await ethers.provider.send("evm_increaseTime", [3601]);
            await ethers.provider.send("evm_mine");

            // 3. Client checks balance before refund
            // "balances" mapping in contract tracks user's withdrawable funds
            const initialClientBalance = await escrow.balances(client.address, ethers.ZeroAddress);
            expect(initialClientBalance).to.equal(0);

            // 4. Call refundExpiredJob
            // Before fix: it added job.amount (1.0) to balances
            // After fix: it adds (amount - totalPaidOut) = (1.0 - 0.4) = 0.6
            await escrow.connect(client).refundExpiredJob(jobId);

            // 5. Verify Balance
            const finalClientBalance = await escrow.balances(client.address, ethers.ZeroAddress);
            expect(finalClientBalance).to.equal(ethers.parseEther("0.6"));
        });
    });
});
