const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("--------------------------------------------------");
    console.log("ZENITH PROTOCOL: Marketplace Deployment");
    console.log("--------------------------------------------------");
    console.log("Deployer:", deployer.address);

    // 1. Deploy SwapManager (Standalone for now)
    // Uniswap V3 Router (Polygon Amoy / Mainnet)
    const SWAP_ROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564"; 
    
    console.log("Deploying SwapManager...");
    const SwapManager = await hre.ethers.getContractFactory("SwapManager");
    const swapManager = await SwapManager.deploy(SWAP_ROUTER);
    await swapManager.waitForDeployment();
    const swapManagerAddr = await swapManager.getAddress();
    console.log("✅ SwapManager:", swapManagerAddr);

    // 2. Deploy Marketplace (Standalone for now)
    console.log("Deploying PolyLanceNFTMarketplace...");
    const MarketFactory = await hre.ethers.getContractFactory("PolyLanceNFTMarketplace");
    const marketplace = await MarketFactory.deploy();
    await marketplace.waitForDeployment();
    const marketAddr = await marketplace.getAddress();
    console.log("✅ Marketplace:", marketAddr);

    // 3. Initialize Marketplace
    console.log("Initializing Marketplace...");
    const tx = await marketplace.initialize(swapManagerAddr);
    await tx.wait();
    console.log("✅ Marketplace Initialized.");

    console.log("--------------------------------------------------");
    console.log("DEPLOYMENT COMPLETE");
    console.log("Marketplace:", marketAddr);
    console.log("SwapManager:", swapManagerAddr);
    console.log("--------------------------------------------------");

    // Save to JSON
    const fs = require('fs');
    const path = require('path');
    const output = {
        NFTMarketplace: marketAddr,
        SwapManager: swapManagerAddr,
        timestamp: new Date().toISOString()
    };
    fs.writeFileSync(
        path.join(__dirname, 'market_deployment_v3.json'),
        JSON.stringify(output, null, 2)
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
