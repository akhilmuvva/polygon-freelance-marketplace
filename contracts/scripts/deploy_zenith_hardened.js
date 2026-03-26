const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("====================================================");
    console.log("🚀 ZENITH PROTOCOL: HARDENED DEPLOYMENT SEQUENCE");
    console.log("====================================================");
    console.log("Deployer:", deployer.address);
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Balance: ", ethers.formatEther(balance), "MATIC");
    console.log("Network: ", (await ethers.provider.getNetwork()).name);
    console.log("====================================================\n");

    const deploymentPath = path.join(__dirname, "zenith_deployment_v3.json");
    let addresses = {};
    if (fs.existsSync(deploymentPath)) {
        addresses = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    }

    const save = () => fs.writeFileSync(deploymentPath, JSON.stringify(addresses, null, 2));

    const checkLive = async (name, addr) => {
        if (!addr) return false;
        const code = await ethers.provider.getCode(addr);
        if (code !== "0x") {
            console.log(`✅ ${name} is live at: ${addr}`);
            return true;
        }
        return false;
    };

    // 1. PolyToken
    if (!(await checkLive("PolyToken", addresses.PolyToken))) {
        console.log("📦 Deploying PolyToken...");
        const Factory = await ethers.getContractFactory("PolyToken");
        const contract = await Factory.deploy();
        await contract.waitForDeployment();
        addresses.PolyToken = await contract.getAddress();
        save();
    }

    // 2. Forwarder
    if (!(await checkLive("PolyLanceForwarder", addresses.PolyLanceForwarder))) {
        console.log("📦 Deploying PolyLanceForwarder...");
        const Factory = await ethers.getContractFactory("PolyLanceForwarder");
        const contract = await Factory.deploy();
        await contract.waitForDeployment();
        addresses.PolyLanceForwarder = await contract.getAddress();
        save();
    }

    // 3. AIOracle
    if (!(await checkLive("AIOracle", addresses.AIOracle))) {
        console.log("📦 Deploying AIOracle...");
        const Factory = await ethers.getContractFactory("AIOracle");
        const contract = await Factory.deploy();
        await contract.waitForDeployment();
        addresses.AIOracle = await contract.getAddress();
        save();
    }

    // 4. AssetTokenizer (Hardened Proxy)
    if (!(await checkLive("AssetTokenizer", addresses.AssetTokenizer))) {
        console.log("📦 Deploying AssetTokenizer (Proxy)...");
        const Factory = await ethers.getContractFactory("AssetTokenizer");
        const contract = await upgrades.deployProxy(
            Factory,
            ["ipfs://", deployer.address, 250],
            { kind: "uups", initializer: "initialize", unsafeAllow: ["constructor"] }
        );
        await contract.waitForDeployment();
        addresses.AssetTokenizer = await contract.getAddress();
        save();
    }

    // 5. FreelanceEscrow (Hardened Proxy)
    if (!(await checkLive("FreelanceEscrow", addresses.FreelanceEscrow))) {
        console.log("📦 Deploying FreelanceEscrow (Proxy)...");
        const Factory = await ethers.getContractFactory("FreelanceEscrow");
        const contract = await upgrades.deployProxy(
            Factory,
            [deployer.address, addresses.PolyLanceForwarder, deployer.address, deployer.address],
            { kind: "uups", initializer: "initialize", unsafeAllow: ["constructor"] }
        );
        await contract.waitForDeployment();
        addresses.FreelanceEscrow = await contract.getAddress();
        save();
    }

    // 6. InvoiceNFT (Hardened Proxy)
    if (!(await checkLive("InvoiceNFT", addresses.InvoiceNFT))) {
        console.log("📦 Deploying InvoiceNFT (Proxy)...");
        const Factory = await ethers.getContractFactory("InvoiceNFT");
        const contract = await upgrades.deployProxy(
            Factory,
            [deployer.address, 250],
            { kind: "uups", initializer: "initialize", unsafeAllow: ["constructor"] }
        );
        await contract.waitForDeployment();
        addresses.InvoiceNFT = await contract.getAddress();
        save();
    }

    // 7. FreelanceSBT
    if (!(await checkLive("FreelanceSBT", addresses.FreelanceSBT))) {
        console.log("📦 Deploying FreelanceSBT...");
        const Factory = await ethers.getContractFactory("FreelanceSBT");
        const contract = await Factory.deploy(deployer.address, addresses.FreelanceEscrow);
        await contract.waitForDeployment();
        addresses.FreelanceSBT = await contract.getAddress();
        save();
    }

    // ----------------------------------------------------
    // HARDENING & WIRING
    // ----------------------------------------------------
    console.log("\n⚙️  Hardening & Wiring Protocol...");

    const escrow = await ethers.getContractAt("FreelanceEscrow", addresses.FreelanceEscrow);
    const tokenizer = await ethers.getContractAt("AssetTokenizer", addresses.AssetTokenizer);
    const invoiceNFT = await ethers.getContractAt("InvoiceNFT", addresses.InvoiceNFT);
    const polyToken = await ethers.getContractAt("PolyToken", addresses.PolyToken);

    // Set SBT in Escrow
    if (await escrow.sbtContract() !== addresses.FreelanceSBT) {
        console.log("🔗 Linking SBT to Escrow...");
        await (await escrow.setSBTContract(addresses.FreelanceSBT)).wait();
    }

    // Set PolyToken in Escrow
    if (await escrow.polyToken() !== addresses.PolyToken) {
        console.log("🔗 Linking PolyToken to Escrow...");
        await (await escrow.setPolyToken(addresses.PolyToken)).wait();
    }

    // Case: Grant MINTER_ROLE to Escrow on PolyToken
    const MINTER_ROLE = await polyToken.MINTER_ROLE();
    if (!(await polyToken.hasRole(MINTER_ROLE, addresses.FreelanceEscrow))) {
        console.log("🔑 Granting MINTER_ROLE to Escrow...");
        await (await polyToken.grantRole(MINTER_ROLE, addresses.FreelanceEscrow)).wait();
    }

    // Setup AssetTokenizer Oracle
    const AMOY_MATIC_USD_FEED = "0x001382149eBa3441043c1c66972b47729630526D";
    if (await tokenizer.priceFeed() !== AMOY_MATIC_USD_FEED) {
        console.log("📡 Configuring Chainlink MATIC/USD Oracle...");
        await (await tokenizer.setPriceFeed(AMOY_MATIC_USD_FEED)).wait();
    }

    const ORACLE_ROLE = await tokenizer.ORACLE_ROLE();
    if (!(await tokenizer.hasRole(ORACLE_ROLE, addresses.AIOracle))) {
        console.log("📡 Linking AIOracle to Tokenizer...");
        await (await tokenizer.grantRole(ORACLE_ROLE, addresses.AIOracle)).wait();
        await (await tokenizer.setAIOracle(addresses.AIOracle)).wait();
    }

    // Setup InvoiceNFT AIOracle
    const VERIFIER_ROLE = await invoiceNFT.VERIFIER_ROLE();
    if (!(await invoiceNFT.hasRole(VERIFIER_ROLE, addresses.AIOracle))) {
        console.log("📡 Linking AIOracle to InvoiceNFT...");
        await (await invoiceNFT.grantRole(VERIFIER_ROLE, addresses.AIOracle)).wait();
        await (await invoiceNFT.setAIOracle(addresses.AIOracle)).wait();
    }

    console.log("\n✅ ZENITH PROTOCOL IS NOW HARDENED AND OPERATIONAL");
    console.log("====================================================");
    console.log("Deployment JSON:", deploymentPath);
}

main().catch((error) => {
    console.error("\n❌ Deployment failed:", error.message);
    process.exitCode = 1;
});
