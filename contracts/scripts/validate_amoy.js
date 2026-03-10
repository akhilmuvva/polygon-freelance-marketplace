const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("\n🚀 Starting Amoy Final Validation...");

    // 1. Load the CORRECT Amoy addresses
    const deploymentPath = path.join(__dirname, "amoy_deployment_addresses.json");
    if (!fs.existsSync(deploymentPath)) {
        console.error("❌ amoy_deployment_addresses.json not found! Run deploy_amoy.js first.");
        return;
    }
    const addresses = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    const [deployer] = await ethers.getSigners();

    console.log("Using primary account:", deployer.address);
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Current balance:", ethers.formatEther(balance), "MATIC");

    // 2. Attach to Escalator/Escrow
    const escrow = await ethers.getContractAt("FreelanceEscrow", addresses.FreelanceEscrow);
    console.log("\n📍 FreelanceEscrow:", addresses.FreelanceEscrow);

    // 3. Create a Demo Job (MATIIC payment)
    console.log("📝 Creating demo job opportunity...");
    try {
        const params = {
            categoryId: 1, // Development
            freelancer: ethers.ZeroAddress, // Open for anyone
            token: ethers.ZeroAddress, // Native MATIC
            amount: ethers.parseEther("0.001"), // Small amount for test
            ipfsHash: "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3hlgtv7paxot2pu",
            deadline: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
            mAmounts: [ethers.parseEther("0.001")],
            mHashes: ["ipfs://milestone-1"],
            mIsUpfront: [true], // First milestone is upfront
            yieldStrategy: 0, // NONE
            paymentToken: ethers.ZeroAddress,
            paymentAmount: 0,
            minAmountOut: 0
        };

        const tx = await escrow.createJob(params, { 
            value: ethers.parseEther("0.001"),
            gasLimit: 1000000 
        });
        
        console.log("⏳ Waiting for transaction...", tx.hash);
        const receipt = await tx.wait();
        console.log("✅ Job created successfully in block:", receipt.blockNumber);

        // 4. Verify job existance via counter
        const jobCount = await escrow.jobCount();
        console.log("📊 Total jobs on-chain:", jobCount.toString());

    } catch (err) {
        console.error("❌ Failed to create job:", err.reason || err.message);
    }

    console.log("\n🏁 Validation complete. Frontend can now read these jobs from Amoy.");
}

main().catch(console.error);
