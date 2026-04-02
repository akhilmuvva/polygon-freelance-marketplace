require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config();
// require("solidity-coverage");

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
                runs: 1000
            },
            viaIR: true
        }
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts"
    },
    networks: {
        hardhat: {
            allowUnlimitedContractSize: true,
            hardfork: "cancun"
        },
        // Polygon Mainnet (ChainID: 137)
        polygon: {
            url: process.env.POLYGON_MAINNET_RPC_URL || "https://polygon-rpc.com",
            accounts: [PRIVATE_KEY],
            chainId: 137,
            gasPrice: "auto"
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
