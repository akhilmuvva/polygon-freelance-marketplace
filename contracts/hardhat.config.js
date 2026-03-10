require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-chai-matchers");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config();
require("solidity-coverage");

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.24",
        settings: {
            evmVersion: "cancun",
            optimizer: {
                enabled: true,
                runs: 200
            },
            viaIR: true
        }
    },
    networks: {
        hardhat: {
            allowUnlimitedContractSize: true,
            hardfork: "cancun"
        },
        // Polygon Amoy Testnet (ChainID: 80002)
        amoy: {
            url: process.env.POLYGON_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology",
            accounts: [PRIVATE_KEY],
            chainId: 80002,
            gasPrice: "auto",
            timeout: 60000
        }
    }
};
