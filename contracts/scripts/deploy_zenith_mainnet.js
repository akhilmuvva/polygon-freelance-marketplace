const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Starting PolyLance Zenith: Supreme Mainnet Deployment...");

    const [deployer] = await ethers.getSigners();
    console.log("Deployer Address:", deployer.address);
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Balance:", ethers.formatEther(balance), "MATIC");

    // Gas settings for Amoy/Mainnet stability
    const feeData = await ethers.provider.getFeeData();
    
    // CAP the gas price to stay under the 1.0 MATIC fee cap often enforced by RPCs
    const cappedMaxFee = 100000000000n; // 100 Gwei
    const gasOverrides = {
        maxFeePerGas: feeData.maxFeePerGas && feeData.maxFeePerGas > cappedMaxFee ? cappedMaxFee : feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas && feeData.maxPriorityFeePerGas > cappedMaxFee ? cappedMaxFee / 2n : feeData.maxPriorityFeePerGas,
    };
    
    console.log("Using Capped Gas Overrides:", gasOverrides);

    // 1. Deploy Libraries
    console.log("Deploying Libraries...");
    
    const EscrowLib = await ethers.getContractFactory("FreelanceEscrowLibrary");
    const escrowLib = await EscrowLib.deploy(gasOverrides);
    await escrowLib.waitForDeployment();
    const escrowLibAddr = await escrowLib.getAddress();
    console.log("✅ FreelanceEscrowLibrary:", escrowLibAddr);

    const SovereignLib = await ethers.getContractFactory("FreelanceSovereignLibrary");
    const sovereignLib = await SovereignLib.deploy(gasOverrides);
    await sovereignLib.waitForDeployment();
    const sovereignLibAddr = await sovereignLib.getAddress();
    console.log("✅ FreelanceSovereignLibrary:", sovereignLibAddr);

    const AdminLib = await ethers.getContractFactory("FreelanceAdminLibrary");
    const adminLib = await AdminLib.deploy(gasOverrides);
    await adminLib.waitForDeployment();
    const adminLibAddr = await adminLib.getAddress();
    console.log("✅ FreelanceAdminLibrary:", adminLibAddr);

    const DisputeLib = await ethers.getContractFactory("FreelanceDisputeLibrary");
    const disputeLib = await DisputeLib.deploy(gasOverrides);
    await disputeLib.waitForDeployment();
    const disputeLibAddr = await disputeLib.getAddress();
    console.log("✅ FreelanceDisputeLibrary:", disputeLibAddr);

    // 2. Deploy Renderer & JobNFT
    console.log("Deploying Renderer & JobNFT...");
    const Renderer = await ethers.getContractFactory("FreelanceRenderer");
    const renderer = await Renderer.deploy(gasOverrides);
    await renderer.waitForDeployment();
    const rendererAddr = await renderer.getAddress();
    console.log("✅ Renderer:", rendererAddr);

    const JobNFT = await ethers.getContractFactory("FreelanceJobNFT");
    const jobNFTProxy = await upgrades.deployProxy(JobNFT, [deployer.address, "PolyLance Job NFT", "PLJOB"], { 
        kind: "uups",
        txOverrides: gasOverrides
    });
    await jobNFTProxy.waitForDeployment();
    const jobNFTAddr = await jobNFTProxy.getAddress();
    console.log("✅ JobNFT (Proxy):", jobNFTAddr);

    // 3. Deploy PolyToken
    console.log("Deploying PolyToken...");
    const PolyToken = await ethers.getContractFactory("PolyToken");
    const token = await PolyToken.deploy(gasOverrides);
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log("✅ PolyToken:", tokenAddress);

    // 4. Deploy Reputation (UUPS)
    console.log("Deploying FreelancerReputation...");
    const Rep = await ethers.getContractFactory("FreelancerReputation");
    const rep = await upgrades.deployProxy(Rep, [deployer.address, "https://api.polylance.com/metadata/rep/{id}"], { 
        kind: "uups",
        txOverrides: gasOverrides 
    });
    await rep.waitForDeployment();
    const repAddress = await rep.getAddress();
    console.log("✅ Reputation (Proxy):", repAddress);

    // 5. Deploy SBT
    console.log("Deploying FreelanceSBT...");
    const SBT = await ethers.getContractFactory("FreelanceSBT");
    const sbt = await SBT.deploy(deployer.address, deployer.address, gasOverrides); 
    await sbt.waitForDeployment();
    const sbtAddress = await sbt.getAddress();
    console.log("✅ FreelanceSBT:", sbtAddress);

    // 6. Deploy Forwarder
    console.log("Deploying PolyLanceForwarder...");
    const Forwarder = await ethers.getContractFactory("PolyLanceForwarder");
    const forwarder = await Forwarder.deploy(gasOverrides);
    await forwarder.waitForDeployment();
    const forwarderAddress = await forwarder.getAddress();
    console.log("✅ Forwarder:", forwarderAddress);

    // 7. Deploy Escrow (UUPS) with Linked Libraries
    console.log("Deploying FreelanceEscrow...");
    const Escrow = await ethers.getContractFactory("FreelanceEscrow", {
        libraries: {
            "FreelanceEscrowLibrary": escrowLibAddr,
            "FreelanceSovereignLibrary": sovereignLibAddr,
            "FreelanceDisputeLibrary": disputeLibAddr
        }
    });
    
    const escrow = await upgrades.deployProxy(Escrow, [
        deployer.address,
        forwarderAddress,
        sbtAddress,
        deployer.address, 
        jobNFTAddr,
        rendererAddr
    ], { 
        kind: "uups",
        unsafeAllowLinkedLibraries: true,
        txOverrides: gasOverrides
    });
    await escrow.waitForDeployment();
    const escrowAddress = await escrow.getAddress();
    console.log("✅ FreelanceEscrow (Proxy):", escrowAddress);

    // 8. Deploy Completion SBT
    console.log("Deploying PolyCompletionSBT...");
    const CompletionSBT = await ethers.getContractFactory("PolyCompletionSBT");
    const cert = await CompletionSBT.deploy(deployer.address, escrowAddress, gasOverrides);
    await cert.waitForDeployment();
    const certAddress = await cert.getAddress();
    console.log("✅ Completion Cert:", certAddress);

    // 9. Post-Deployment Linking & Permissions
    console.log("Linking contracts & granting roles...");
    
    await (await escrow.setProtocolConfig(4, tokenAddress, 0, gasOverrides)).wait(); // POLY_TOKEN
    await (await escrow.setProtocolConfig(5, repAddress, 0, gasOverrides)).wait();   // REP
    await (await escrow.setProtocolConfig(0, sbtAddress, 0, gasOverrides)).wait();   // SBT
    await (await escrow.setProtocolConfig(6, certAddress, 0, gasOverrides)).wait();  // COMP_CERT
    await (await escrow.setProtocolConfig(2, deployer.address, 0, gasOverrides)).wait(); // VAULT

    // WHITELIST PolyToken and USDC
    const USDC = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
    await (await escrow.setTokenWhitelist(USDC, true, gasOverrides)).wait();
    await (await escrow.setTokenWhitelist(tokenAddress, true, gasOverrides)).wait();

    const MINTER_ROLE = await token.MINTER_ROLE();
    await (await token.grantRole(MINTER_ROLE, escrowAddress, gasOverrides)).wait();
    await (await rep.grantRole(MINTER_ROLE, escrowAddress, gasOverrides)).wait();
    await (await sbt.grantRole(MINTER_ROLE, escrowAddress, gasOverrides)).wait();
    
    const NFT_MINTER_ROLE = await jobNFTProxy.MINTER_ROLE();
    await (await jobNFTProxy.grantRole(NFT_MINTER_ROLE, escrowAddress, gasOverrides)).wait();

    const addresses = {
        PolyToken: tokenAddress,
        FreelancerReputation: repAddress,
        FreelanceSBT: sbtAddress,
        Forwarder: forwarderAddress,
        FreelanceEscrow: escrowAddress,
        PolyCompletionSBT: certAddress,
        JobNFT: jobNFTAddr,
        Renderer: rendererAddr,
        Libraries: {
            Escrow: escrowLibAddr,
            Sovereign: sovereignLibAddr,
            Admin: adminLibAddr,
            Dispute: disputeLibAddr
        },
        Network: hre.network.name,
        Deployer: deployer.address,
        Timestamp: new Date().toISOString()
    };

    const fileName = `deployment_${hre.network.name}_zenith.json`;
    const filePath = path.join(__dirname, fileName);
    fs.writeFileSync(filePath, JSON.stringify(addresses, null, 2));
    console.log("✅ Deployment summary saved to:", filePath);

    console.log("\n🚀 ZENITH PROTOCOL ONLINE. The world of work has been upgraded.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
