const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🏛️  ACTUATING PURE DECENTRALIZATION: Zenith Sovereign Protocol...");

    const networkName = hre.network.name;
    const addressesPath = path.join(__dirname, `deployment_${networkName}_zenith.json`);
    
    if (!fs.existsSync(addressesPath)) {
        throw new Error(`Deployment file not found for ${networkName}. Run deployment script first.`);
    }
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

    const [deployer] = await ethers.getSigners();
    console.log("Current Admin:", deployer.address);

    const gasOverrides = {
        maxFeePerGas: 150000000000n, // 150 Gwei
        maxPriorityFeePerGas: 100000000000n, // 100 Gwei
    };

    // 1. Deploy Timelock (48h mandatory delay)
    console.log("Deploying PolyLanceTimelock...");
    const Timelock = await ethers.getContractFactory("PolyLanceTimelock");
    const timelock = await Timelock.deploy([], [], deployer.address, gasOverrides);
    await timelock.waitForDeployment();
    const timelockAddr = await timelock.getAddress();
    console.log("✅ Timelock (48h):", timelockAddr);

    // 2. Deploy Governance (Reputation-based)
    console.log("Deploying FreelanceGovernance...");
    const Gov = await ethers.getContractFactory("FreelanceGovernance");
    const gov = await Gov.deploy(addresses.FreelanceSBT);
    await gov.waitForDeployment();
    const govAddr = await gov.getAddress();
    console.log("✅ Governance Contract:", govAddr);

    // 3. Configure Timelock Roles
    console.log("Configuring Timelock Roles...");
    const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
    const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
    const ADMIN_ROLE = await timelock.DEFAULT_ADMIN_ROLE();

    await (await timelock.grantRole(PROPOSER_ROLE, govAddr, gasOverrides)).wait();
    await (await timelock.grantRole(EXECUTOR_ROLE, ethers.ZeroAddress, gasOverrides)).wait();
    await (await gov.setTimelock(timelockAddr, gasOverrides)).wait();

    // 4. Transfer Escrow Ownership to Timelock
    console.log("Transferring Escrow Protocol Control to Timelock...");
    const escrow = await ethers.getContractAt("FreelanceEscrow", addresses.FreelanceEscrow);
    
    const DEFAULT_ADMIN_ROLE = await escrow.DEFAULT_ADMIN_ROLE();
    const MANAGER_ROLE = await escrow.MANAGER_ROLE();
    const ARBITRATOR_ROLE = await escrow.ARBITRATOR_ROLE();

    // Grant all power to the Timelock
    await (await escrow.grantRole(DEFAULT_ADMIN_ROLE, timelockAddr, gasOverrides)).wait();
    await (await escrow.grantRole(MANAGER_ROLE, timelockAddr, gasOverrides)).wait();
    await (await escrow.grantRole(ARBITRATOR_ROLE, timelockAddr, gasOverrides)).wait();
    
    // 5. Renounce Deployer (Human) Control
    console.log("Renouncing human administrative power...");
    await (await escrow.renounceRole(MANAGER_ROLE, deployer.address, gasOverrides)).wait();
    await (await escrow.renounceRole(ARBITRATOR_ROLE, deployer.address, gasOverrides)).wait();
    // Renounce DEFAULT_ADMIN_ROLE last
    await (await escrow.renounceRole(DEFAULT_ADMIN_ROLE, deployer.address, gasOverrides)).wait();
    
    // Also renounce Timelock Admin role (Self-managed by Timelock)
    await (await timelock.renounceRole(ADMIN_ROLE, deployer.address, gasOverrides)).wait();

    console.log("\n🚀 PURE DECENTRALIZATION ACHIEVED.");
}

main().catch((error) => {
    console.error("❌ DECENTRALIZATION FAILED:", error);
    process.exitCode = 1;
});
