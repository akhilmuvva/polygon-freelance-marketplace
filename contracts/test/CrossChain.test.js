const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CrossChain Suite Integration", function () {
    let deployer, client, freelancer, arbitrator;
    let router, lzEndpoint, wormhole;
    let token, bridge, escrowManager, reputation, governance, dispute, wormholeAdapter;

    const DEST_CHAIN_SELECTOR = "16015286601757825753"; // Sepolia
    const DEST_EID = 30101; // Sepolia
    const SRC_CHAIN_ID = 137; // Polygon

    beforeEach(async function () {
        [deployer, client, freelancer, arbitrator] = await ethers.getSigners();

        // 1. Deploy Mocks
        const MockRouter = await ethers.getContractFactory("MockCCIPRouter");
        router = await MockRouter.deploy();

        const MockLZ = await ethers.getContractFactory("MockLayerZeroEndpointV2");
        lzEndpoint = await MockLZ.deploy(SRC_CHAIN_ID);

        const MockWormhole = await ethers.getContractFactory("MockWormhole");
        wormhole = await MockWormhole.deploy();

        const MockToken = await ethers.getContractFactory("PolyToken");
        token = await MockToken.deploy();
        await token.waitForDeployment();

        // 2. Deploy CCIP Contracts
        const CCIPTokenBridge = await ethers.getContractFactory("CCIPTokenBridge");
        bridge = await CCIPTokenBridge.deploy(router.target, deployer.address);

        const CrossChainEscrowManager = await ethers.getContractFactory("CrossChainEscrowManager");
        escrowManager = await CrossChainEscrowManager.deploy(router.target, deployer.address);

        // 3. Deploy LayerZero Contracts
        const OmniReputation = await ethers.getContractFactory("OmniReputation");
        reputation = await OmniReputation.deploy(lzEndpoint.target, deployer.address);

        const OmniGovernance = await ethers.getContractFactory("OmniGovernance");
        governance = await OmniGovernance.deploy(lzEndpoint.target, deployer.address);

        const OmniDispute = await ethers.getContractFactory("OmniDispute");
        dispute = await OmniDispute.deploy(lzEndpoint.target, deployer.address);

        // 4. Deploy Wormhole Contracts
        const WormholeAdapter = await ethers.getContractFactory("WormholeAdapter");
        const solanaProgram = ethers.ZeroHash;
        wormholeAdapter = await WormholeAdapter.deploy(wormhole.target, solanaProgram, deployer.address);

        // Setup CCIP whitelisting
        await bridge.allowlistDestinationChain(DEST_CHAIN_SELECTOR, true);
        await bridge.allowlistToken(token.target, true);
        await escrowManager.allowlistDestinationChain(DEST_CHAIN_SELECTOR, true);
    });

    describe("CCIPTokenBridge", function () {
        it("Should bridge tokens to another chain", async function () {
            const amount = ethers.parseEther("100");
            await token.mint(client.address, amount);
            await token.connect(client).approve(bridge.target, amount);

            const fee = ethers.parseEther("0.1");
            await expect(bridge.connect(client).bridgeTokensToChain(
                DEST_CHAIN_SELECTOR,
                freelancer.address,
                token.target,
                amount,
                { value: fee }
            )).to.emit(bridge, "TokensBridged");
        });
    });

    describe("CrossChainEscrowManager", function () {
        it("Should create a cross-chain job", async function () {
            const amount = ethers.parseEther("500");
            await token.mint(client.address, amount);
            await token.connect(client).approve(escrowManager.target, amount);

            const fee = ethers.parseEther("0.1");
            const createParams = {
                title: "Test Job",
                description: "Cross-chain test",
                amount: amount,
                token: token.target,
                freelancer: freelancer.address,
                deadline: Math.floor(Date.now() / 1000) + 3600
            };

            await expect(escrowManager.connect(client).createCrossChainJob(
                SRC_CHAIN_ID,
                DEST_CHAIN_SELECTOR,
                createParams,
                { value: fee }
            )).to.emit(escrowManager, "CrossChainJobCreated");
        });
    });

    describe("OmniReputation", function () {
        it("Should sync reputation across chains", async function () {
            const fee = ethers.parseEther("0.05");
            await expect(reputation.connect(deployer).syncReputation(
                DEST_EID,
                client.address,
                100, // score
                "0x", // options
                { value: fee }
            )).to.emit(reputation, "ReputationSynced");
        });
    });

    describe("OmniGovernance", function () {
        it("Should create a cross-chain proposal", async function () {
            const targetChains = [DEST_EID];
            const targets = [client.address];
            const values = [0];
            const calldatas = ["0x"];
            const description = "Test Proposal";

            await expect(governance.propose(
                targetChains,
                targets,
                values,
                calldatas,
                description
            )).to.emit(governance, "ProposalCreated");
        });
    });

    describe("OmniDispute", function () {
        it("Should initiate a dispute", async function () {
            await expect(dispute.initiateDispute(
                123, // jobId
                DEST_EID,
                client.address,
                freelancer.address,
                "ipfs://evidence"
            )).to.emit(dispute, "DisputeInitiated");
        });
    });

    describe("WormholeAdapter", function () {
        it("Should send message to Solana", async function () {
            const payload = ethers.toUtf8Bytes("hello solana");
            await expect(wormholeAdapter.sendToSolana(payload, { value: ethers.parseEther("0.01") }))
                .to.emit(wormholeAdapter, "MessageSent");
        });
    });
});
