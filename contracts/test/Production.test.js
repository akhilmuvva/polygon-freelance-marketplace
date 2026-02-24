const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("PolyLance Production Suite", function () {
    let escrow, polyToken, usdc, sbt, reputation, insurance, privacy, governance, completionSBT;
    let owner, client, freelancer, arbitrator, vault, other;

    const INITIAL_SUPPLY = ethers.parseEther("1000000");
    const JOB_AMOUNT = ethers.parseUnits("1000", 6); // 1000 USDC
    const REWARD_AMOUNT = ethers.parseEther("100");

    beforeEach(async function () {
        [owner, client, freelancer, arbitrator, vault, other] = await ethers.getSigners();

        // 1. Deploy Mock USDC
        const MockERC20Factory = await ethers.getContractFactory("MockERC20");
        usdc = await MockERC20Factory.deploy("USD Coin", "USDC");
        await usdc.waitForDeployment();

        // 2. Deploy PolyToken
        const TokenFactory = await ethers.getContractFactory("PolyToken");
        polyToken = await TokenFactory.deploy(owner.address);
        await polyToken.waitForDeployment();

        // 3. Deploy InsurancePool
        const InsuranceFactory = await ethers.getContractFactory("InsurancePool");
        insurance = await InsuranceFactory.deploy(owner.address);
        await insurance.waitForDeployment();

        // 4. Deploy FreelancerReputation (UUPS)
        const RepFactory = await ethers.getContractFactory("FreelancerReputation");
        reputation = await upgrades.deployProxy(RepFactory, [owner.address, "https://rep.uri/"], { kind: "uups" });
        await reputation.waitForDeployment();

        // 5. Deploy FreelanceSBT
        const SBTFactory = await ethers.getContractFactory("FreelanceSBT");
        sbt = await SBTFactory.deploy(owner.address, owner.address); // Temporarily owner as minter
        await sbt.waitForDeployment();


        // 7. Deploy Forwarder
        const Forwarder = await ethers.getContractFactory("PolyLanceForwarder");
        const forwarder = await Forwarder.deploy();
        await forwarder.waitForDeployment();

        // 8. Deploy Escrow (Proxy)
        const EscrowFactory = await ethers.getContractFactory("FreelanceEscrow");
        escrow = await upgrades.deployProxy(EscrowFactory, [
            owner.address,
            await forwarder.getAddress(),
            await sbt.getAddress(),
            owner.address // dummy entrypoint
        ], { kind: "uups" });
        await escrow.waitForDeployment();

        // 9. Deploy PolyCompletionSBT (Now that we have escrow address)
        const CompletionSBTFactory = await ethers.getContractFactory("PolyCompletionSBT");
        completionSBT = await CompletionSBTFactory.deploy(owner.address, await escrow.getAddress());
        await completionSBT.waitForDeployment();

        // 8. Deploy PrivacyShield
        const PrivacyFactory = await ethers.getContractFactory("PrivacyShield");
        privacy = await PrivacyFactory.deploy(owner.address);
        await privacy.waitForDeployment();

        // 9. Deploy Governance
        const GovFactory = await ethers.getContractFactory("FreelanceGovernance");
        governance = await GovFactory.deploy(await sbt.getAddress());
        await governance.waitForDeployment();

        // 10. Setup Roles & Links
        await escrow.setPolyToken(await polyToken.getAddress());
        await escrow.setVault(vault.address);
        await escrow.setReputationContract(await reputation.getAddress());
        await escrow.setSBTContract(await sbt.getAddress());
        await escrow.setCompletionCertContract(await completionSBT.getAddress());

        await polyToken.grantRole(await polyToken.MINTER_ROLE(), await escrow.getAddress());
        await reputation.grantRole(await reputation.MINTER_ROLE(), await escrow.getAddress());
        await sbt.grantRole(await sbt.MINTER_ROLE(), await escrow.getAddress());

        await escrow.setTokenWhitelist(await usdc.getAddress(), true);

        // 11. Fund accounts
        await usdc.mint(client.address, JOB_AMOUNT * 10n);
        await usdc.mint(freelancer.address, JOB_AMOUNT);
        await usdc.connect(client).approve(await escrow.getAddress(), ethers.MaxUint256);
        await usdc.connect(freelancer).approve(await escrow.getAddress(), ethers.MaxUint256);
    });

    describe("Full Job Lifecycle (ERC20)", function () {
        it("Processes a standard job from creation to completion with SBTs and Reputation", async function () {
            const params = {
                categoryId: 1,
                freelancer: ethers.ZeroAddress,
                token: await usdc.getAddress(),
                amount: JOB_AMOUNT,
                ipfsHash: "ipfs://job",
                deadline: 7,
                mAmounts: [],
                mHashes: []
            };
            await escrow.connect(client).createJob(params);

            await escrow.connect(freelancer).applyForJob(1);
            await escrow.connect(client).pickFreelancer(1, freelancer.address);
            await escrow.connect(freelancer).acceptJob(1);
            await escrow.connect(freelancer).submitWork(1, "ipfs://work");

            // Before release, check initial state
            expect(await reputation.balanceOf(freelancer.address, 1)).to.equal(0);

            await escrow.connect(client).releaseFunds(1);

            // Verify Payouts
            const platformFee = (JOB_AMOUNT * 250n) / 10000n;
            expect(await usdc.balanceOf(vault.address)).to.equal(platformFee);

            // Verify Rewards
            expect(await polyToken.balanceOf(freelancer.address)).to.equal(REWARD_AMOUNT);

            // Verify Reputation & SBTs
            expect(await reputation.balanceOf(freelancer.address, 1)).to.be.gt(0);
            expect(await sbt.balanceOf(freelancer.address)).to.equal(1);
            expect(await completionSBT.balanceOf(freelancer.address)).to.equal(1);
        });

        it("Handles Milestone-based Jobs correctly", async function () {
            const mAmounts = [JOB_AMOUNT / 2n, JOB_AMOUNT / 2n];
            const mDescs = ["Phase 1", "Phase 2"];

            const params = {
                categoryId: 1,
                freelancer: freelancer.address,
                token: await usdc.getAddress(),
                amount: JOB_AMOUNT,
                ipfsHash: "ipfs://ms",
                deadline: 0,
                mAmounts: mAmounts,
                mHashes: mDescs
            };
            await escrow.connect(client).createJob(params);

            await escrow.connect(freelancer).acceptJob(1);

            // Release Milestone 1
            await escrow.connect(client).releaseMilestone(1, 0);
            const balAfterM1 = await usdc.balanceOf(freelancer.address);
            // 500 - fees (2.5% + 1% = 3.5%) + 10% stake returned? 
            // actually freelancerStake is returned at the very end.
            expect(balAfterM1).to.be.gt(0);

            // Complete job after last milestone
            await escrow.connect(freelancer).submitWork(1, "ipfs://done");
            await escrow.connect(client).releaseFunds(1);

            const job = await escrow.jobs(1);
            expect(job.status).to.equal(5); // Completed
        });
    });

    describe("Dispute & Arbitration", function () {
        it("Arbitrator can resolve dispute with specific bps", async function () {
            // Deploy MockArbitrator
            const MockArbitrator = await ethers.getContractFactory("MockArbitrator");
            const arbitrator = await MockArbitrator.deploy();
            await arbitrator.waitForDeployment();

            // Set arbitrator
            await escrow.setArbitrator(await arbitrator.getAddress());

            const params = {
                categoryId: 1,
                freelancer: freelancer.address,
                token: await usdc.getAddress(),
                amount: JOB_AMOUNT,
                ipfsHash: "ipfs://j",
                deadline: 7,
                mAmounts: [],
                mHashes: []
            };
            await escrow.connect(client).createJob(params);

            await escrow.connect(freelancer).acceptJob(1);
            await escrow.connect(client).dispute(1);

            const initialFreelancer = await usdc.balanceOf(freelancer.address);
            await escrow.connect(owner).resolveDisputeManual(1, 3000); // 30% to freelancer

            expect(await usdc.balanceOf(freelancer.address)).to.be.gt(initialFreelancer);
        });
    });

    describe("Privacy & Governance", function () {
        it("PrivacyShield: User can commit and admin can verify", async function () {
            const commitment = ethers.keccak256(ethers.toUtf8Bytes("secret identity"));
            await privacy.connect(freelancer).commitIdentity(commitment);
            expect(await privacy.identityHashes(freelancer.address)).to.equal(commitment);

            await privacy.connect(owner).verifyReputationProof(freelancer.address, "0x", 100);
            expect(await privacy.isVerified(freelancer.address)).to.be.true;
        });

        it("Governance: Users with SBTs can propose and vote", async function () {
            // Need 5 SBTs for proposal in FreelanceGovernance.sol
            // Let's grant them to owner for testing
            // Wait, FreelanceGovernance uses sbtContract which is FreelanceSBT
            // SBT minter is owner.
            for (let i = 0; i < 5; i++) {
                await sbt.safeMint(owner.address, "ipfs://rep");
            }

            await governance.connect(owner).createProposal("Increase platform rewards");
            expect(await governance.proposalCount()).to.equal(1);

            await governance.connect(owner).vote(1, true);
            const prop = await governance.proposals(1);
            expect(prop.forVotes).to.equal(5);

            await time.increase(4 * 24 * 60 * 60); // 4 days (> 3 days period)
            await governance.executeProposal(1);
            const propAfter = await governance.proposals(1);
            expect(propAfter.executed).to.be.true;
        });
    });

    describe("InsurancePool Payouts", function () {
        it("Owner can payout from insurance pool", async function () {
            // Send some funds to insurance pool
            await usdc.mint(owner.address, JOB_AMOUNT);
            await usdc.connect(owner).approve(await insurance.getAddress(), JOB_AMOUNT);
            await insurance.deposit(await usdc.getAddress(), JOB_AMOUNT);

            const initialOther = await usdc.balanceOf(other.address);
            await insurance.payout(await usdc.getAddress(), other.address, 100n);
            expect(await usdc.balanceOf(other.address)).to.equal(initialOther + 100n);
        });
    });
});
