const { ethers } = require("hardhat");

async function main() {
    const signers = await ethers.getSigners();
    const target = "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512";
    
    for (let i = 0; i < signers.length; i++) {
        if (signers[i].address.toLowerCase() === target.toLowerCase()) {
            console.log(`Target is Signer ${i}`);
            return;
        }
    }

    console.log("Target is NOT a signer.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
