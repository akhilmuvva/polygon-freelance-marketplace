const { ethers, upgrades } = require("hardhat");

async function main() {
    console.log("--- PolyLance Oracle Verification Script ---");
    const [owner, feeCollector] = await ethers.getSigners();
    console.log("Sovereign Identity Synchronized:", owner.address);

    // 1. Deploy Mock Price Feed
    console.log("\n[1/3] Deploying Mock Price Feed...");
    const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
    const mockPriceFeed = await MockPriceFeed.deploy(8, 100000000); // $1.00 USD with 8 decimals
    await mockPriceFeed.waitForDeployment();
    const feedAddress = await mockPriceFeed.getAddress();
    console.log("Mock Price Feed Actuated at:", feedAddress);

    // 2. Deploy/Get AssetTokenizer
    console.log("\n[2/3] Deploying AssetTokenizer (Proxy)...");
    const AssetTokenizer = await ethers.getContractFactory("AssetTokenizer");
    const assetTokenizer = await upgrades.deployProxy(AssetTokenizer, [
        "https://ipfs.io/ipfs/",
        feeCollector.address,
        250 // 2.5% fee
    ], { initializer: "initialize" });
    await assetTokenizer.waitForDeployment();
    const tokenizerAddress = await assetTokenizer.getAddress();
    console.log("AssetTokenizer Actuated at:", tokenizerAddress);

    // Link Price Feed
    await assetTokenizer.setPriceFeed(feedAddress);
    console.log("Chainlink Feed Resonance Linked.");

    // 3. Verify Valuation
    console.log("\n[3/3] Testing Valuation Logic...");
    const testAmount = ethers.parseEther("500"); // 500 units
    const usdValue = await assetTokenizer.getInvoiceValueInUSD(testAmount, feedAddress);
    
    console.log("Input Amount:", ethers.formatUnits(testAmount, 18), "units");
    console.log("Oracle Price:", "1.00 USD (Mock)");
    console.log("Calculated USD Value:", ethers.formatUnits(usdValue, 18), "USD");

    if (usdValue === testAmount) {
        console.log("\n✅ VERIFICATION SUCCESS: Oracle resonance aligned with expectation.");
    } else {
        console.error("\n❌ VERIFICATION FAILURE: Value mismatch detected.");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
