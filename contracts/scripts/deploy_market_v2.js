const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("====================================================");
    console.log("🚀 ZENITH MARKETPLACE: DEPLOYMENT & SWAP INTEGRATION");
    console.log("====================================================");
    console.log("Deployer:", deployer.address);
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Balance: ", ethers.formatEther(balance), "MATIC");
    console.log("====================================================\n");

    const deploymentPath = path.join(__dirname, "market_deployment_v2.json");
    let addresses = {};
    if (fs.existsSync(deploymentPath)) {
        addresses = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    }

    const save = () => fs.writeFileSync(deploymentPath, JSON.stringify(addresses, null, 2));

    // 1. Deploy SwapManager (Zenith Liquidity Router)
    // Linked to Uniswap V3 Router on Polygon Amoy: 0x1115511111111111111111111111111111111111 (Placeholder for Amoy V3)
    // Real Amoy V3 Router: 0xC532a74256D3fd42D0397042c01728a8ce47B2b3 (SwapRouter02)
    const SWAP_ROUTER = "0x3bFA4769FB09eefC5a80d6E87c3B91650a76be21"; // Uniswap V3 SwapRouter02 on Amoy

    console.log("📦 Deploying SwapManager...");
    console.log("   Router:", SWAP_ROUTER);
    console.log("   Owner: ", deployer.address);
    const SwapFactory = await ethers.getContractFactory("SwapManager");
    const swapManager = await SwapFactory.deploy(SWAP_ROUTER);
    await swapManager.waitForDeployment();
    addresses.SwapManager = await swapManager.getAddress();
    console.log("✅ SwapManager live at:", addresses.SwapManager);
    save();

    // 2. Deploy PolyLanceNFTMarketplace (UUPS Proxy)
    console.log("\n📦 Deploying PolyLanceNFTMarketplace (Proxy)...");
    const MarketFactory = await ethers.getContractFactory("PolyLanceNFTMarketplace");
    const market = await upgrades.deployProxy(
        MarketFactory,
        [deployer.address, deployer.address, 250], // Admin, FeeRecipient, 2.5% fee
        { kind: "uups", initializer: "initialize" }
    );
    await market.waitForDeployment();
    addresses.NFTMarketplace = await market.getAddress();
    console.log("✅ PolyLanceNFTMarketplace live at:", addresses.NFTMarketplace);
    save();

    // 3. Integration: Link SwapManager to Marketplace
    console.log("\n🔗 Integrating Swap Gravity...");
    const marketContract = await ethers.getContractAt("PolyLanceNFTMarketplace", addresses.NFTMarketplace);
    const tx = await marketContract.setSwapManager(addresses.SwapManager);
    await tx.wait();
    console.log("✅ Marketplace successfully linked to Zenith Liquidity Engine");

    console.log("\n====================================================");
    console.log("🎉 ZENITH MARKETPLACE DEPLOYMENT COMPLETE");
    console.log("Status: SWAP_ENABLED");
    console.log("====================================================");
}

main().catch((error) => {
    console.error("\n❌ Deployment failed:", error.message);
    process.exitCode = 1;
});
