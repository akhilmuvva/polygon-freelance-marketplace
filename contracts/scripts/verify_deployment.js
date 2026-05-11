const hre = require("hardhat");

async function main() {
  const address = "0x38c76A767d45Fc390160449948aF80569E2C4217";
  const code = await hre.ethers.provider.getCode(address);
  console.log(`Address: ${address}`);
  console.log(`Code: ${code === "0x" ? "NOT DEPLOYED" : "DEPLOYED"}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
