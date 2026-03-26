const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("====================================================");
    console.log("🌊 ZENITH SOVEREIGN STACK DEPLOYER (ERC-6551)");
    console.log("====================================================\n");

    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    console.log("Network:", network.name);
    console.log("Balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "MATIC\n");

    // 1. Deploy Sovereign Account Implementation
    console.log("📦 Deploying SovereignAccount Implementation...");
    const SovereignAccount = await ethers.getContractFactory("SovereignAccount");
    const account = await SovereignAccount.deploy();
    await account.waitForDeployment();
    const accountAddress = await account.getAddress();
    console.log("✅ SovereignAccount Implementation ->", accountAddress);

    // 2. Deploy Sovereign Registry
    console.log("📦 Deploying SovereignRegistry...");
    const SovereignRegistry = await ethers.getContractFactory("SovereignRegistry");
    const registry = await SovereignRegistry.deploy();
    await registry.waitForDeployment();
    const registryAddress = await registry.getAddress();
    console.log("✅ SovereignRegistry ->", registryAddress);

    // 3. Document Hashes for Frontend Synchronicity
    const manifestPath = path.join(__dirname, "sovereign_manifest.json");
    const manifest = {
        network: network.name,
        chainId: network.config.chainId,
        registry: registryAddress,
        accountImplementation: accountAddress,
        timestamp: new Date().toISOString()
    };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log("\n📡 Sovereign Manifest Documented ->", manifestPath);

    // 4. Update the Frontend Constants Mirror
    const frontendManifestPath = path.join(__dirname, "../../frontend/src/config/sovereign_manifest.json");
    const frontendConfigDir = path.dirname(frontendManifestPath);
    if (!fs.existsSync(frontendConfigDir)) fs.mkdirSync(frontendConfigDir, { recursive: true });
    fs.writeFileSync(frontendManifestPath, JSON.stringify(manifest, null, 2));
    console.log("📡 Synced Manifest to Frontend Tier\n");

    console.log("====================================================");
    console.log("🎉 SOVEREIGN STACK ACTUATED");
    console.log("====================================================");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
