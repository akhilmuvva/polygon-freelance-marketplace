const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Chain configurations
const CHAIN_CONFIGS = {
    // Mainnets
    polygon: {
        name: "Polygon",
        ccipRouter: "0x849c5ED5a80F5B408Dd4969b78c2C8fdf0565Bfe",
        lzEndpoint: "0x1a44076050125825900e736c501f859c50fE728c",
        chainSelector: "4051577828743386545",
        lzEid: 30109
    },
    ethereum: {
        name: "Ethereum",
        ccipRouter: "0x80226fc0Ee2b096224EeAc085Bb9a8cba1146f7D",
        lzEndpoint: "0x1a44076050125825900e736c501f859c50fE728c",
        chainSelector: "5009297550715157269",
        lzEid: 30101
    },
    arbitrum: {
        name: "Arbitrum One",
        ccipRouter: "0x141fa059441E0ca23ce184B6A78bafD2A517DdE8",
        lzEndpoint: "0x1a44076050125825900e736c501f859c50fE728c",
        chainSelector: "4949039107694359620",
        lzEid: 30110
    },
    base: {
        name: "Base",
        ccipRouter: "0x881e3A65B4d4a04dD529061dd0071cf975F58bCD",
        lzEndpoint: "0x1a44076050125825900e736c501f859c50fE728c",
        chainSelector: "15971525489660198786",
        lzEid: 30184
    },
    // Testnets
    sepolia: {
        name: "Ethereum Sepolia",
        ccipRouter: "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59",
        lzEndpoint: "0x6EDCE65403992e310A62460808c4b910D972f10f",
        chainSelector: "16015286601757825753",
        lzEid: 40161
    },
    amoy: {
        name: "Polygon Amoy",
        ccipRouter: "0x9C32fCB86BF0f4a1A8921a9Fe46de3198bb884B2",
        lzEndpoint: "0x6EDCE65403992e310A62460808c4b910D972f10f",
        chainSelector: "16281711391670634445",
        lzEid: 40267
    },
    baseSepolia: {
        name: "Base Sepolia",
        ccipRouter: "0xD3b06cEbF099CE7DA4AcCf578aaebFDBd6e88a93",
        lzEndpoint: "0x6EDCE65403992e310A62460808c4b910D972f10f",
        chainSelector: "10344971235874465080",
        lzEid: 40245
    },
    arbSepolia: {
        name: "Arbitrum Sepolia",
        ccipRouter: "0x2a9C5afB0d0e4BAb2BCdaE109EC4b0c4Be15a165",
        lzEndpoint: "0x6EDCE65403992e310A62460808c4b910D972f10f",
        chainSelector: "3478487238524512106",
        lzEid: 40231
    }
};

// Supported tokens per chain
const SUPPORTED_TOKENS = {
    polygon: {
        USDC: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
        USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
        DAI: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063"
    },
    ethereum: {
        USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F"
    },
    arbitrum: {
        USDC: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
        USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
        DAI: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1"
    },
    base: {
        USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
    },
    // Testnets
    sepolia: {
        USDC: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"
    },
    amoy: {
        USDC: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582"
    }
};

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    const network = hre.network.name;

    console.log("\n===========================================");
    console.log("🚀 Cross-Chain Deployment Script");
    console.log("===========================================\n");
    console.log("Network:", network);
    console.log("Deployer:", deployer.address);
    console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

    const config = CHAIN_CONFIGS[network];
    if (!config) {
        throw new Error(`No configuration found for network: ${network}`);
    }

    const deployments = {};

    // ============================================
    // 1. Deploy CCIP Token Bridge
    // ============================================
    console.log("📦 Deploying CCIPTokenBridge...");
    const CCIPTokenBridge = await hre.ethers.getContractFactory("CCIPTokenBridge");
    const ccipBridge = await CCIPTokenBridge.deploy(
        config.ccipRouter,
        deployer.address
    );
    await ccipBridge.waitForDeployment();
    const ccipBridgeAddress = await ccipBridge.getAddress();
    console.log("✅ CCIPTokenBridge deployed to:", ccipBridgeAddress);
    deployments.ccipBridge = ccipBridgeAddress;

    // ============================================
    // 2. Deploy Cross-Chain Escrow Manager
    // ============================================
    console.log("\n📦 Deploying CrossChainEscrowManager...");
    const CrossChainEscrowManager = await hre.ethers.getContractFactory("CrossChainEscrowManager");
    const escrowManager = await CrossChainEscrowManager.deploy(
        config.ccipRouter,
        deployer.address
    );
    await escrowManager.waitForDeployment();
    const escrowManagerAddress = await escrowManager.getAddress();
    console.log("✅ CrossChainEscrowManager deployed to:", escrowManagerAddress);
    deployments.escrowManager = escrowManagerAddress;

    // ============================================
    // 3. Deploy OmniReputation
    // ============================================
    console.log("\n📦 Deploying OmniReputation...");
    const OmniReputation = await hre.ethers.getContractFactory("OmniReputation");
    const omniReputation = await OmniReputation.deploy(
        config.lzEndpoint,
        deployer.address
    );
    await omniReputation.waitForDeployment();
    const omniReputationAddress = await omniReputation.getAddress();
    console.log("✅ OmniReputation deployed to:", omniReputationAddress);
    deployments.omniReputation = omniReputationAddress;

    // ============================================
    // 4. Configure CCIP Bridge
    // ============================================
    console.log("\n⚙️  Configuring CCIP Bridge...");

    // Whitelist tokens
    const tokens = SUPPORTED_TOKENS[network] || {};
    for (const [symbol, address] of Object.entries(tokens)) {
        console.log(`  - Whitelisting ${symbol} (${address})...`);
        const tx = await ccipBridge.setWhitelistedToken(address, true);
        await tx.wait();

        // Set bridge limits (example: min 1 USDC, max 100,000 USDC)
        if (symbol === "USDC") {
            const minAmount = hre.ethers.parseUnits("1", 6);
            const maxAmount = hre.ethers.parseUnits("100000", 6);
            const limitTx = await ccipBridge.setBridgeLimits(address, minAmount, maxAmount);
            await limitTx.wait();
            console.log(`    ✓ Set limits: ${hre.ethers.formatUnits(minAmount, 6)} - ${hre.ethers.formatUnits(maxAmount, 6)}`);
        }
    }

    // ============================================
    // 5. Save Deployment Info
    // ============================================
    const deploymentInfo = {
        network: network,
        chainName: config.name,
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        contracts: {
            ccipBridge: ccipBridgeAddress,
            escrowManager: escrowManagerAddress,
            omniReputation: omniReputationAddress
        },
        config: {
            ccipRouter: config.ccipRouter,
            lzEndpoint: config.lzEndpoint,
            chainSelector: config.chainSelector,
            lzEid: config.lzEid
        },
        tokens: tokens
    };

    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentFile = path.join(deploymentsDir, `${network}_crosschain.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log("\n💾 Deployment info saved to:", deploymentFile);

    // ============================================
    // 6. Print Summary
    // ============================================
    console.log("\n===========================================");
    console.log("✅ Deployment Complete!");
    console.log("===========================================");
    console.log("\nDeployed Contracts:");
    console.log("  CCIPTokenBridge:         ", ccipBridgeAddress);
    console.log("  CrossChainEscrowManager: ", escrowManagerAddress);
    console.log("  OmniReputation:          ", omniReputationAddress);
    console.log("\nConfiguration:");
    console.log("  CCIP Router:             ", config.ccipRouter);
    console.log("  LayerZero Endpoint:      ", config.lzEndpoint);
    console.log("  Chain Selector:          ", config.chainSelector);
    console.log("  LayerZero EID:           ", config.lzEid);
    console.log("\n===========================================\n");

    // ============================================
    // 7. Verification Instructions
    // ============================================
    console.log("📝 To verify contracts, run:");
    console.log(`\nnpx hardhat verify --network ${network} ${ccipBridgeAddress} "${config.ccipRouter}" "${deployer.address}"`);
    console.log(`npx hardhat verify --network ${network} ${escrowManagerAddress} "${config.ccipRouter}" "${deployer.address}"`);
    console.log(`npx hardhat verify --network ${network} ${omniReputationAddress} "${config.lzEndpoint}" "${deployer.address}"`);
    console.log("\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
