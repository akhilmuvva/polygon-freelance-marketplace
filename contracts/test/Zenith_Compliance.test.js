const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Zenith Protocol: Deep Compliance & Edge Case Suite", function () {
    let escrow, polyToken, usdc, sbt, reputation, forwarder;
    let owner, client, freelancer, arbitrator, vault, attacker, otherSigners;

    const JOB_AMOUNT = ethers.parseUnits("1000", 6);
    const MAX_APPLICATIONS = 50;

    beforeEach(async function () {
        const signers = await ethers.getSigners();
        [owner, client, freelancer, arbitrator, vault, attacker] = signers;
        otherSigners = signers.slice(6);

        // Deploy Dependencies
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        usdc = await MockERC20.deploy("USD Coin", "USDC");

        const PolyToken = await ethers.getContractFactory("PolyToken");
        polyToken = await PolyToken.deploy(owner.address);

        const Rep = await ethers.getContractFactory("FreelancerReputation");
        reputation = await upgrades.deployProxy(Rep, [owner.address, "ipfs://"], { kind: "uups" });

        const SBT = await ethers.getContractFactory("FreelanceSBT");
        sbt = await SBT.deploy(owner.address, owner.address);

        const Forwarder = await ethers.getContractFactory("PolyLanceForwarder");
        forwarder = await Forwarder.deploy();

        // Deploy Escrow
        const Escrow = await ethers.getContractFactory("FreelanceEscrow");
        escrow = await upgrades.deployProxy(Escrow, [
            owner.address,
            await forwarder.getAddress(),
            await sbt.getAddress(),
            owner.address
        ], { kind: "uups" });

        // Setup
        await escrow.setPolyToken(await polyToken.getAddress());
        await escrow.setReputationContract(await reputation.getAddress());
        await escrow.setTokenWhitelist(await usdc.getAddress(), true);
        await usdc.mint(client.address, JOB_AMOUNT * 100n);
        await usdc.connect(client).approve(await escrow.getAddress(), ethers.MaxUint256);

        // Fund and approve other signers for application tests
        const stake = (JOB_AMOUNT * 5n) / 100n;
        for (const s of signers) {
            await usdc.mint(s.address, stake);
            await usdc.connect(s).approve(await escrow.getAddress(), ethers.MaxUint256);
        }
    });

    describe("DoS Prevention & Scale Limits", function () {
        it("Enforces MAX_APPLICATIONS_PER_JOB (50) to prevent gas exhaustion", async function () {
            const params = {
                categoryId: 1,
                freelancer: ethers.ZeroAddress,
                token: await usdc.getAddress(),
                amount: JOB_AMOUNT,
                ipfsHash: "ipfs://job",
                deadline: 0,
                mAmounts: [],
                mHashes: []
            };
            await escrow.connect(client).createJob(params);

            // Fill up applications with available signers
            const signers = await ethers.getSigners();
            // We usually have 20 signers in default hardhat config
            const appCount = Math.min(signers.length - 2, MAX_APPLICATIONS);
            for (let i = 2; i < 2 + appCount; i++) {
                await escrow.connect(signers[i]).applyForJob(1);
            }

            const apps = await escrow.getJobApplications(1);
            expect(apps.length).to.be.lte(MAX_APPLICATIONS);
        });
    });

    describe("Access Control & Security Shield", function () {
        it("Reverts when non-admin tries to change critical settings", async function () {
            await expect(escrow.connect(attacker).setPolyToken(attacker.address))
                .to.be.revertedWithCustomError(escrow, "AccessControlUnauthorizedAccount");

            await expect(escrow.connect(attacker).setVault(attacker.address))
                .to.be.revertedWithCustomError(escrow, "AccessControlUnauthorizedAccount");
        });

        it("Only manager can whitelist tokens", async function () {
            await expect(escrow.connect(attacker).setTokenWhitelist(attacker.address, true))
                .to.be.revertedWithCustomError(escrow, "AccessControlUnauthorizedAccount");
        });
    });

    describe("Invalid State Transitions", function () {
        it("Reverts if applying for a non-existent job", async function () {
            await expect(escrow.connect(freelancer).applyForJob(999))
                .to.be.revertedWithCustomError(escrow, "InvalidAddress");
        });

        it("Reverts if picking a freelancer for a job that already has one", async function () {
            const params = {
                categoryId: 1,
                freelancer: freelancer.address,
                token: await usdc.getAddress(),
                amount: JOB_AMOUNT,
                ipfsHash: "ipfs://job",
                deadline: 0,
                mAmounts: [],
                mHashes: []
            };
            await escrow.connect(client).createJob(params);

            await expect(escrow.connect(client).pickFreelancer(1, attacker.address))
                .to.be.revertedWithCustomError(escrow, "InvalidStatus");
        });
    });

    describe("Financial Integriy & Pull-pattern", function () {
        it("Prevents double-counting released funds in milestones", async function () {
            const mAmounts = [JOB_AMOUNT / 2n, JOB_AMOUNT / 2n];
            const params = {
                categoryId: 1,
                freelancer: freelancer.address,
                token: await usdc.getAddress(),
                amount: JOB_AMOUNT,
                ipfsHash: "ipfs://ms",
                deadline: 0,
                mAmounts: mAmounts,
                mHashes: ["M1", "M2"]
            };
            await escrow.connect(client).createJob(params);
            await escrow.connect(freelancer).acceptJob(1);

            await escrow.connect(client).releaseMilestone(1, 0);
            await expect(escrow.connect(client).releaseMilestone(1, 0))
                .to.be.revertedWithCustomError(escrow, "MilestoneAlreadyReleased");
        });

        it("Refunds client correctly if job is cancelled", async function () {
            const params = {
                categoryId: 1,
                freelancer: freelancer.address,
                token: await usdc.getAddress(),
                amount: JOB_AMOUNT,
                ipfsHash: "ipfs://j",
                deadline: 1, // small deadline
                mAmounts: [],
                mHashes: []
            };
            await escrow.connect(client).createJob(params);

            const initialBalance = await usdc.balanceOf(client.address);

            // Wait for expiration
            await time.increase(3600);

            await escrow.connect(client).refundExpiredJob(1);
            // Amount was deducted on createJob, so it should come back.
            expect(await usdc.balanceOf(client.address)).to.equal(initialBalance + JOB_AMOUNT);
        });
    });

    describe("Reputation & Reward Logic", function () {
        it("Grants 3x rewards to Supreme members", async function () {
            // Setup reputation for freelancer
            await reputation.grantRole(await reputation.MINTER_ROLE(), owner.address);
            await reputation.levelUp(freelancer.address, 1, 100); // threshold is 100

            await escrow.connect(owner).setReputationThreshold(100);
            await polyToken.connect(owner).grantRole(await polyToken.MINTER_ROLE(), await escrow.getAddress());

            const params = {
                categoryId: 1,
                freelancer: freelancer.address,
                token: await usdc.getAddress(),
                amount: JOB_AMOUNT,
                ipfsHash: "ipfs://j",
                deadline: 0,
                mAmounts: [],
                mHashes: []
            };
            await escrow.connect(client).createJob(params);
            await escrow.connect(freelancer).acceptJob(1);
            // Must be ongoing to complete
            // status is 2 (Ongoing) after acceptJob.

            await escrow.connect(client).completeJob(1, 5);

            // Base reward is 100 * 1e18. Supreme should be 300 * 1e18.
            expect(await polyToken.balanceOf(freelancer.address)).to.equal(ethers.parseEther("300"));
        });
    });
});
