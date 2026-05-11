const { ethers } = require("hardhat");

async function main() {
    const signers = await ethers.getSigners();
    signers.forEach((s, i) => console.log(`Signer ${i}: ${s.address}`));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
