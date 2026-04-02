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

    // 2.5 Deploy PolyLanceForwarder
    if (await isDeployed(addresses.PolyLanceForwarder)) {
        console.log("\n2.5 PolyLanceForwarder already deployed at:", addresses.PolyLanceForwarder);
    } else {
        console.log("\n2.5 Deploying PolyLanceForwarder...");
        const PolyLanceForwarder = await ethers.getContractFactory("PolyLanceForwarder");
        const forwarder = await PolyLanceForwarder.deploy();
        await forwarder.waitForDeployment();
        addresses.PolyLanceForwarder = await forwarder.getAddress();
        console.log("PolyLanceForwarder deployed to:", addresses.PolyLanceForwarder);
        saveProgress();
    }


    // 3. Deploy FreelanceEscrow (Proxy)
    if (await isDeployed(addresses.FreelanceEscrow)) {
        console.log("\n3. FreelanceEscrow already deployed at:", addresses.FreelanceEscrow);
    } else {
        console.log("\n3. Deploying FreelanceEscrow (UUPS Proxy)...");

        // Polygon Mainnet production addresses
        const lzEndpoint = ethers.getAddress("0x1a44076050125825900e736c501f859c50fE728c".toLowerCase()); // Polygon Mainnet LZ V2 Endpoint
        const ccipRouter = ethers.getAddress("0x849c5ED5a80F5B408Dd4969b78c2C8fdf0565Bfe".toLowerCase()); // Polygon Mainnet CCIP Router
        const trustedForwarder = addresses.PolyLanceForwarder;


        const FreelanceEscrow = await ethers.getContractFactory("FreelanceEscrow");
        const escrow = await upgrades.deployProxy(
            FreelanceEscrow,
            [
                deployer.address,
                trustedForwarder,
                deployer.address, // Temporary _sbt placeholder
                deployer.address  // Temporary _entry placeholder
            ],
            {
                kind: 'uups',
                initializer: 'initialize'
            }
        );
        await escrow.waitForDeployment();
        addresses.FreelanceEscrow = await escrow.getAddress();
        console.log("FreelanceEscrow Proxy deployed to:", addresses.FreelanceEscrow);
        saveProgress();

        // 4. Deploy FreelancerReputation (UUPS Proxy)
        console.log("\n4. Deploying FreelancerReputation...");
        const FreelancerReputation = await ethers.getContractFactory("FreelancerReputation");
        const reputation = await upgrades.deployProxy(
            FreelancerReputation,
            [deployer.address, "https://api.polylance.com/reputation/{id}.json"],
            { kind: 'uups' }
        );
        await reputation.waitForDeployment();
        addresses.FreelancerReputation = await reputation.getAddress();
        console.log("FreelancerReputation Proxy deployed to:", addresses.FreelancerReputation);
        saveProgress();

        // 5. Deploy StreamingEscrow
        console.log("\n5. Deploying StreamingEscrow...");
        const StreamingEscrow = await ethers.getContractFactory("StreamingEscrow");
        const streaming = await StreamingEscrow.deploy(
            addresses.FreelancerReputation,
            deployer.address,
            deployer.address // Fee collector
        );
        await streaming.waitForDeployment();
        addresses.StreamingEscrow = await streaming.getAddress();
        console.log("StreamingEscrow deployed to:", addresses.StreamingEscrow);
        saveProgress();

        // 6. Deploy FreelanceSBT
        console.log("\n6. Deploying FreelanceSBT...");
        const FreelanceSBT = await ethers.getContractFactory("FreelanceSBT");
        const sbt = await FreelanceSBT.deploy(deployer.address, addresses.FreelanceEscrow);
        await sbt.waitForDeployment();
        addresses.FreelanceSBT = await sbt.getAddress();
        console.log("FreelanceSBT deployed to:", addresses.FreelanceSBT);
        saveProgress();

        // 7. Configure Escrow
        console.log("\n7. Configuring Escrow...");
        const deployedEscrow = await ethers.getContractAt("FreelanceEscrow", addresses.FreelanceEscrow);

        // Link PolyToken
        await deployedEscrow.setPolyToken(addresses.PolyToken);
        console.log("Linked PolyToken to Escrow.");

        // Link SBT
        await deployedEscrow.setSBTContract(addresses.FreelanceSBT);
        console.log("Linked FreelanceSBT to Escrow.");

        // Whitelist PolyToken for payments
        await deployedEscrow.setTokenWhitelist(addresses.PolyToken, true);
        console.log("Whitelisted PolyToken for payments.");

        // Supreme Configuration
        await deployedEscrow.setReputationContract(addresses.FreelancerReputation);
        await deployedEscrow.setReputationThreshold(10);
        console.log("Linked Reputation Oracle and set Supreme Threshold.");

        // Give Escrow MINTER_ROLE on PolyToken
        const polyContract = await ethers.getContractAt("PolyToken", addresses.PolyToken);
        const POLY_MINTER = await polyContract.MINTER_ROLE();
        await polyContract.grantRole(POLY_MINTER, addresses.FreelanceEscrow);
        console.log("Granted MINTER_ROLE to Escrow on PolyToken.");

        // Give StreamingEscrow MINTER_ROLE on Reputation
        const deployedRep = await ethers.getContractAt("FreelancerReputation", addresses.FreelancerReputation);
        const MINTER_ROLE = await deployedRep.MINTER_ROLE();
        await deployedRep.grantRole(MINTER_ROLE, addresses.StreamingEscrow);
        console.log("Granted MINTER_ROLE to StreamingEscrow on Reputation.");

        // 8. Deploy Governance & Timelock
        console.log("\n8. Deploying PolyTimelock...");
        const PolyTimelock = await ethers.getContractFactory("PolyTimelock");
        // minDelay = 1, proposers = [], executors = [], admin = deployer
        const timelock = await PolyTimelock.deploy(1, [deployer.address], [deployer.address], deployer.address);
        await timelock.waitForDeployment();
        addresses.PolyTimelock = await timelock.getAddress();
        console.log("PolyTimelock deployed to:", addresses.PolyTimelock);

        console.log("\n9. Deploying FreelanceGovernance...");
        const FreelanceGovernance = await ethers.getContractFactory("FreelanceGovernance");
        const governance = await FreelanceGovernance.deploy(addresses.FreelanceSBT);
        await governance.waitForDeployment();
        addresses.FreelanceGovernance = await governance.getAddress();
        console.log("FreelanceGovernance deployed to:", addresses.FreelanceGovernance);
        saveProgress();
    }

    console.log("\n--- Deployment Summary ---");
    const network = await ethers.provider.getNetwork();
    console.log("Network: ", network.name);
    console.log("PolyToken:           ", addresses.PolyToken);
    console.log("InsurancePool:       ", addresses.InsurancePool);
    console.log("FreelanceSBT:       ", addresses.FreelanceSBT);
    console.log("FreelanceEscrow Proxy:", addresses.FreelanceEscrow);
    console.log("FreelancerReputation Proxy:", addresses.FreelancerReputation);
    console.log("StreamingEscrow:     ", addresses.StreamingEscrow);
    console.log("FreelanceGovernance:  ", addresses.FreelanceGovernance);
    console.log("PolyTimelock:        ", addresses.PolyTimelock);
    console.log("---------------------------\n");

    addresses.network = network.name;
    const chainId = network.chainId.toString();
    addresses.chainId = chainId;
    saveProgress();

    // 7. Update frontend constants
    try {
        const frontendConfigPath = path.resolve(__dirname, "..", "..", "frontend", "src", "constants.js");
        if (fs.existsSync(frontendConfigPath)) {
            let content = fs.readFileSync(frontendConfigPath, 'utf8');
            content = content.replace(/export const CONTRACT_ADDRESS = '.*';/, `export const CONTRACT_ADDRESS = '${addresses.FreelanceEscrow}';`);
            content = content.replace(/export const POLY_TOKEN_ADDRESS = '.*';/, `export const POLY_TOKEN_ADDRESS = '${addresses.PolyToken}';`);
            content = content.replace(/export const STREAMING_ESCROW_ADDRESS = '.*';/, `export const STREAMING_ESCROW_ADDRESS = '${addresses.StreamingEscrow}';`);
            content = content.replace(/export const GOVERNANCE_ADDRESS = '.*';/, `export const GOVERNANCE_ADDRESS = '${addresses.FreelanceGovernance}';`);
            content = content.replace(/export const REPUTATION_ADDRESS = '.*';/, `export const REPUTATION_ADDRESS = '${addresses.FreelancerReputation}';`);
            fs.writeFileSync(frontendConfigPath, content);
            console.log("Updated frontend constants.js with all Zenith addresses.");
        }
    } catch (e) {
        console.log("Warning: Could not update frontend constants:", e.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
