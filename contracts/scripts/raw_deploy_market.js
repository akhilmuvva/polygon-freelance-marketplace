const { JsonRpcProvider, Wallet, ContractFactory } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function main() {
    const rpcUrl = "https://rpc-amoy.polygon.technology";
    const provider = new JsonRpcProvider(rpcUrl);
    const pk = process.env.PRIVATE_KEY;
    const wallet = new Wallet(pk, provider);

    console.log("Deployer:", wallet.address);

    const swapManagerArtifact = JSON.parse(fs.readFileSync("./artifacts/contracts/SwapManager.sol/SwapManager.json"));
    const marketplaceArtifact = JSON.parse(fs.readFileSync("./artifacts/contracts/PolyLanceNFTMarketplace.sol/PolyLanceNFTMarketplace.json"));

    const SWAP_ROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564";

    // 1. SwapManager
    console.log("Deploying SwapManager...");
    const SwapFactory = new ContractFactory(swapManagerArtifact.abi, swapManagerArtifact.bytecode, wallet);
    const swapManager = await SwapFactory.deploy(SWAP_ROUTER);
    await swapManager.waitForDeployment();
    const swapManagerAddr = await swapManager.getAddress();
    console.log("✅ SwapManager:", swapManagerAddr);

    // 2. Marketplace
    console.log("Deploying Marketplace...");
    const MarketFactory = new ContractFactory(marketplaceArtifact.abi, marketplaceArtifact.bytecode, wallet);
    const marketplace = await MarketFactory.deploy();
    await marketplace.waitForDeployment();
    const marketAddr = await marketplace.getAddress();
    console.log("✅ Marketplace:", marketAddr);

    // 3. Initialize
    console.log("Initializing Marketplace...");
    const tx = await marketplace.initialize(swapManagerAddr);
    await tx.wait();
    console.log("✅ Marketplace Initialized.");

    console.log("Final Marketplace Address:", marketAddr);
}

main().catch(console.error);
