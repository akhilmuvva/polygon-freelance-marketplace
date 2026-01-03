const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // Load existing addresses if available
    const deploymentPath = path.join(__dirname, "deployment_addresses.json");
    let addresses = {};
    if (fs.existsSync(deploymentPath)) {
        try {
            addresses = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
            console.log("Loaded existing deployment addresses.");
        } catch (e) {
            console.log("Could not parse existing addresses, starting fresh.");
        }
    }

    const saveProgress = () => {
        fs.writeFileSync(deploymentPath, JSON.stringify(addresses, null, 2));
    };

    const isDeployed = async (address) => {
        if (!address) return false;
        try {
            const code = await ethers.provider.getCode(address);
            return code !== "0x";
        } catch (error) {
            console.error(`Error checking deployment status for ${address}:`, error.message);
            return false;
        }
    };

    // 1. Deploy PolyToken
    if (await isDeployed(addresses.PolyToken)) {
        console.log("\n1. PolyToken already deployed at:", addresses.PolyToken);
    } else {
        console.log("\n1. Deploying PolyToken...");
        const PolyToken = await ethers.getContractFactory("PolyToken");
        const polyToken = await PolyToken.deploy(deployer.address);
        await polyToken.waitForDeployment();
        addresses.PolyToken = await polyToken.getAddress();
        console.log("PolyToken deployed to:", addresses.PolyToken);
        saveProgress();
    }

    // 2. Deploy InsurancePool
    if (await isDeployed(addresses.InsurancePool)) {
        console.log("\n2. InsurancePool already deployed at:", addresses.InsurancePool);
    } else {
        console.log("\n2. Deploying InsurancePool...");
        const InsurancePool = await ethers.getContractFactory("InsurancePool");
        const insurancePool = await InsurancePool.deploy(deployer.address);
        await insurancePool.waitForDeployment();
        addresses.InsurancePool = await insurancePool.getAddress();
        console.log("InsurancePool deployed to:", addresses.InsurancePool);
        saveProgress();
    }

    // 3. Deploy FreelanceEscrow (Proxy)
    if (await isDeployed(addresses.FreelanceEscrow)) {
        console.log("\n3. FreelanceEscrow already deployed at:", addresses.FreelanceEscrow);
    } else {
        console.log("\n3. Deploying FreelanceEscrow (UUPS Proxy)...");

        // Addresses for Amoy (Testnet) or Mocks (Local)
        const lzEndpoint = ethers.getAddress("0x6EDDE65947B348035F7dB70163693e6F60416173".toLowerCase()); // Amoy LZ V2
        const ccipRouter = ethers.getAddress("0x9C32fCB86BF0f4a1A8921a9Fe46de3198bb88464".toLowerCase()); // Amoy CCIP Router
        const trustedForwarder = ethers.getAddress("0x0000000000000000000000000000000000000000".toLowerCase()); // Dummy Forwarder

        const FreelanceEscrow = await ethers.getContractFactory("FreelanceEscrow");
        const escrow = await upgrades.deployProxy(
            FreelanceEscrow,
            [deployer.address, trustedForwarder, ccipRouter, addresses.InsurancePool],
            {
                kind: 'uups',
                initializer: 'initialize',
                constructorArgs: [lzEndpoint]
            }
        );
        await escrow.waitForDeployment();
        addresses.FreelanceEscrow = await escrow.getAddress();
        console.log("FreelanceEscrow Proxy deployed to:", addresses.FreelanceEscrow);
        saveProgress();

        // 4. Link PolyToken in Escrow
        console.log("\n4. Configuring Escrow...");
        // Re-fetch escrow instance if it was just deployed to ensure we have the correct proxy address
        const deployedEscrow = await ethers.getContractAt("FreelanceEscrow", addresses.FreelanceEscrow);
        const owner = await deployedEscrow.owner();
        console.log("Escrow Owner:", owner);
        console.log("Deployer:", deployer.address);
        console.log("PolyToken Address:", addresses.PolyToken);

        if (owner !== deployer.address) {
            console.log("Warning: Owner mismatch! Attempting to fix...");
        }

        await deployedEscrow.setPolyToken(addresses.PolyToken);
        console.log("Linked PolyToken to Escrow.");
    }

    console.log("\n--- Deployment Summary ---");
    const network = await ethers.provider.getNetwork();
    console.log("Network: ", network.name);
    console.log("PolyToken:           ", addresses.PolyToken);
    console.log("InsurancePool:       ", addresses.InsurancePool);
    console.log("FreelanceEscrow Proxy:", addresses.FreelanceEscrow);
    console.log("---------------------------\n");

    addresses.network = network.name;
    addresses.chainId = network.chainId.toString();
    saveProgress();

    // 5. Update frontend constants
    try {
        const frontendConfigPath = path.resolve(__dirname, "..", "..", "frontend", "src", "constants.js");
        if (fs.existsSync(frontendConfigPath)) {
            let content = fs.readFileSync(frontendConfigPath, 'utf8');
            content = content.replace(/export const CONTRACT_ADDRESS = '.*';/, `export const CONTRACT_ADDRESS = '${escrowAddress}';`);
            content = content.replace(/export const POLY_TOKEN_ADDRESS = '.*';/, `export const POLY_TOKEN_ADDRESS = '${polyTokenAddress}';`);
            fs.writeFileSync(frontendConfigPath, content);
            console.log("Updated frontend constants.js with new addresses.");
        }
    } catch (e) {
        console.log("Warning: Could not update frontend constants:", e.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
