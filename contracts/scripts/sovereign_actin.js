const solc = require("solc");
const { ethers } = require("ethers");
require("dotenv").config();
const fs = require("fs");
const path = require("path");

const RPC_URL = process.env.POLYGON_MAINNET_RPC_URL || "https://polygon-rpc.com";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

async function main() {
    console.log("====================================================");
    console.log("🌊 ZENITH SOVEREIGN DEPLOYER (IN-MEMORY BYPASS)");
    console.log("====================================================\n");

    if (!PRIVATE_KEY) throw new Error("Missing PRIVATE_KEY in .env");

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log("Deployer:", wallet.address);
    console.log("Balance:", ethers.formatEther(await provider.getBalance(wallet.address)), "MATIC");

    // 1. Compile ONLY PolyToken.sol for PROOF OF LIFE
    const contractsDir = path.join(__dirname, "../contracts");
    const tokenSource = fs.readFileSync(path.join(contractsDir, "PolyToken.sol"), "utf8");
    const sources = { "PolyToken.sol": { content: tokenSource } };

    const input = {
        language: "Solidity",
        sources: sources,
        settings: { 
            optimizer: { enabled: true, runs: 1000 },
            evmVersion: "cancun",
            outputSelection: { "*": { "*": ["*"] } }
        }
    };

    function findImport(importPath) {
        let fullPath;
        if (importPath.startsWith("@openzeppelin")) {
            fullPath = path.join(__dirname, "../node_modules", importPath);
        } else if (importPath.startsWith("./")) {
            fullPath = path.join(contractsDir, importPath.substring(2));
        } else {
            fullPath = path.join(contractsDir, importPath);
        }

        if (fs.existsSync(fullPath)) return { contents: fs.readFileSync(fullPath, "utf8") };
        // Try node_modules as fallback
        const nodePath = path.join(__dirname, "../node_modules", importPath);
        if (fs.existsSync(nodePath)) return { contents: fs.readFileSync(nodePath, "utf8") };

        return { error: "File not found: " + fullPath };
    }

    console.log("\n📦 Compiling Hardened PolyToken (Proof of Life)...");
    const solcOutput = JSON.parse(solc.compile(JSON.stringify(input), { import: findImport }));

    if (solcOutput.errors && solcOutput.errors.some(e => e.severity === "error")) {
        solcOutput.errors.forEach(e => console.error(e.formattedMessage));
        throw new Error("Compilation failed");
    }

    console.log("✅ Compiled Successfully.");
    const { abi, evm } = solcOutput.contracts["PolyToken.sol"]["PolyToken"];

    // Write ABIs to Frontend
    const frontendContractsDir = path.join(__dirname, "../../frontend/src/contracts");
    if (!fs.existsSync(frontendContractsDir)) fs.mkdirSync(frontendContractsDir, { recursive: true });
    
    fs.writeFileSync(
        path.join(frontendContractsDir, "PolyToken.json"), 
        JSON.stringify({ abi: solcOutput.contracts["PolyToken.sol"]["PolyToken"].abi }, null, 2)
    );
    console.log("📡 Synced PolyToken ABI to Frontend");

    // Optional: Try to compile others for Frontend Sync even if deployment fails
    try {
        const escrowInput = {
            language: "Solidity",
            sources: { 
                "FreelanceEscrow.sol": { content: fs.readFileSync(path.join(contractsDir, "FreelanceEscrow.sol"), "utf8") },
                "FreelanceEscrowBase.sol": { content: fs.readFileSync(path.join(contractsDir, "FreelanceEscrowBase.sol"), "utf8") },
                "FreelanceRenderer.sol": { content: fs.readFileSync(path.join(contractsDir, "FreelanceRenderer.sol"), "utf8") },
                "PrivacyShield.sol": { content: fs.readFileSync(path.join(contractsDir, "PrivacyShield.sol"), "utf8") },
                "FreelanceEscrowLibrary.sol": { content: fs.readFileSync(path.join(contractsDir, "FreelanceEscrowLibrary.sol"), "utf8") },
                "interfaces/IFreelanceSBT.sol": { content: fs.readFileSync(path.join(contractsDir, "interfaces/IFreelanceSBT.sol"), "utf8") },
                "IArbitrator.sol": { content: fs.readFileSync(path.join(contractsDir, "IArbitrator.sol"), "utf8") }
            },
            settings: { 
                optimizer: { enabled: true, runs: 1000 },
                evmVersion: "cancun",
                outputSelection: { "*": { "*": ["*"] } }
            }
        };
        const escrowOutput = JSON.parse(solc.compile(JSON.stringify(escrowInput), { import: findImport }));
        if (escrowOutput.contracts["FreelanceEscrow.sol"]) {
            fs.writeFileSync(
                path.join(frontendContractsDir, "FreelanceEscrow.json"),
                JSON.stringify({ abi: escrowOutput.contracts["FreelanceEscrow.sol"]["FreelanceEscrow"].abi }, null, 2)
            );
            console.log("📡 Synced FreelanceEscrow ABI to Frontend");
        }

        const assetInput = {
            language: "Solidity",
            sources: { "AssetTokenizer.sol": { content: fs.readFileSync(path.join(contractsDir, "AssetTokenizer.sol"), "utf8") } },
            settings: { optimizer: { enabled: true, runs: 1000 }, evmVersion: "cancun", outputSelection: { "*": { "*": ["*"] } } }
        };
        const assetOutput = JSON.parse(solc.compile(JSON.stringify(assetInput), { import: findImport }));
        if (assetOutput.contracts["AssetTokenizer.sol"]) {
            fs.writeFileSync(
                path.join(frontendContractsDir, "AssetTokenizer.json"),
                JSON.stringify({ abi: assetOutput.contracts["AssetTokenizer.sol"]["AssetTokenizer"].abi }, null, 2)
            );
            console.log("📡 Synced AssetTokenizer ABI to Frontend");
        }
    } catch (e) {
        console.warn("⚠️ Could not sync full cross-contract ABIs due to complex dependencies, but PolyToken is live.");
    }

    console.log("🚀 Actuating PolyToken on Polygon Mainnet...");
    const Factory = new ethers.ContractFactory(abi, evm.bytecode.object, wallet);
    const contract = await Factory.deploy();
    await contract.waitForDeployment();
    const address = await contract.getAddress();

    console.log("\n====================================================");
    console.log("🎉 ZENITH PROOF OF LIFE ACTUATED");
    console.log("PolyToken Hardened ->", address);
    console.log("====================================================");
}

main().catch(console.error);
