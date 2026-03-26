const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Actuating Zenith Court Board...");
    console.log("Admin:", deployer.address);

    const deploymentPath = path.join(__dirname, "amoy_deployment_addresses.json");
    if (!fs.existsSync(deploymentPath)) {
        console.error("Deployment manifest not found. Ensure FreelanceEscrow is deployed.");
        return;
    }
    const addresses = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    const ESCROW_ADDRESS = addresses.FreelanceEscrow;

    // ZENITH MAGISTRATES: THE BOARD OF SUPREME JUSTICE
    const NEW_JUDGES = [
        "0x810Cf3F6369487390aa233b446682B48a461E9a1", 
        "0x62cDfc0692cC675c95304BaCE2C834D8F901dCba",
    ];

    if (NEW_JUDGES.length === 0) {
        console.warn("No judges specified in NEW_JUDGES array. Please edit this script.");
        return;
    }

    const escrow = await ethers.getContractAt("FreelanceEscrow", ESCROW_ADDRESS);
    
    console.log(`📡 Actuating ${NEW_JUDGES.length} judges on FreelanceEscrow at ${ESCROW_ADDRESS}...`);
    const tx = await escrow.actuateZenithJudges(NEW_JUDGES);
    await tx.wait();

    console.log("✅ ZENITH COURT BOARD ACTUATED.");
    NEW_JUDGES.forEach(j => console.log(` - Magistrate: ${j}`));
}

main().catch((err) => {
    console.error("Judicial actuation failed:", err.message);
    process.exitCode = 1;
});
