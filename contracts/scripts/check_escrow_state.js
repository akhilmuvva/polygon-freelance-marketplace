const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const addresses = JSON.parse(fs.readFileSync(path.join(__dirname, "deployment_zenith_final.json"), "utf8"));
    const escrow = await ethers.getContractAt("FreelanceEscrow", addresses.FreelanceEscrow);

    console.log("Escrow Proxy:", addresses.FreelanceEscrow);
    try {
        const poly = await escrow.polyToken();
        const jobNFT = await escrow.jobNFT();
        const renderer = await escrow.renderer();
        console.log("PolyToken:", poly);
        console.log("JobNFT:", jobNFT);
        console.log("Renderer:", renderer);
    } catch (e) {
        console.error("Failed to read state:", e.message);
    }
}

main().catch(console.error);
