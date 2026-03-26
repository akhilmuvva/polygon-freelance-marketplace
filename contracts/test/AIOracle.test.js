const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PolyLance Zenith: AI Oracle Integration", function () {
  let aiOracle;
  let owner, operator, requester;

  beforeEach(async function () {
    [owner, operator, requester] = await ethers.getSigners();

    const AIOracle = await ethers.getContractFactory("AIOracle");
    aiOracle = await AIOracle.deploy();
    await aiOracle.waitForDeployment();

    // Grant Operator role
    const OPERATOR_ROLE = await aiOracle.ORACLE_OPERATOR_ROLE();
    await aiOracle.grantRole(OPERATOR_ROLE, operator.address);
  });

  it("Should actuate a verification request and process AI response", async function () {
    const targetContract = "0x" + "a".repeat(40); // Mock target
    const targetId = 1;
    const vType = "milestone";
    const proofURI = "ipfs://QmProof";

    // 1. Request Verification
    await expect(aiOracle.connect(requester).requestVerification(
        targetContract, targetId, vType, proofURI
    )).to.emit(aiOracle, "VerificationRequested");

    // 2. Submit Verification (as Operator)
    await expect(aiOracle.connect(operator).submitVerification(
        1, // requestId
        true, // approved
        95, // 95% confidence
        "Milestone verified via decentralized vision mesh."
    )).to.emit(aiOracle, "VerificationCompleted");

    const request = await aiOracle.getRequest(1);
    expect(request.status).to.equal(1); // APPROVED
    expect(request.confidence).to.equal(95);
  });

  it("Should reject low-confidence submissions (Resilience Circuit Breaker)", async function () {
    await aiOracle.connect(requester).requestVerification("0x" + "b".repeat(40), 1, "asset", "ipfs://proof");

    // 30% confidence < 80% threshold -> Should move to DISPUTED (3)
    await aiOracle.connect(operator).submitVerification(1, true, 30, "Mismatched telemetry.");
    
    const request = await aiOracle.getRequest(1);
    expect(request.status).to.equal(3); // DISPUTED
  });
});
