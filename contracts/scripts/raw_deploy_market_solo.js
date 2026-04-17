const { JsonRpcProvider, Wallet, ContractFactory } = require("ethers");
const fs = require("fs");
require("dotenv").config();

async function main() {
    const rpcUrl = "https://rpc-amoy.polygon.technology";
    const provider = new JsonRpcProvider(rpcUrl);
    const pk = process.env.PRIVATE_KEY;
    const wallet = new Wallet(pk, provider);

    console.log("Deployer:", wallet.address);
    const bal = await provider.getBalance(wallet.address);
    console.log("Balance:", bal.toString(), "wei");

    const marketplaceArtifact = JSON.parse(fs.readFileSync("./artifacts/contracts/PolyLanceNFTMarketplace.sol/PolyLanceNFTMarketplace.json"));

    // Reuse a placeholder for SwapManager to save gas
    const SWAP_MANAGER_PLACEHOLDER = wallet.address; 

    console.log("Deploying Marketplace (Optimized)...");
    const MarketFactory = new ContractFactory(marketplaceArtifact.abi, marketplaceArtifact.bytecode, wallet);
    
    // Manual gas limit to stay within 0.11 MATIC
    const marketplace = await MarketFactory.deploy({
        gasLimit: 3000000 // 3M gas
    });
    
    console.log("Waiting for deployment...");
    await marketplace.waitForDeployment();
    const marketAddr = await marketplace.getAddress();
    console.log("✅ Marketplace:", marketAddr);

    console.log("Initializing Marketplace...");
    const tx = await marketplace.initialize(SWAP_MANAGER_PLACEHOLDER);
    await tx.wait();
    console.log("✅ Marketplace Initialized.");

    console.log("------------------------------------------");
    console.log("NEW MARKETPLACE ADDRESS:", marketAddr);
    console.log("------------------------------------------");
}

main().catch(console.error);
