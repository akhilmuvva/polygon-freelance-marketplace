const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
    const addresses = JSON.parse(fs.readFileSync("scripts/amoy_deployment_addresses.json", "utf8"));
    const escrow = await ethers.getContractAt("FreelanceEscrow", addresses.FreelanceEscrow);
    
    console.log("Checking Job ID 2 on-chain...");
    const job = await escrow.jobs(2);
    console.log("Job ID:", job.jobId.toString());
    console.log("Client:", job.client);
    console.log("Amount:", ethers.formatEther(job.amount));
    console.log("Status:", job.status.toString());
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
