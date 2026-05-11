const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
    const rpcUrl = process.env.POLYGON_MAINNET_RPC_URL || "https://polygon-rpc.com";
    console.log("Checking RPC:", rpcUrl);
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    try {
        const network = await provider.getNetwork();
        console.log("Connected to network:", network.name, "ChainId:", network.chainId);
        const blockNumber = await provider.getBlockNumber();
        console.log("Current block:", blockNumber);
        
        const privateKey = process.env.PRIVATE_KEY;
        if (privateKey) {
            const wallet = new ethers.Wallet(privateKey, provider);
            console.log("Account:", wallet.address);
            const balance = await provider.getBalance(wallet.address);
            console.log("Balance:", ethers.formatEther(balance), "MATIC");
        }
    } catch (error) {
        console.error("Connection failed:", error.message);
    }
}

main();
