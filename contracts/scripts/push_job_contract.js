const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Actuating Job Contract Push to Amoy...");

    const addressesPath = path.join(__dirname, "amoy_deployment_addresses.json");
    if (!fs.existsSync(addressesPath)) {
        throw new Error("Amoy deployment addresses not found!");
    }
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);

    const escrow = await ethers.getContractAt("FreelanceEscrow", addresses.FreelanceEscrow);

    const jobAmount = ethers.parseEther("0.01"); // 0.01 MATIC
    const deadline = Math.floor(Date.now() / 1000) + (3600 * 24 * 7); // 1 week

    const createParams = {
        categoryId: 1, // Dev
        freelancer: ethers.ZeroAddress, // Open to all
        token: ethers.ZeroAddress, // Native MATIC
        amount: jobAmount,
        ipfsHash: "ipfs://zenith-job-genesis-contract",
        deadline: deadline,
        mAmounts: [jobAmount],
        mHashes: ["ipfs://milestone-1-genesis"],
        mIsUpfront: [false],
        yieldStrategy: 0, // NONE
        paymentToken: ethers.ZeroAddress,
        paymentAmount: jobAmount,
        minAmountOut: 0
    };

    console.log("Pushing Job Contract...");
    const tx = await escrow.createJob(createParams, { value: jobAmount });
    console.log("Transaction Hash:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("✅ Job Contract Pushed Successfully!");
    
    // Find JobCreated event
    const event = receipt.logs.find(log => {
        try {
            const parsed = escrow.interface.parseLog(log);
            return parsed.name === "JobCreated";
        } catch (e) {
            return false;
        }
    });

    if (event) {
        const parsedEvent = escrow.interface.parseLog(event);
        console.log("Job ID:", parsedEvent.args.jobId.toString());
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
