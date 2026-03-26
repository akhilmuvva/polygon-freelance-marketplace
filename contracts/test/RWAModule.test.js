const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("PolyLance Zenith: RWA Module & Oracle Validation", function () {
  let assetTokenizer;
  let mockPriceFeed;
  let owner, issuer, investor, feeCollector;
  const TOTAL_VALUE = ethers.parseEther("1000"); // $1000 invoice
  const TOTAL_SUPPLY = 1000; // 1000 fractional tokens ($1 each)

  beforeEach(async function () {
    [owner, issuer, investor, feeCollector] = await ethers.getSigners();

    // 1. Deploy Mock Price Feed ($1.00 per token)
    const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
    mockPriceFeed = await MockPriceFeed.deploy(8, 100000000); // 1.0 USD with 8 decimals

    // 2. Deploy AssetTokenizer (UUPS Proxy)
    const AssetTokenizer = await ethers.getContractFactory("AssetTokenizer");
    assetTokenizer = await upgrades.deployProxy(AssetTokenizer, [
      "https://ipfs.io/ipfs/",
      feeCollector.address,
      250 // 2.5% fee
    ], { initializer: "initialize" });

    await assetTokenizer.setPriceFeed(await mockPriceFeed.getAddress());
  });

  it("Should correctly tokenize an invoice and verify it via Oracle logic", async function () {
    const maturity = (await ethers.provider.getBlock("latest")).timestamp + 86400 * 30;
    
    await expect(assetTokenizer.connect(issuer).tokenizeAsset(
      0, // INVOICE
      ethers.ZeroAddress, // Native payment
      TOTAL_VALUE,
      TOTAL_SUPPLY,
      maturity,
      "QmHash",
      ethers.ZeroHash
    )).to.emit(assetTokenizer, "AssetTokenized");

    const details = await assetTokenizer.getAssetDetails(1);
    expect(details.totalValue).to.equal(TOTAL_VALUE);
    expect(details.issuer).to.equal(issuer.address);
  });

  it("Should validate invoice value in USD using Chainlink feed", async function () {
    const amount = ethers.parseEther("1"); // 1 unit
    const usdValue = await assetTokenizer.getInvoiceValueInUSD(amount, await mockPriceFeed.getAddress());
    expect(usdValue).to.equal(ethers.parseEther("1")); // Should be $1.00
  });

  it("Should enforce platform fees on RWA funding", async function () {
    const maturity = (await ethers.provider.getBlock("latest")).timestamp + 86400 * 30;
    await assetTokenizer.connect(issuer).tokenizeAsset(0, ethers.ZeroAddress, TOTAL_VALUE, TOTAL_SUPPLY, maturity, "Qm", ethers.ZeroHash);
    
    // Funding asset with 10 ETH
    const fundAmount = ethers.parseEther("10");
    const initialFeeCollectorBalance = await ethers.provider.getBalance(feeCollector.address);
    
    await assetTokenizer.connect(issuer).fundAsset(1, fundAmount, { value: fundAmount });
    
    const finalFeeCollectorBalance = await ethers.provider.getBalance(feeCollector.address);
    const expectedFee = (fundAmount * 250n) / 10000n;
    expect(finalFeeCollectorBalance - initialFeeCollectorBalance).to.equal(expectedFee);
  });
});

// Helper Mock
async function deployMockPriceFeed() {
  const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
  return await MockPriceFeed.deploy(8, 100000000);
}
