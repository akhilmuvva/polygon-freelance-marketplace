const { ethers } = require("hardhat");

async function main() {
    const ESCROW_ADDRESS = "0x38c76A767d45Fc390160449948aF80569E2C4217";
    const escrow = await ethers.getContractAt("FreelanceEscrow", ESCROW_ADDRESS);

    const DEFAULT_ADMIN_ROLE = await escrow.DEFAULT_ADMIN_ROLE();
    const BRIDGE_ROLE = await escrow.BRIDGE_ROLE();
    const MANAGER_ROLE = await escrow.MANAGER_ROLE();
    const ARBITRATOR_ROLE = await escrow.ARBITRATOR_ROLE();

    console.log("Checking roles for Escrow:", ESCROW_ADDRESS);
    
    const [deployer] = await ethers.getSigners();
    console.log("Checking address:", deployer.address);

    const isAdmin = await escrow.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
    console.log("Has DEFAULT_ADMIN_ROLE:", isAdmin);

    const isBridge = await escrow.hasRole(BRIDGE_ROLE, deployer.address);
    console.log("Has BRIDGE_ROLE:", isBridge);

    const isManager = await escrow.hasRole(MANAGER_ROLE, deployer.address);
    console.log("Has MANAGER_ROLE:", isManager);

    const isArbitrator = await escrow.hasRole(ARBITRATOR_ROLE, deployer.address);
    console.log("Has ARBITRATOR_ROLE:", isArbitrator);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
