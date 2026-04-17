/**
 * @file deploy_mainnet_full.js
 * @title PolyLance Zenith — Full Mainnet Deployment
 * @author Akhil Muvva & Balram Taddi
 * @network Polygon Mainnet (Chain ID: 137)
 *
 * Deploys the complete PolyLance Zenith protocol in dependency order:
 *   1. PolyToken          – ERC-20 reward token
 *   2. InsurancePool      – Protocol risk reserve
 *   3. PolyLanceForwarder – ERC-2771 gasless forwarder
 *   4. FreelanceSBT       – Soulbound identity token
 *   5. PolyCompletionSBT  – Work-completion certificate
 *   6. FreelancerReputation (UUPS) – On-chain reputation
 *   7. YieldManager       – Multi-strategy yield engine
 *   8. SwapManager        – Token swap routing
 *   9. PrivacyShield      – ZK identity gating
 *  10. FreelanceEscrow   (UUPS) – Core milestone escrow
 *  11. PolyTimelock       – Governance time-lock
 *  12. FreelanceGovernance – DAO governance
 *  13. SecureMessenger    – On-chain encrypted messaging
 *
 * Post-deployment:
 *  - Links all contracts together (roles, addresses)
 *  - Whitelists USDC, USDT, DAI, PolyToken
 *  - Writes deployment_mainnet_full.json
 *  - Updates frontend/src/constants.js automatically
 *
 * Usage:
 *   npx hardhat run scripts/deploy_mainnet_full.js --network polygon
 */
const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

// ─── Polygon Mainnet Production Constants ────────────────────────────────────
const POLYGON_MAINNET_USDC  = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
const POLYGON_MAINNET_USDT  = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";
const POLYGON_MAINNET_DAI   = "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063";
const UNISWAP_V3_ROUTER     = "0xE592427A0AEce92De3Edee1F18E0157C05861564"; // Uniswap V3 SwapRouter Polygon

async function deploy(factory, args = [], opts = {}) {
    let contract;
    if (opts.proxy) {
        contract = await upgrades.deployProxy(factory, args, { kind: "uups", ...opts.proxyOpts });
    } else {
        contract = await factory.deploy(...args);
    }
    await contract.waitForDeployment();
    return contract;
}

async function main() {
    const network = await ethers.provider.getNetwork();
    if (network.chainId !== 137n) {
        throw new Error(`ABORT: Expected Polygon Mainnet (137), got chainId=${network.chainId}. Re-run with --network polygon`);
    }

    const [deployer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("=".repeat(60));
    console.log("  PolyLance Zenith — Full Mainnet Deployment");
    console.log("  Author: Akhil Muvva & Balram Taddi");
    console.log("=".repeat(60));
    console.log(`  Network   : Polygon Mainnet (${network.chainId})`);
    console.log(`  Deployer  : ${deployer.address}`);
    console.log(`  Balance   : ${ethers.formatEther(balance)} MATIC`);
    console.log("=".repeat(60));

    if (balance < ethers.parseEther("1")) {
        console.warn("⚠️  WARNING: Deployer balance < 1 MATIC. Deployment may fail.");
    }

    const outputPath    = path.join(__dirname, "deployment_mainnet_full.json");
    const frontendConst = path.resolve(__dirname, "..", "..", "frontend", "src", "constants.js");

    // ── Load resumable state ────────────────────────────────────────────────
    let addr = {};
    if (fs.existsSync(outputPath)) {
        try { addr = JSON.parse(fs.readFileSync(outputPath, "utf8")); }
        catch (_) {}
        console.log("↩️  Resuming from previous partial deployment.");
    }

    const save = () => fs.writeFileSync(outputPath, JSON.stringify(addr, null, 2));

    const isLive = async (a) => {
        if (!a) return false;
        try { return (await ethers.provider.getCode(a)) !== "0x"; }
        catch { return false; }
    };

    // ── Helper: deploy-once ─────────────────────────────────────────────────
    async function once(key, label, fn) {
        if (await isLive(addr[key])) {
            console.log(`✅ [SKIP] ${label}: ${addr[key]}`);
            return addr[key];
        }
        process.stdout.write(`🚀 Deploying ${label}... `);
        const address = await fn();
        addr[key] = address;
        save();
        console.log(address);
        return address;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 1. PolyToken
    // ═══════════════════════════════════════════════════════════════════════
    await once("PolyToken", "PolyToken", async () => {
        const F = await ethers.getContractFactory("PolyToken");
        const c = await deploy(F, [deployer.address]);
        return await c.getAddress();
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 2. InsurancePool
    // ═══════════════════════════════════════════════════════════════════════
    await once("InsurancePool", "InsurancePool", async () => {
        const F = await ethers.getContractFactory("InsurancePool");
        const c = await deploy(F, [deployer.address]);
        return await c.getAddress();
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 3. PolyLanceForwarder
    // ═══════════════════════════════════════════════════════════════════════
    await once("PolyLanceForwarder", "PolyLanceForwarder", async () => {
        const F = await ethers.getContractFactory("PolyLanceForwarder");
        const c = await deploy(F);
        return await c.getAddress();
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 4. FreelanceSBT
    // ═══════════════════════════════════════════════════════════════════════
    await once("FreelanceSBT", "FreelanceSBT", async () => {
        const F = await ethers.getContractFactory("FreelanceSBT");
        const c = await deploy(F, [deployer.address, deployer.address]);
        return await c.getAddress();
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 5. FreelancerReputation (UUPS proxy)
    // ═══════════════════════════════════════════════════════════════════════
    await once("FreelancerReputation", "FreelancerReputation (UUPS)", async () => {
        const F = await ethers.getContractFactory("FreelancerReputation");
        const c = await deploy(F, [deployer.address, "https://api.polylance.codes/metadata/rep/{id}"], { proxy: true });
        return await c.getAddress();
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 6. YieldManager
    // ═══════════════════════════════════════════════════════════════════════
    await once("YieldManager", "YieldManager", async () => {
        const F = await ethers.getContractFactory("YieldManager");
        // constructor(address _admin)
        const c = await deploy(F, [deployer.address]);
        return await c.getAddress();
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 7. SwapManager
    // ═══════════════════════════════════════════════════════════════════════
    await once("SwapManager", "SwapManager", async () => {
        const F = await ethers.getContractFactory("SwapManager");
        // constructor(address _router) using Uniswap V3 on Polygon
        const c = await deploy(F, [UNISWAP_V3_ROUTER]);
        return await c.getAddress();
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 8. PrivacyShield
    // ═══════════════════════════════════════════════════════════════════════
    await once("PrivacyShield", "PrivacyShield", async () => {
        const F = await ethers.getContractFactory("PrivacyShield");
        const c = await deploy(F, [deployer.address]);
        return await c.getAddress();
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 9. FreelanceEscrow (UUPS proxy) — core contract
    // ═══════════════════════════════════════════════════════════════════════
    await once("FreelanceEscrow", "FreelanceEscrow (UUPS)", async () => {
        const F = await ethers.getContractFactory("FreelanceEscrow");
        const c = await deploy(F, [
            deployer.address,         // admin
            addr.PolyLanceForwarder,  // trustedForwarder (ERC-2771)
            addr.FreelanceSBT,        // _sbt
            deployer.address          // _entry (ERC-4337 — update post-deploy)
        ], { proxy: true });
        return await c.getAddress();
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 10. PolyCompletionSBT
    // ═══════════════════════════════════════════════════════════════════════
    await once("PolyCompletionSBT", "PolyCompletionSBT", async () => {
        const F = await ethers.getContractFactory("PolyCompletionSBT");
        const c = await deploy(F, [deployer.address, addr.FreelanceEscrow]);
        return await c.getAddress();
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 11. PolyTimelock
    // ═══════════════════════════════════════════════════════════════════════
    await once("PolyTimelock", "PolyTimelock", async () => {
        const F = await ethers.getContractFactory("PolyTimelock");
        // (minDelay, proposers, executors, admin)
        const c = await deploy(F, [172800, [deployer.address], [deployer.address], deployer.address]); // 48h delay
        return await c.getAddress();
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 12. FreelanceGovernance
    // ═══════════════════════════════════════════════════════════════════════
    await once("FreelanceGovernance", "FreelanceGovernance", async () => {
        const F = await ethers.getContractFactory("FreelanceGovernance");
        const c = await deploy(F, [addr.FreelanceSBT]);
        return await c.getAddress();
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 13. SecureMessenger
    // ═══════════════════════════════════════════════════════════════════════
    await once("SecureMessenger", "SecureMessenger", async () => {
        const F = await ethers.getContractFactory("SecureMessenger");
        const c = await deploy(F, []);
        return await c.getAddress();
    });

    // ═══════════════════════════════════════════════════════════════════════
    // POST-DEPLOYMENT LINKING
    // ═══════════════════════════════════════════════════════════════════════
    if (!addr._linked) {
        console.log("\n🔗 Linking contracts...");

        const escrow = await ethers.getContractAt("FreelanceEscrow", addr.FreelanceEscrow);
        const token  = await ethers.getContractAt("PolyToken",       addr.PolyToken);
        const rep    = await ethers.getContractAt("FreelancerReputation", addr.FreelancerReputation);
        const sbt    = await ethers.getContractAt("FreelanceSBT",    addr.FreelanceSBT);

        // Link auxiliary contracts to escrow
        await (await escrow.setPolyToken(addr.PolyToken)).wait();
        console.log("  ✅ setPolyToken");
        await (await escrow.setReputationContract(addr.FreelancerReputation)).wait();
        console.log("  ✅ setReputationContract");
        await (await escrow.setSBTContract(addr.FreelanceSBT)).wait();
        console.log("  ✅ setSBTContract");
        await (await escrow.setCompletionCertContract(addr.PolyCompletionSBT)).wait();
        console.log("  ✅ setCompletionCertContract");
        await (await escrow.setYieldManager(addr.YieldManager)).wait();
        console.log("  ✅ setYieldManager");
        await (await escrow.setSwapManager(addr.SwapManager)).wait();
        console.log("  ✅ setSwapManager");
        await (await escrow.setPrivacyShield(addr.PrivacyShield)).wait();
        console.log("  ✅ setPrivacyShield");
        await (await escrow.setVault(deployer.address)).wait(); // Update to multisig in production
        console.log("  ✅ setVault");

        // Whitelist tokens for payments
        await (await escrow.setTokenWhitelist(addr.PolyToken, true)).wait();
        await (await escrow.setTokenWhitelist(POLYGON_MAINNET_USDC, true)).wait();
        await (await escrow.setTokenWhitelist(POLYGON_MAINNET_USDT, true)).wait();
        await (await escrow.setTokenWhitelist(POLYGON_MAINNET_DAI, true)).wait();
        console.log("  ✅ Whitelisted: POLY, USDC, USDT, DAI");

        // Grant MINTER_ROLE on PolyToken to Escrow
        const POLY_MINTER = await token.MINTER_ROLE();
        await (await token.grantRole(POLY_MINTER, addr.FreelanceEscrow)).wait();
        console.log("  ✅ Granted MINTER_ROLE on PolyToken to Escrow");

        // Grant MINTER_ROLE on Reputation to Escrow
        const REP_MINTER = await rep.MINTER_ROLE();
        await (await rep.grantRole(REP_MINTER, addr.FreelanceEscrow)).wait();
        console.log("  ✅ Granted MINTER_ROLE on Reputation to Escrow");

        // Grant MINTER_ROLE on SBT to Escrow
        const SBT_MINTER = await sbt.MINTER_ROLE();
        await (await sbt.grantRole(SBT_MINTER, addr.FreelanceEscrow)).wait();
        console.log("  ✅ Granted MINTER_ROLE on FreelanceSBT to Escrow");

        // Link Timelock to Governance
        const governance = await ethers.getContractAt("FreelanceGovernance", addr.FreelanceGovernance);
        await (await governance.setTimelock(addr.PolyTimelock)).wait();
        console.log("  ✅ setTimelock on FreelanceGovernance");

        // Link YieldManager safety/treasury configs
        const ym = await ethers.getContractAt("YieldManager", addr.YieldManager);
        await (await ym.setSafetyModule(addr.InsurancePool)).wait();
        await (await ym.setProtocolTreasury(deployer.address)).wait(); // Update to DAO multisig in prod
        await (await ym.setGovernanceTimelock(addr.PolyTimelock)).wait();
        console.log("  ✅ YieldManager configured (SafetyModule, Treasury, Timelock)");

        addr._linked   = true;
        addr.network   = "Polygon Mainnet";
        addr.chainId   = "137";
        addr.deployer  = deployer.address;
        addr.timestamp = new Date().toISOString();
        save();
    } else {
        console.log("\n✅ [SKIP] Contracts already linked.");
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UPDATE FRONTEND constants.js
    // ═══════════════════════════════════════════════════════════════════════
    try {
        if (fs.existsSync(frontendConst)) {
            let content = fs.readFileSync(frontendConst, "utf8");
            content = content.replace(/export const CONTRACT_ADDRESS = '.*?';/, `export const CONTRACT_ADDRESS = '${addr.FreelanceEscrow}';`);
            content = content.replace(/export const POLY_TOKEN_ADDRESS = '.*?';/, `export const POLY_TOKEN_ADDRESS = '${addr.PolyToken}';`);
            content = content.replace(/export const REPUTATION_ADDRESS = '.*?';/, `export const REPUTATION_ADDRESS = '${addr.FreelancerReputation}';`);
            content = content.replace(/export const GOVERNANCE_ADDRESS = '.*?';/, `export const GOVERNANCE_ADDRESS = '${addr.FreelanceGovernance}';`);
            content = content.replace(
                /export const YIELD_MANAGER_ADDRESS = IS_AMOY[\s\S]*?'0x0000000000000000000000000000000000000000';/,
                `export const YIELD_MANAGER_ADDRESS = IS_AMOY\n    ? '0xAD2aF960570bFc0861198A699435b54FC9067890'\n    : '${addr.YieldManager}';`
            );
            content = content.replace(
                /export const SWAP_MANAGER_ADDRESS = IS_AMOY[\s\S]*?'0x0000000000000000000000000000000000000000';/,
                `export const SWAP_MANAGER_ADDRESS = IS_AMOY\n    ? '0xBD2aF960570bFc0861198A699435b54FC9078901'\n    : '${addr.SwapManager}';`
            );
            content = content.replace(
                /export const STREAMING_ESCROW_ADDRESS = IS_AMOY[\s\S]*?\/\/ Updated after mainnet deploy/,
                `export const STREAMING_ESCROW_ADDRESS = IS_AMOY\n    ? '0xfc073209b7936A771F77F63D42019a3a93311869'\n    : '${addr.FreelanceEscrow}'; // Mainnet`
            );
            content = content.replace(
                /export const SECURE_MESSENGER_ADDRESS = IS_AMOY[\s\S]*?\/\/ Updated after mainnet deploy/,
                `export const SECURE_MESSENGER_ADDRESS = IS_AMOY\n    ? '0x0000000000000000000000000000000000000000'\n    : '${addr.SecureMessenger}'; // Mainnet`
            );
            fs.writeFileSync(frontendConst, content, "utf8");
            console.log("\n📦 Updated frontend/src/constants.js with all Mainnet addresses.");
        }
    } catch (e) {
        console.warn("⚠️  Could not update frontend constants:", e.message);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DEPLOYMENT SUMMARY
    // ═══════════════════════════════════════════════════════════════════════
    console.log("\n" + "=".repeat(60));
    console.log("  DEPLOYMENT SUMMARY — Polygon Mainnet");
    console.log("=".repeat(60));
    const keys = [
        "PolyToken", "InsurancePool", "PolyLanceForwarder",
        "FreelanceSBT", "PolyCompletionSBT", "FreelancerReputation",
        "YieldManager", "SwapManager", "PrivacyShield",
        "FreelanceEscrow", "PolyTimelock", "FreelanceGovernance",
        "SecureMessenger"
    ];
    for (const k of keys) {
        if (addr[k]) console.log(`  ${k.padEnd(25)} ${addr[k]}`);
    }
    console.log("=".repeat(60));
    console.log(`  File: ${outputPath}`);
    console.log("=".repeat(60));
    console.log("\n🚀 ZENITH PROTOCOL LIVE ON POLYGON MAINNET.\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Deployment FAILED:", error.message);
        process.exit(1);
    });
