const { ethers } = require("ethers");
require("dotenv").config();

const pk = process.env.PRIVATE_KEY;
if (!pk) {
    console.error("No PRIVATE_KEY found in .env");
    process.exit(1);
}

const wallet = new ethers.Wallet(pk);
console.log("Address:", wallet.address);
