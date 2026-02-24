const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("FreelanceEscrow Verification", function () {
    let FreelanceEscrow;
    let escrow;
    let owner, client, freelancer, other;

    beforeEach(async function () {
        [owner, client, freelancer, other] = await ethers.getSigners();

        // 1. Deploy Forwarder
        const Forwarder = await ethers.getContractFactory("PolyLanceForwarder");
        const forwarder = await Forwarder.deploy();
        await forwarder.waitForDeployment();

        // 2. Deploy SBT
        const SBT = await ethers.getContractFactory("FreelanceSBT");
        const sbt = await SBT.deploy(owner.address, owner.address);
        await sbt.waitForDeployment();

        // 3. Deploy Escrow
        FreelanceEscrow = await ethers.getContractFactory("FreelanceEscrow");
        escrow = await upgrades.deployProxy(FreelanceEscrow, [
            owner.address,
            await forwarder.getAddress(),
            await sbt.getAddress(),
            other.address // dummy entrypoint
        ], {
            initializer: "initialize",
            kind: "uups",
        });
        await escrow.waitForDeployment();
    });

    it("Should initialize correctly and grant roles", async function () {
        expect(await escrow.hasRole(await escrow.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
        expect(await escrow.hasRole(await escrow.ARBITRATOR_ROLE(), owner.address)).to.be.true;
        expect(await escrow.hasRole(await escrow.MANAGER_ROLE(), owner.address)).to.be.true;
    });

    it("Should create a job with milestones and release them", async function () {
        const totalAmount = ethers.parseEther("1.0");
        const milestoneAmounts = [ethers.parseEther("0.4"), ethers.parseEther("0.6")];
        const milestoneDescs = ["M1", "M2"];

        const params = {
            categoryId: 1,
            freelancer: freelancer.address,
            token: ethers.ZeroAddress,
            amount: totalAmount,
            ipfsHash: "ipfs://hash",
            deadline: 0,
            mAmounts: milestoneAmounts,
            mHashes: milestoneDescs
        };
        await escrow.connect(client).createJob(params, { value: totalAmount });

        const job = await escrow.jobs(1);
        expect(job.amount).to.equal(totalAmount);
        expect(job.milestoneCount).to.equal(2);

        // Release first milestone
        const initialFreelancerBalance = await ethers.provider.getBalance(freelancer.address);
        await escrow.connect(client).releaseMilestone(1, 0);

        const m1 = await escrow.jobMilestones(1, 0);
        expect(m1.isReleased).to.be.true;

        const finalFreelancerBalance = await ethers.provider.getBalance(freelancer.address);
        expect(finalFreelancerBalance).to.be.gt(initialFreelancerBalance);
    });

    it("Should deduct platform fees upon full fund release", async function () {
        const amount = ethers.parseEther("1.0");
        const params = {
            categoryId: 0,
            freelancer: freelancer.address,
            token: ethers.ZeroAddress,
            amount: amount,
            ipfsHash: "ipfs://hash",
            deadline: 0,
            mAmounts: [],
            mHashes: []
        };
        await escrow.connect(client).createJob(params, { value: amount });

        // Accept job (requires freelancer stake)
        const stake = amount / 10n; // 10%
        await escrow.connect(freelancer).acceptJob(1, { value: stake });

        const vault = owner.address;
        await escrow.setVault(vault);
        await escrow.setPlatformFee(250); // 2.5%

        const initialVaultBalance = await ethers.provider.getBalance(vault);
        await escrow.connect(client).releaseFunds(1);

        const finalVaultBalance = await ethers.provider.getBalance(vault);
        const platformFee = (amount * 250n) / 10000n;

        // Vault should receive platform fee
        expect(finalVaultBalance - initialVaultBalance).to.equal(platformFee);
    });

    it("Should allow client to reclaim funds after deadline", async function () {
        const amount = ethers.parseEther("1.0");
        const block = await ethers.provider.getBlock("latest");
        const deadline = block.timestamp + 86400; // 1 day from now

        const params = {
            categoryId: 0,
            freelancer: freelancer.address,
            token: ethers.ZeroAddress,
            amount: amount,
            ipfsHash: "ipfs://hash",
            deadline: deadline,
            mAmounts: [],
            mHashes: []
        };
        await escrow.connect(client).createJob(params, { value: amount });

        // Advance time by 2 days
        await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60]);
        await ethers.provider.send("evm_mine");

        const initialClientBalance = await ethers.provider.getBalance(client.address);

        // Use a gas price for accurate balance checking
        const tx = await escrow.connect(client).refundExpiredJob(1);
        const receipt = await tx.wait();
        const gasUsed = receipt.gasUsed * receipt.gasPrice;

        const finalClientBalance = await ethers.provider.getBalance(client.address);
        expect(finalClientBalance + gasUsed - initialClientBalance).to.equal(amount);

        const job = await escrow.jobs(1);
        expect(job.status).to.equal(6); // JobStatus.Cancelled
    });
});
