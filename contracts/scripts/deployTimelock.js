const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);

    // Set this to your actual deployed governance address
    // Defaulting to the address from the prompt
    const GOVERNANCE_ADDRESS = process.env.GOVERNANCE_ADDRESS
        || "0x4653251486a57f90Ee89F9f34E098b9218659b83";

    console.log("Adding timelock to Governance at:", GOVERNANCE_ADDRESS);

    const Timelock = await ethers.getContractFactory("PolyLanceTimelock");
    const timelock = await Timelock.deploy(
        [GOVERNANCE_ADDRESS],                   // proposers
        [ethers.ZeroAddress],                    // executors — open after delay
        deployer.address                        // admin — revoke after setup
    );

    // Wait for deployment
    await timelock.waitForDeployment();
    const timelockAddress = await timelock.getAddress();

    const delay = await timelock.getMinDelay();
    console.log("PolyLanceTimelock address :", timelockAddress);
    console.log("Min delay                 :", delay.toString(), "seconds");
    console.log("Min delay (hours)         :", (Number(delay) / 3600).toString());
    console.log("");
    console.log("Next: call FreelanceGovernance.setTimelock('" + timelockAddress + "')");
}

main().catch(e => { console.error(e); process.exit(1); });
