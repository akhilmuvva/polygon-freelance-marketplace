const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "MATIC\n");

    const deploymentPath = path.join(__dirname, "amoy_deployment_addresses.json");
    let addresses = {};
    if (fs.existsSync(deploymentPath)) {
        try {
            addresses = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
            console.log("Resuming from existing deployment...");
        } catch (e) { /* start fresh */ }
    }

    const save = () => fs.writeFileSync(deploymentPath, JSON.stringify(addresses, null, 2));

    const isLive = async (addr) => {
        if (!addr) return false;
        try { return (await ethers.provider.getCode(addr)) !== "0x"; }
        catch { return false; }
    };

    // ----------------------------------------------------------------
    // 1. PolyToken
    // ----------------------------------------------------------------
    if (await isLive(addresses.PolyToken)) {
        console.log("1. PolyToken already deployed:", addresses.PolyToken);
    } else {
        console.log("1. Deploying PolyToken...");
        const Factory = await ethers.getContractFactory("PolyToken");
        const contract = await Factory.deploy();
        await contract.waitForDeployment();
        addresses.PolyToken = await contract.getAddress();
        console.log("   PolyToken ->", addresses.PolyToken);
        save();
    }

    // ----------------------------------------------------------------
    // 2. InsurancePool
    // ----------------------------------------------------------------
    if (await isLive(addresses.InsurancePool)) {
        console.log("2. InsurancePool already deployed:", addresses.InsurancePool);
    } else {
        console.log("2. Deploying InsurancePool...");
        const Factory = await ethers.getContractFactory("InsurancePool");
        const contract = await Factory.deploy(deployer.address);
        await contract.waitForDeployment();
        addresses.InsurancePool = await contract.getAddress();
        console.log("   InsurancePool ->", addresses.InsurancePool);
        save();
    }

    // ----------------------------------------------------------------
    // 3. PolyLanceForwarder
    // ----------------------------------------------------------------
    if (await isLive(addresses.PolyLanceForwarder)) {
        console.log("3. PolyLanceForwarder already deployed:", addresses.PolyLanceForwarder);
    } else {
        console.log("3. Deploying PolyLanceForwarder...");
        const Factory = await ethers.getContractFactory("PolyLanceForwarder");
        const contract = await Factory.deploy();
        await contract.waitForDeployment();
        addresses.PolyLanceForwarder = await contract.getAddress();
        console.log("   PolyLanceForwarder ->", addresses.PolyLanceForwarder);
        save();
    }

    // ----------------------------------------------------------------
    // 4. FreelanceEscrow (UUPS Proxy)
    // ----------------------------------------------------------------
    if (await isLive(addresses.FreelanceEscrow)) {
        console.log("4. FreelanceEscrow already deployed:", addresses.FreelanceEscrow);
    } else {
        console.log("4. Deploying FreelanceEscrow (UUPS Proxy)...");
        // Polygon Amoy official addresses
        const lzEndpoint = "0x6EDDE65947B348035F7dB70163693e6F60416173"; // LZ V2 Amoy
        const ccipRouter = "0x9C32fCB86BF0f4a1A8921a9Fe46de3198bb88464"; // CCIP Amoy

        const Factory = await ethers.getContractFactory("FreelanceEscrow");
        const contract = await upgrades.deployProxy(
            Factory,
            [
                deployer.address,
                addresses.PolyLanceForwarder,
                deployer.address, // temporary SBT placeholder
                deployer.address  // temporary entry placeholder
            ],
            { kind: "uups", initializer: "initialize", unsafeAllow: ["constructor"] }
        );
        await contract.waitForDeployment();
        addresses.FreelanceEscrow = await contract.getAddress();
        console.log("   FreelanceEscrow Proxy ->", addresses.FreelanceEscrow);
        save();
    }

    // ----------------------------------------------------------------
    // 5. FreelancerReputation (UUPS Proxy)
    // ----------------------------------------------------------------
    if (await isLive(addresses.FreelancerReputation)) {
        console.log("5. FreelancerReputation already deployed:", addresses.FreelancerReputation);
    } else {
        console.log("5. Deploying FreelancerReputation...");
        const Factory = await ethers.getContractFactory("FreelancerReputation");
        const contract = await upgrades.deployProxy(
            Factory,
            [deployer.address, "https://api.polylance.codes/reputation/{id}.json"],
            { kind: "uups", unsafeAllow: ["constructor"] }
        );
        await contract.waitForDeployment();
        addresses.FreelancerReputation = await contract.getAddress();
        console.log("   FreelancerReputation Proxy ->", addresses.FreelancerReputation);
        save();
    }

    // ----------------------------------------------------------------
    // 6. StreamingEscrow
    // ----------------------------------------------------------------
    if (await isLive(addresses.StreamingEscrow)) {
        console.log("6. StreamingEscrow already deployed:", addresses.StreamingEscrow);
    } else {
        console.log("6. Deploying StreamingEscrow...");
        const Factory = await ethers.getContractFactory("StreamingEscrow");
        const contract = await Factory.deploy(
            addresses.FreelancerReputation,
            deployer.address,
            deployer.address
        );
        await contract.waitForDeployment();
        addresses.StreamingEscrow = await contract.getAddress();
        console.log("   StreamingEscrow ->", addresses.StreamingEscrow);
        save();
    }

    // ----------------------------------------------------------------
    // 7. FreelanceSBT
    // ----------------------------------------------------------------
    if (await isLive(addresses.FreelanceSBT)) {
        console.log("7. FreelanceSBT already deployed:", addresses.FreelanceSBT);
    } else {
        console.log("7. Deploying FreelanceSBT...");
        const Factory = await ethers.getContractFactory("FreelanceSBT");
        const contract = await Factory.deploy(deployer.address, addresses.FreelanceEscrow);
        await contract.waitForDeployment();
        addresses.FreelanceSBT = await contract.getAddress();
        console.log("   FreelanceSBT ->", addresses.FreelanceSBT);
        save();
    }

    // ----------------------------------------------------------------
    // 8. Wire up contracts
    // ----------------------------------------------------------------
    console.log("\n8. Configuring contract links...");
    const escrow = await ethers.getContractAt("FreelanceEscrow", addresses.FreelanceEscrow);
    const polyToken = await ethers.getContractAt("PolyToken", addresses.PolyToken);
    const rep = await ethers.getContractAt("FreelancerReputation", addresses.FreelancerReputation);

    try { await escrow.setPolyToken(addresses.PolyToken); console.log("   Linked PolyToken -> Escrow"); } catch (e) { console.log("   setPolyToken skipped:", e.shortMessage || e.message); }
    try { await escrow.setSBTContract(addresses.FreelanceSBT); console.log("   Linked SBT -> Escrow"); } catch (e) { console.log("   setSBTContract skipped:", e.shortMessage || e.message); }
    try { await escrow.setTokenWhitelist(addresses.PolyToken, true); console.log("   Whitelisted PolyToken"); } catch (e) { console.log("   whitelist skipped:", e.shortMessage || e.message); }
    try { await escrow.setReputationContract(addresses.FreelancerReputation); console.log("   Linked Reputation -> Escrow"); } catch (e) { console.log("   setReputation skipped:", e.shortMessage || e.message); }
    try {
        const MINTER = await polyToken.MINTER_ROLE();
        await polyToken.grantRole(MINTER, addresses.FreelanceEscrow);
        console.log("   Granted MINTER_ROLE to Escrow on PolyToken");
    } catch (e) { console.log("   grantRole (PolyToken) skipped:", e.shortMessage || e.message); }
    try {
        const MINTER = await rep.MINTER_ROLE();
        await rep.grantRole(MINTER, addresses.StreamingEscrow);
        console.log("   Granted MINTER_ROLE to StreamingEscrow on Reputation");
    } catch (e) { console.log("   grantRole (Reputation) skipped:", e.shortMessage || e.message); }

    // ----------------------------------------------------------------
    // 9. PolyTimelock
    // ----------------------------------------------------------------
    if (await isLive(addresses.PolyTimelock)) {
        console.log("\n9. PolyTimelock already deployed:", addresses.PolyTimelock);
    } else {
        console.log("\n9. Deploying PolyTimelock...");
        const Factory = await ethers.getContractFactory("PolyTimelock");
        const contract = await Factory.deploy(1, [deployer.address], [deployer.address], deployer.address);
        await contract.waitForDeployment();
        addresses.PolyTimelock = await contract.getAddress();
        console.log("   PolyTimelock ->", addresses.PolyTimelock);
        save();
    }

    // ----------------------------------------------------------------
    // 10. FreelanceGovernance
    // ----------------------------------------------------------------
    if (await isLive(addresses.FreelanceGovernance)) {
        console.log("10. FreelanceGovernance already deployed:", addresses.FreelanceGovernance);
    } else {
        console.log("10. Deploying FreelanceGovernance...");
        const Factory = await ethers.getContractFactory("FreelanceGovernance");
        const contract = await Factory.deploy(addresses.FreelanceSBT);
        await contract.waitForDeployment();
        addresses.FreelanceGovernance = await contract.getAddress();
        console.log("   FreelanceGovernance ->", addresses.FreelanceGovernance);
        save();
    }

    // ----------------------------------------------------------------
    // Final summary
    // ----------------------------------------------------------------
    const network = await ethers.provider.getNetwork();
    addresses.network = network.name;
    addresses.chainId = network.chainId.toString();
    save();

    console.log("\n========== AMOY DEPLOYMENT COMPLETE ==========");
    console.log("Network:               Polygon Amoy (", addresses.chainId, ")");
    console.log("PolyToken:             ", addresses.PolyToken);
    console.log("InsurancePool:         ", addresses.InsurancePool);
    console.log("PolyLanceForwarder:    ", addresses.PolyLanceForwarder);
    console.log("FreelanceEscrow:       ", addresses.FreelanceEscrow);
    console.log("FreelancerReputation:  ", addresses.FreelancerReputation);
    console.log("StreamingEscrow:       ", addresses.StreamingEscrow);
    console.log("FreelanceSBT:          ", addresses.FreelanceSBT);
    console.log("PolyTimelock:          ", addresses.PolyTimelock);
    console.log("FreelanceGovernance:   ", addresses.FreelanceGovernance);
    console.log("==============================================\n");
    console.log("Addresses saved to scripts/amoy_deployment_addresses.json");
}

main().catch((err) => {
    console.error("Deployment failed:", err.shortMessage || err.message);
    console.error(err);
    process.exitCode = 1;
});
