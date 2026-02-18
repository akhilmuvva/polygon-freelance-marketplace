const { ethers } = require("hardhat");

async function main() {
    console.log("Ethers version:", ethers.version);
    try {
        console.log("ZeroAddress:", ethers.ZeroAddress);
    } catch (e) {
        console.log("ZeroAddress not found");
    }
    try {
        const gl = await ethers.getSigners();
        console.log("Signers:", gl.length);
    } catch (e) {
        console.log("Signers error:", e.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
