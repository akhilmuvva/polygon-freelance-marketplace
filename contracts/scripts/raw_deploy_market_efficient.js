const { JsonRpcProvider, Wallet, ContractFactory, parseUnits } = require("ethers");
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

    console.log("Deploying Marketplace (High-Efficiency)...");
    const MarketFactory = new ContractFactory(marketplaceArtifact.abi, marketplaceArtifact.bytecode, wallet);
    
    // Aggressive gas price reduction to fit in 0.11 MATIC
    // 0.11 MATIC = 110,000,000,000,000,000 wei
    // If gas limit is 2M, max gas price is 55 gwei.
    const gasPrice = parseUnits("30", "gwei"); // 30 gwei is usually enough for Amoy

    const marketplace = await MarketFactory.deploy({
        gasPrice: gasPrice,
        gasLimit: 2500000 // 2.5M gas
    });
    
    console.log("Waiting for deployment... Hash:", marketplace.deploymentTransaction().hash);
    await marketplace.waitForDeployment();
    const marketAddr = await marketplace.getAddress();
    console.log("✅ Marketplace:", marketAddr);

    console.log("------------------------------------------");
    console.log("NEW MARKETPLACE ADDRESS:", marketAddr);
    console.log("------------------------------------------");
}

main().catch(console.error);
