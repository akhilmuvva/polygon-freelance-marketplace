const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Zenith Edge Cases & Fee Optimization", function () {
    let escrow, polyToken, usdc, sbt, reputation;
    let owner, client, freelancer, vault, other;

    const JOB_AMOUNT = ethers.parseEther("1.0");

    beforeEach(async function () {
        [owner, client, freelancer, vault, other] = await ethers.getSigners();

        // 1. Deploy SBT
        const SBTFactory = await ethers.getContractFactory("FreelanceSBT");
        sbt = await SBTFactory.deploy(owner.address, owner.address);
        await sbt.waitForDeployment();

        // 2. Deploy Reputation
        const RepFactory = await ethers.getContractFactory("FreelancerReputation");
        reputation = await upgrades.deployProxy(RepFactory, [owner.address, ""], { kind: "uups" });
        await reputation.waitForDeployment();

        // 3. Deploy Escrow
        const EscrowFactory = await ethers.getContractFactory("FreelanceEscrow");
        escrow = await upgrades.deployProxy(EscrowFactory, [
            owner.address,
            ethers.ZeroAddress, // forwarder dummy
            await sbt.getAddress(),
            owner.address
        ], { kind: "uups" });
        await escrow.waitForDeployment();

        // Setup
        await escrow.setReputationContract(await reputation.getAddress());
        await escrow.setVault(vault.address);
        await reputation.grantRole(await reputation.MINTER_ROLE(), await escrow.getAddress());
    });

    describe("Supreme Level Fees", function () {
        it("Qualified users should pay 0% platform fee", async function () {
            // Set user as supreme
            await escrow.setSupreme(freelancer.address, true);
            expect(await escrow.isSupreme(freelancer.address)).to.be.true;

            const params = {
                categoryId: 0,
                freelancer: freelancer.address,
                token: ethers.ZeroAddress,
                amount: JOB_AMOUNT,
                ipfsHash: "ipfs://test",
                deadline: 0,
                mAmounts: [],
                mHashes: [],
                mIsUpfront: []
            };
            await escrow.connect(client).createJob(params, { value: JOB_AMOUNT });
            await escrow.connect(freelancer).acceptJob(1, { value: JOB_AMOUNT / 10n });

            const initialVault = await ethers.provider.getBalance(vault.address);
            await escrow.connect(client).releaseFunds(1);

            // Fee should be 0 for supreme freelancer
            const vaultBalance = await escrow.balances(vault.address, ethers.ZeroAddress);
            expect(vaultBalance).to.equal(0);
        });

        it("Standard users should pay configured platform fee", async function () {
            await escrow.setPlatformFee(500); // 5%

            const params = {
                categoryId: 0,
                freelancer: freelancer.address,
                token: ethers.ZeroAddress,
                amount: JOB_AMOUNT,
                ipfsHash: "ipfs://test",
                deadline: 0,
                mAmounts: [],
                mHashes: [],
                mIsUpfront: []
            };
            await escrow.connect(client).createJob(params, { value: JOB_AMOUNT });
            await escrow.connect(freelancer).acceptJob(1, { value: JOB_AMOUNT / 10n });

            const initialVaultBalance = await escrow.balances(vault.address, ethers.ZeroAddress);
            await escrow.connect(client).releaseFunds(1);
            const finalVaultBalance = await escrow.balances(vault.address, ethers.ZeroAddress);

            const expectedFee = (JOB_AMOUNT * 500n) / 10000n;
            expect(finalVaultBalance - initialVaultBalance).to.equal(expectedFee);
        });
    });

    describe("External Arbitration Rule Flow", function () {
        it("Should execute ruling from configured arbitrator", async function () {
            // Mock external arbitrator address
            const mockArb = other.address;
            await escrow.setArbitrator(mockArb);

            const params = {
                categoryId: 0,
                freelancer: freelancer.address,
                token: ethers.ZeroAddress,
                amount: JOB_AMOUNT,
                ipfsHash: "ipfs://test",
                deadline: 0,
                mAmounts: [],
                mHashes: [],
                mIsUpfront: []
            };
            await escrow.connect(client).createJob(params, { value: JOB_AMOUNT });

            // Raise dispute
            await escrow.connect(client).raiseDispute(1);

            // Arbitrator rules: 1 (Client wins), 2 (Freelancer wins)
            // ruling of 2 means 100% to freelancer
            await escrow.connect(other).rule(0, 2); // disputeId 0

            const job = await escrow.jobs(1);
            expect(job.status).to.equal(5); // Completed
        });
    });

    describe("ERC5192 Compliance (Soulbound)", function () {
        it("Should be locked by default and prevent transfers", async function () {
            await sbt.safeMint(freelancer.address, "ipfs://cert");
            expect(await sbt.locked(1)).to.be.true;

            // Try to transfer
            await expect(
                sbt.connect(freelancer).transferFrom(freelancer.address, other.address, 1)
            ).to.be.reverted;
        });
    });

    describe("Evidence & Administrative", function () {
        it("Should allow parties to submit evidence for disputed jobs", async function () {
            const params = {
                categoryId: 0,
                freelancer: freelancer.address,
                token: ethers.ZeroAddress,
                amount: JOB_AMOUNT,
                ipfsHash: "ipfs://test",
                deadline: 0,
                mAmounts: [],
                mHashes: []
            };
            await escrow.connect(client).createJob(params, { value: JOB_AMOUNT });
            await escrow.connect(client).raiseDispute(1);

            await expect(escrow.connect(client).submitEvidence(1, "ipfs://evidence"))
                .to.emit(escrow, "Evidence");
        });

        it("Only admin should be able to set global parameters", async function () {
            await expect(escrow.connect(other).setPlatformFee(1000))
                .to.be.reverted;

            await escrow.connect(owner).setPlatformFee(1000);
            expect(await escrow.platformFee()).to.equal(1000);
        });
    });

    describe("Milestone Precision", function () {
        it("Should fail if milestone total exceeds job amount", async function () {
            const params = {
                categoryId: 0,
                freelancer: freelancer.address,
                token: ethers.ZeroAddress,
                amount: JOB_AMOUNT,
                ipfsHash: "ipfs://test",
                deadline: 0,
                mAmounts: [JOB_AMOUNT, 1n], // sum > JOB_AMOUNT
                mHashes: ["M1", "M2"],
                mIsUpfront: [false, false]
            };
            await expect(escrow.connect(client).createJob(params, { value: JOB_AMOUNT }))
                .to.be.reverted;
        });
    });
});
