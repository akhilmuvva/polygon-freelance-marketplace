const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying Zenith Security Oracle (ZSO) with:", deployer.address);

    const network = hre.network.name;
    const isAmoy = network === "amoy";
    const filename = isAmoy ? "amoy_deployment_addresses.json" : "deployment_addresses.json";
    const deploymentPath = path.join(__dirname, filename);
    
    let addresses = {};
    if (fs.existsSync(deploymentPath)) {
        addresses = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    }

    // 1. Deploy ZenithSecurityOracle (UUPS Proxy)
    console.log("\n1. Deploying ZenithSecurityOracle...");
    const ZSO = await ethers.getContractFactory("ZenithSecurityOracle");
    const zso = await upgrades.deployProxy(ZSO, [deployer.address], { kind: 'uups' });
    await zso.waitForDeployment();
    
    addresses.ZenithSecurityOracle = await zso.getAddress();
    console.log("ZenithSecurityOracle deployed to:", addresses.ZenithSecurityOracle);

    // 2. Link to FreelanceEscrow
    if (addresses.FreelanceEscrow) {
        console.log("\n2. Linking ZSO to FreelanceEscrow...");
        const escrow = await ethers.getContractAt("FreelanceEscrow", addresses.FreelanceEscrow);
        const tx = await escrow.setSecurityOracle(addresses.ZenithSecurityOracle);
        await tx.wait();
        console.log("Linked ZSO to Escrow.");
    } else {
        console.warn("FreelanceEscrow address not found in deployment_addresses.json. Skipping linkage.");
    }

    // Save progress
    fs.writeFileSync(deploymentPath, JSON.stringify(addresses, null, 2));
    console.log("\nZSO Deployment Complete.");

    // Update frontend constants if they exist (old frontend for now)
    const frontendConfigPath = path.resolve(__dirname, "..", "..", "frontend", "src", "constants.js");
    if (fs.existsSync(frontendConfigPath)) {
        let content = fs.readFileSync(frontendConfigPath, 'utf8');
        const updateConst = (name, val) => {
            const regex = new RegExp(`export const ${name} = '.*';`);
            if (regex.test(content)) {
                content = content.replace(regex, `export const ${name} = '${val}';`);
            } else {
                content += `\nexport const ${name} = '${val}';`;
            }
        };
        updateConst("SECURITY_ORACLE_ADDRESS", addresses.ZenithSecurityOracle);
        fs.writeFileSync(frontendConfigPath, content);
        console.log("Updated frontend constants.js.");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
