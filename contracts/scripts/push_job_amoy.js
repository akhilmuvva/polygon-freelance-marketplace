const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Account:", deployer.address);
    
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Balance:", ethers.formatEther(balance), "MATIC");

    const deploymentPath = path.join(__dirname, "amoy_deployment_addresses.json");
    if (!fs.existsSync(deploymentPath)) {
        throw new Error("Amoy deployment addresses not found!");
    }
    const addresses = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    console.log("Escrow Address:", addresses.FreelanceEscrow);

    const escrow = await ethers.getContractAt("FreelanceEscrow", addresses.FreelanceEscrow);

    const totalAmount = ethers.parseEther("0.1");

    // Creating Job Parameters
    const params = {
        categoryId: 1, // Development
        freelancer: ethers.ZeroAddress, // Open to all
        token: ethers.ZeroAddress, // MATIC
        amount: totalAmount,
        ipfsHash: "ipfs://sovereign-mission-alpha",
        deadline: 0,
        mAmounts: [totalAmount], // Single milestone for now
        mHashes: ["ipfs://milestone-1-alpha"],
        mIsUpfront: [false],
        yieldStrategy: 0, // NONE
        paymentToken: ethers.ZeroAddress,
        paymentAmount: 0,
        minAmountOut: 0
    };

    console.log("Actuating Sovereignty: Creating Job on Amoy...");
    const tx = await escrow.createJob(params, { value: totalAmount });
    console.log("Transaction Hash:", tx.hash);
    
    console.log("Synchronizing with Polygon Amoy Mesh...");
    const receipt = await tx.wait();
    console.log("Resonance Confirmed! Status:", receipt.status === 1 ? "SUCCESS" : "FAILED");
    console.log("View on Explorer: https://amoy.polygonscan.com/tx/" + tx.hash);
}

main().catch((error) => {
    console.error("Friction detected in the neural grid:");
    console.error(error);
    process.exitCode = 1;
});
