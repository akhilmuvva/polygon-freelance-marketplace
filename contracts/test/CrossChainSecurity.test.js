const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("CrossChainSecurity", function () {
    let escrow, adapter, admin, user, attacker, bridge;
    let token;

    beforeEach(async function () {
        const signers = await ethers.getSigners();
        admin = signers[0];
        user = ethers.Wallet.createRandom().connect(ethers.provider);
        attacker = ethers.Wallet.createRandom().connect(ethers.provider);
        bridge = ethers.Wallet.createRandom().connect(ethers.provider);

        // Fund random wallets
        await signers[0].sendTransaction({ to: user.address, value: ethers.parseEther("1") });
        await signers[0].sendTransaction({ to: attacker.address, value: ethers.parseEther("1") });
        await signers[0].sendTransaction({ to: bridge.address, value: ethers.parseEther("1") });

        // Deploy Mock Token
        const Token = await ethers.getContractFactory("PolyToken");
        token = await Token.deploy();

        const forwarder = ethers.Wallet.createRandom().address;
        // Deploy Escrow
        const Escrow = await ethers.getContractFactory("FreelanceEscrow");
        escrow = await upgrades.deployProxy(Escrow, [
            admin.address,
            forwarder, // dedicated forwarder
            admin.address, // sbt
            admin.address  // entrypoint
        ], { kind: 'uups' });

        // Deploy Adapter (Mocking CCIP Router)
        const Adapter = await ethers.getContractFactory("CCIPPaymentAdapter");
        // For testing we just use admin as router
        adapter = await Adapter.deploy(admin.address, await escrow.getAddress());

        // Grant BRIDGE_ROLE to adapter
        const BRIDGE_ROLE = await escrow.BRIDGE_ROLE();
        const MANAGER_ROLE = await escrow.MANAGER_ROLE();
        
        await escrow.connect(admin).grantRole(BRIDGE_ROLE, await adapter.getAddress());
        await escrow.connect(admin).grantRole(MANAGER_ROLE, admin.address);
        await escrow.connect(admin).setTokenWhitelist(await token.getAddress(), true);
    });

    describe("Access Control", function () {
        it("Should only allow BRIDGE_ROLE to call createJobFor", async function () {
            const params = {
                categoryId: 1,
                freelancer: user.address,
                token: await token.getAddress(),
                amount: ethers.parseEther("100"),
                ipfsHash: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
                deadline: Math.floor(Date.now() / 1000) + 86400,
                mAmounts: [ethers.parseEther("100")],
                mHashes: ["Step 1"],
                mIsUpfront: [false],
                yieldStrategy: 0,
                paymentToken: await token.getAddress(),
                paymentAmount: ethers.parseEther("100"),
                minAmountOut: 0,
                zkRequired: false
            };

            await expect(
                escrow.connect(attacker).createJobFor(user.address, params)
            ).to.be.revertedWithCustomError(escrow, "AccessControlUnauthorizedAccount");
        });

        it("Should allow authorized adapter to create job", async function () {
            const params = {
                categoryId: 1,
                freelancer: user.address,
                token: await token.getAddress(),
                amount: ethers.parseEther("100"),
                ipfsHash: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
                deadline: Math.floor(Date.now() / 1000) + 86400,
                mAmounts: [ethers.parseEther("100")],
                mHashes: ["Step 1"],
                mIsUpfront: [false],
                yieldStrategy: 0,
                paymentToken: await token.getAddress(),
                paymentAmount: ethers.parseEther("100"),
                minAmountOut: 0,
                zkRequired: false
            };

            // Transfer tokens to bridge (simulating caller having funds)
            await token.transfer(bridge.address, ethers.parseEther("100"));
            await token.connect(bridge).approve(await escrow.getAddress(), ethers.parseEther("100"));

            const BRIDGE_ROLE = await escrow.BRIDGE_ROLE();
            await escrow.connect(admin).grantRole(BRIDGE_ROLE, bridge.address);
            
            await expect(
                escrow.connect(bridge).createJobFor(user.address, params)
            ).to.emit(escrow, "JobCreated");
        });
    });

    describe("DoS Mitigation", function () {
        it("Should enforce creation cooldown on createJobFor", async function () {
            const params = {
                categoryId: 1,
                freelancer: user.address,
                token: await token.getAddress(),
                amount: ethers.parseEther("100"),
                ipfsHash: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
                deadline: Math.floor(Date.now() / 1000) + 100000,
                mAmounts: [ethers.parseEther("100")],
                mHashes: ["Step 1"],
                mIsUpfront: [false],
                yieldStrategy: 0,
                paymentToken: await token.getAddress(),
                paymentAmount: ethers.parseEther("100"),
                minAmountOut: 0,
                zkRequired: false
            };

            await token.transfer(bridge.address, ethers.parseEther("200"));
            await token.connect(bridge).approve(await escrow.getAddress(), ethers.parseEther("200"));
            
            const BRIDGE_ROLE = await escrow.BRIDGE_ROLE();
            await escrow.connect(admin).grantRole(BRIDGE_ROLE, bridge.address);

            // First creation
            await escrow.connect(bridge).createJobFor(user.address, params);
            
            // Second creation (immediate)
            await expect(
                escrow.connect(bridge).createJobFor(user.address, params)
            ).to.be.revertedWithCustomError(escrow, "NotAuthorized");
        });
    });
});
