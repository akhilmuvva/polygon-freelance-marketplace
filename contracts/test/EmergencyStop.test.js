const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("FreelanceEscrow Emergency Stop (Circuit Breaker)", function () {
    let escrow, owner, client, freelancer, other;
    let JOB_PARAMS;

    beforeEach(async function () {
        [owner, client, freelancer, other] = await ethers.getSigners();

        // Deploy Forwarder
        const Forwarder = await ethers.getContractFactory("PolyLanceForwarder");
        const forwarder = await Forwarder.deploy();
        await forwarder.waitForDeployment();

        // Deploy SBT
        const SBT = await ethers.getContractFactory("FreelanceSBT");
        const sbt = await SBT.deploy(owner.address, owner.address);
        await sbt.waitForDeployment();

        // Deploy Escrow
        const FreelanceEscrow = await ethers.getContractFactory("FreelanceEscrow");
        escrow = await upgrades.deployProxy(FreelanceEscrow, [
            owner.address,
            await forwarder.getAddress(),
            await sbt.getAddress(),
            owner.address // dummy entrypoint
        ], {
            initializer: "initialize",
            kind: "uups",
        });
        await escrow.waitForDeployment();

        JOB_PARAMS = {
            categoryId: 1,
            freelancer: freelancer.address,
            token: ethers.ZeroAddress,
            amount: ethers.parseEther("1.0"),
            ipfsHash: "ipfs://job",
            deadline: 0,
            mAmounts: [],
            mHashes: [],
            mIsUpfront: []
        };
    });

    it("Should allow admin to pause and unpause", async function () {
        await escrow.pause();
        expect(await escrow.paused()).to.be.true;

        await escrow.unpause();
        expect(await escrow.paused()).to.be.false;
    });

    it("Should prevent job creation when paused", async function () {
        await escrow.pause();
        await expect(
            escrow.connect(client).createJob(JOB_PARAMS, { value: JOB_PARAMS.amount })
        ).to.be.revertedWithCustomError(escrow, "EnforcedPause");
    });

    it("Should prevent fund release when paused", async function () {
        // Create job while unpaused
        await escrow.connect(client).createJob(JOB_PARAMS, { value: JOB_PARAMS.amount });

        await escrow.pause();

        await expect(
            escrow.connect(client).releaseFunds(1)
        ).to.be.revertedWithCustomError(escrow, "EnforcedPause");
    });

    it("Should prevent milestone release when paused", async function () {
        const paramsWithMilestones = {
            ...JOB_PARAMS,
            mAmounts: [ethers.parseEther("0.5"), ethers.parseEther("0.5")],
            mHashes: ["M1", "M2"],
            mIsUpfront: [false, false]
        };
        await escrow.connect(client).createJob(paramsWithMilestones, { value: JOB_PARAMS.amount });

        await escrow.pause();

        await expect(
            escrow.connect(client).releaseMilestone(1, 0)
        ).to.be.revertedWithCustomError(escrow, "EnforcedPause");
    });

    it("Should prevent raising disputes when paused", async function () {
        await escrow.connect(client).createJob(JOB_PARAMS, { value: JOB_PARAMS.amount });

        await escrow.pause();

        await expect(
            escrow.connect(client).raiseDispute(1)
        ).to.be.revertedWithCustomError(escrow, "EnforcedPause");
    });

    it("Should prevent manual dispute resolution when paused", async function () {
        await escrow.connect(client).createJob(JOB_PARAMS, { value: JOB_PARAMS.amount });
        await escrow.connect(client).raiseDispute(1);

        await escrow.pause();

        await expect(
            escrow.connect(owner).resolveDisputeManual(1, 5000)
        ).to.be.revertedWithCustomError(escrow, "EnforcedPause");
    });

    it("Should work normally after unpausing", async function () {
        await escrow.pause();
        await escrow.unpause();

        await expect(
            escrow.connect(client).createJob(JOB_PARAMS, { value: JOB_PARAMS.amount })
        ).to.not.be.reverted;

        expect(await escrow.jobCount()).to.equal(1);
    });
});
