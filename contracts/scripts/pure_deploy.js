const { ethers } = require("ethers");
require("dotenv").config();
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 STANDALONE PURE-ETHERS DEPLOYER (ZENITH)");
    const RPC = process.env.POLYGON_MAINNET_RPC_URL || "https://polygon-rpc.com";
    const PK = process.env.PRIVATE_KEY;
    
    if (!PK) throw new Error("Missing PRIVATE_KEY in .env");

    const provider = new ethers.JsonRpcProvider(RPC);
    const wallet = new ethers.Wallet(PK, provider);
    console.log("Deployer Address:", wallet.address);
    console.log("Balance:", ethers.formatEther(await provider.getBalance(wallet.address)), "MATIC");

    // Load Artifact
    const artifactPath = path.join(__dirname, "../artifacts/contracts/PolyToken.sol/PolyToken.json");
    if (!fs.existsSync(artifactPath)) throw new Error("Artifact not found! Run npx hardhat compile first.");
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

    console.log("📦 Deploying Hardened PolyToken...");
    const Factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
    const contract = await Factory.deploy();
    await contract.waitForDeployment();
    const address = await contract.getAddress();

    console.log("✅ PolyToken Deployed to:", address);
    console.log("Block:", await provider.getBlockNumber());
}

main().catch(console.error);
