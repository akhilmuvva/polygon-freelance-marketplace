const { ethers, upgrades } = require("hardhat");

async function main() {
    const signers = await ethers.getSigners();
    const target = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
    
    for (let i = 0; i < signers.length; i++) {
        if (signers[i].address.toLowerCase() === target.toLowerCase()) {
            console.log(`Target is Signer ${i}`);
            return;
        }
    }

    console.log("Target is NOT a signer. Checking recently deployed contracts...");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
