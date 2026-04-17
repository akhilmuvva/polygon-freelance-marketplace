const { JsonRpcProvider, formatEther, Wallet } = require("ethers");
require("dotenv").config();

async function main() {
    const rpcUrl = "https://rpc-amoy.polygon.technology";
    const provider = new JsonRpcProvider(rpcUrl);
    const pk = process.env.PRIVATE_KEY;
    
    if (!pk) {
        console.error("PRIVATE_KEY missing in .env");
        return;
    }

    const wallet = new Wallet(pk, provider);
    const balance = await provider.getBalance(wallet.address);
    console.log("--------------------------------------------------");
    console.log("Wallet Audit (Amoy)");
    console.log("--------------------------------------------------");
    console.log("Address:", wallet.address);
    console.log("Balance:", formatEther(balance), "MATIC");
    console.log("--------------------------------------------------");
}

main().catch(console.error);
