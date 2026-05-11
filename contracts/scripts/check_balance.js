const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Deployer Address:", deployer.address);
  console.log("Deployer Balance (MATIC):", hre.ethers.formatEther(balance));
  
  if (balance === 0n) {
    console.log("CRITICAL: Deployer account has 0 MATIC. Deployment will fail.");
  } else {
    console.log("Account has funds. Ready for deployment.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
