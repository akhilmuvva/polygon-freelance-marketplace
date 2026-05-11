const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
    const rpcUrl = process.env.POLYGON_MAINNET_RPC_URL || "https://polygon-rpc.com";
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const address = "0x38c76A767d45Fc390160449948aF80569E2C4217";
    const code = await provider.getCode(address);
    if (code === "0x") {
        console.log("No contract found at", address, "on Polygon Mainnet.");
    } else {
        console.log("Contract found at", address, "on Polygon Mainnet.");
    }
}

main();
