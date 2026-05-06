const hre = require("hardhat");
const fs = require('fs');

async function main() {
    console.log("Deploying PolyLance Beta Tester SBT...");
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const baseURI = "ipfs://QmPlaceholderPioneerMetadataURI/"; // Update this when metadata is uploaded

    const BetaTesterSBT = await hre.ethers.getContractFactory("BetaTesterSBT");
    const betaTesterSBT = await BetaTesterSBT.deploy(deployer.address, baseURI);

    await betaTesterSBT.waitForDeployment();
    const address = await betaTesterSBT.getAddress();
    console.log("BetaTesterSBT deployed to:", address);

    // Save to deployment config
    const deploymentsPath = './scripts/amoy_deployment_addresses.json';
    let deployments = {};
    if (fs.existsSync(deploymentsPath)) {
        deployments = JSON.parse(fs.readFileSync(deploymentsPath, 'utf8'));
    }
    deployments.BetaTesterSBT = address;
    fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));
    
    console.log("Done! You can now airdrop the Pioneer badge to early users.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
