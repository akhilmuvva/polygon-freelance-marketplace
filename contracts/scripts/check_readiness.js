const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    const network = await ethers.provider.getNetwork();
    const balance = await ethers.provider.getBalance(deployer.address);
    const feeData = await ethers.provider.getFeeData();

    console.log("--------------------------------------------------");
    console.log(`Network Check: ${hre.network.name} (ChainID: ${network.chainId})`);
    console.log("--------------------------------------------------");
    console.log("Deployer Address:", deployer.address);
    console.log("Balance:", ethers.formatEther(balance), "MATIC");
    console.log("--------------------------------------------------");
    console.log("Gas Conditions (Gwei):");
    console.log("Max Fee:", ethers.formatUnits(feeData.maxFeePerGas || 0n, "gwei"));
    console.log("Max Priority Fee:", ethers.formatUnits(feeData.maxPriorityFeePerGas || 0n, "gwei"));
    console.log("--------------------------------------------------");

    if (balance < ethers.parseEther("5")) {
        console.warn("⚠️ WARNING: Balance is low for a full Zenith deployment (Approx 5-10 MATIC recommended for safety).");
    } else {
        console.log("✅ Balance sufficient for deployment.");
    }
}

main().catch(console.error);
