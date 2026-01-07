// require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ethers");
require("@openzeppelin/hardhat-upgrades");
// require("solidity-coverage");
// require("hardhat-gas-reporter");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    gasReporter: {
        enabled: process.env.REPORT_GAS !== undefined,
        currency: "USD",
        coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    },
    networks: {
        hardhat: {
            chainId: 1337,
        },
        polygon_amoy: {
            url: process.env.RPC_URL || "",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        },
        polygon: {
            url: process.env.POLYGON_MAINNET_RPC_URL || "https://polygon-rpc.com",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            gasPrice: "auto",
        }
    },
    etherscan: {
        apiKey: {
            polygon_amoy: process.env.POLYGONSCAN_API_KEY || "",
            polygon: process.env.POLYGONSCAN_API_KEY || ""
        },
        customChains: [
            {
                network: "polygon_amoy",
                chainId: 80002,
                urls: {
                    apiURL: "https://api-amoy.polygonscan.com/api",
                    browserURL: "https://amoy.polygonscan.com"
                }
            }
        ]
    }
};
