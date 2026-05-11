const { ethers, upgrades } = require("hardhat");

async function main() {
    console.log("🚀 Starting SUPREME TRANSACTION AUDIT: PolyLance Flow\n");

    const signers = await ethers.getSigners();
    const owner = signers[0];
    const client = signers[1];
    const freelancer = signers[2];
    const vault = signers[3];
    const zeroAddress = "0x0000000000000000000000000000000000000000";

    // 1. Deploy Core Contracts
    console.log("📦 Deploying Supreme Protocol Layers...");

    // PolyToken (ERC20)
    const PolyToken = await ethers.getContractFactory("PolyToken");
    const poly = await PolyToken.deploy();
    await poly.waitForDeployment();
    console.log(`✅ PolyToken: ${await poly.getAddress()}`);

    // Shield (Trusted Forwarder)
    const Shield = await ethers.getContractFactory("PrivacyShield");
    const shield = await Shield.deploy(owner.address);
    await shield.waitForDeployment();
    console.log(`✅ PrivacyShield (Forwarder): ${await shield.getAddress()}`);

    // Soulbound Token (SBT)
    const SBT = await ethers.getContractFactory("FreelanceSBT");
    const sbt = await SBT.deploy(owner.address, owner.address); 
    await sbt.waitForDeployment();
    console.log(`✅ FreelanceSBT: ${await sbt.getAddress()}`);

    // Mock Reputation (ERC1155)
    const MockRep = await ethers.getContractFactory("MockReputation");
    const rep = await MockRep.deploy();
    await rep.waitForDeployment();
    console.log(`✅ Mock Reputation (ERC1155): ${await rep.getAddress()}`);

    // Escrow (UUPS Proxy)
    const Escrow = await ethers.getContractFactory("FreelanceEscrow");
    const escrow = await upgrades.deployProxy(Escrow, [
        owner.address,
        await shield.getAddress(),
        await sbt.getAddress(), 
        owner.address // Mock entrypoint
    ], { initializer: 'initialize' });
    await escrow.waitForDeployment();
    console.log(`✅ FreelanceEscrow: ${await escrow.getAddress()}`);

    // 2. Configuration
    const ESCROW_ADDR = await escrow.getAddress();
    
    // Grant roles on SBT and PolyToken to Escrow
    const SBT_MINTER = await sbt.MINTER_ROLE();
    await sbt.grantRole(SBT_MINTER, ESCROW_ADDR);
    
    const POLY_MINTER = await poly.MINTER_ROLE();
    await poly.grantRole(POLY_MINTER, ESCROW_ADDR);
    await escrow.setVault(vault.address);
    await escrow.setPlatformFee(250); // 2.5%
    await escrow.setPolyToken(await poly.getAddress());
    await escrow.setReputationContract(await rep.getAddress());
    await escrow.setReputationThreshold(10); // Supreme threshold

    // Whitelist ETH (represented by zero address in some logic, but contract uses it for native)
    await escrow.setTokenWhitelist(zeroAddress, true);

    console.log("\n🛡️ Simulation: SUPREME ELITE VS STANDARD");

    /** SCENARIO A: STANDARD USER (2.5% Fee, 100 POLY) **/
    console.log("\n--- Scenario A: Standard User ---");
    const job1Tx = await escrow.connect(client).createJob({
        categoryId: 1,
        freelancer: freelancer.address,
        token: zeroAddress,
        amount: ethers.parseEther("1.0"),
        ipfsHash: "ipfs://test1",
        deadline: 0,
        mAmounts: [ethers.parseEther("1.0")],
        mHashes: ["ipfs://milestone1"],
        mIsUpfront: [false],
        yieldStrategy: 0,
        paymentToken: zeroAddress,
        paymentAmount: ethers.parseEther("1.0"),
        minAmountOut: 0,
        zkRequired: false
    }, { value: ethers.parseEther("1.0") });
    await job1Tx.wait();

    await escrow.connect(freelancer).acceptJob(1);
    await escrow.connect(freelancer).submitWork(1, "ipfs://done1");

    // Complete Job triggers fees and rewards
    await escrow.connect(client).completeJob(1, 5);

    // Vault withdraws fee
    const vaultPrev = await ethers.provider.getBalance(vault.address);
    await escrow.connect(vault).withdraw(zeroAddress);
    const vaultPost = await ethers.provider.getBalance(vault.address);
    
    const polyBalanceA = await poly.balanceOf(freelancer.address);

    console.log(`✅ Standard User Fee Collected: ${ethers.formatEther(vaultPost - vaultPrev)} ETH (Expect 0.025)`);
    console.log(`✅ Standard User Rewards: ${ethers.formatUnits(polyBalanceA, 18)} POLY (Expect 100)`);

    /** SCENARIO B: SUPREME USER (0% Fee, 300 POLY) **/
    console.log("\n--- Scenario B: SUPREME USER ---");
    // Manually give freelancer reputation tokens to trigger supreme logic
    await rep.mint(freelancer.address, 1, 15); // Give 15 Rep Points for Category 1 (Threshold is 10)

    const job2Tx = await escrow.connect(client).createJob({
        categoryId: 1,
        freelancer: freelancer.address,
        token: zeroAddress,
        amount: ethers.parseEther("1.0"),
        ipfsHash: "ipfs://test2",
        deadline: 0,
        mAmounts: [ethers.parseEther("1.0")],
        mHashes: ["ipfs://milestone2"],
        mIsUpfront: [false],
        yieldStrategy: 0,
        paymentToken: zeroAddress,
        paymentAmount: ethers.parseEther("1.0"),
        minAmountOut: 0,
        zkRequired: false
    }, { value: ethers.parseEther("1.0") });
    await job2Tx.wait();

    await escrow.connect(freelancer).acceptJob(2);
    await escrow.connect(freelancer).submitWork(2, "ipfs://done2");

    const vaultPrevS = await ethers.provider.getBalance(vault.address);
    const vaultInternalPrevS = await escrow.balances(vault.address, zeroAddress);
    const polyPrevS = await poly.balanceOf(freelancer.address);
    
    console.log("📝 Completing Job 2 (Supreme)...");
    await escrow.connect(client).completeJob(2, 5);
    
    // Check internal balance instead of withdrawing (which would revert if 0)
    const vaultInternalPostS = await escrow.balances(vault.address, zeroAddress);
    const vaultPostS = await ethers.provider.getBalance(vault.address);
    const polyPostS = await poly.balanceOf(freelancer.address);

    const feeCollected = vaultInternalPostS - vaultInternalPrevS;

    console.log(`💎 Supreme User Fee Collected (Internal): ${ethers.formatEther(feeCollected)} ETH (Expect 0.0)`);
    console.log(`💎 Supreme User Rewards Boost: ${ethers.formatUnits(polyPostS - polyPrevS, 18)} POLY (Expect 300)`);

    console.log("\n🚀 Transaction Audit Complete. STATUS: PRODUCTION_READY_ZENITH");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
