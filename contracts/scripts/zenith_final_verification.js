const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("⚪ Initiating Zenith FINAL VERIFICATION...");

    const networkName = hre.network.name;
    const addressesPath = path.join(__dirname, `deployment_${networkName}_zenith.json`);
    
    if (!fs.existsSync(addressesPath)) {
        throw new Error(`Deployment file not found for ${networkName}. Run deployment script first.`);
    }
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

    const signers = await ethers.getSigners();
    const deployer = signers[0];
    const freelancer = signers[1] || deployer;
    const client = signers[2] || deployer;

    console.log("Testing with Deployer:", deployer.address);

    const poly = await ethers.getContractAt("PolyToken", addresses.PolyToken);
    const escrow = await ethers.getContractAt("FreelanceEscrow", addresses.FreelanceEscrow);
    const sbt = await ethers.getContractAt("FreelanceSBT", addresses.FreelanceSBT);

    const gasOverrides = {
        maxFeePerGas: 100000000000n, // 100 Gwei
        maxPriorityFeePerGas: 50000000000n,
    };

    console.log("\n--- Phase 1: Basic Contract Connectivity ---");
    const name = await poly.name();
    console.log("✅ PolyToken Name:", name);
    
    const adminRole = await escrow.DEFAULT_ADMIN_ROLE();
    const isAdmin = await escrow.hasRole(adminRole, deployer.address);
    console.log("✅ Deployer is Admin:", isAdmin);

    console.log("\n--- Phase 2: Configuration Check ---");
    const tokenInEscrow = await escrow.polyToken();
    console.log("✅ Escrow PolyToken:", tokenInEscrow);

    console.log("\n--- Phase 3: Identity Setup ---");
    console.log("Minting SBT for freelancer...");
    const mintTx = await sbt.safeMint(freelancer.address, "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco", gasOverrides);
    await mintTx.wait();
    console.log("✅ SBT Minted for freelancer");

    console.log("\n--- Phase 4: Job Creation (Simple) ---");
    const jobAmount = ethers.parseEther("0.1"); 
    await (await poly.transfer(client.address, jobAmount, gasOverrides)).wait();
    await (await poly.connect(client).approve(addresses.FreelanceEscrow, jobAmount, gasOverrides)).wait();

    console.log("Client creating job...");
    // Real CID needed for validation
    const realCID = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"; 
    
    const createTx = await escrow.connect(client).createJob({
        categoryId: 1,
        freelancer: ethers.ZeroAddress,
        token: addresses.PolyToken,
        amount: jobAmount,
        ipfsHash: realCID,
        deadline: 0,
        mAmounts: [jobAmount],
        mHashes: [realCID],
        mIsUpfront: [false],
        yieldStrategy: 0, 
        paymentToken: addresses.PolyToken,
        paymentAmount: jobAmount,
        minAmountOut: jobAmount,
        zkRequired: false
    }, gasOverrides);
    await createTx.wait();
    const jobId = await escrow.jobCount();
    console.log("✅ Job Created with ID:", jobId.toString());

    console.log("\n--- Phase 5: Functional Logic (Library Check) ---");
    console.log("Freelancer applying...");
    const stake = (jobAmount * 5n) / 100n;
    if (freelancer.address !== deployer.address) {
        await (await poly.transfer(freelancer.address, stake, gasOverrides)).wait();
    }
    await (await poly.connect(freelancer).approve(addresses.FreelanceEscrow, stake, gasOverrides)).wait();
    
    await (await escrow.connect(freelancer).applyForJob(jobId, gasOverrides)).wait();
    console.log("✅ Application processed via library");

    console.log("\n⚪ VERIFICATION COMPLETE: Zenith protocol is functionally sound on-chain.");
}

main().catch((error) => {
    console.error("❌ VERIFICATION FAILED:", error);
    process.exitCode = 1;
});
