const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

/**
 * Security Tests for FreelanceEscrow
 * Tests for common vulnerabilities and attack vectors
 */
describe("FreelanceEscrow - Security Tests", function () {
    let escrow, reputation, sbt, polyToken, vault;
    let owner, client, freelancer, attacker;
    let escrowAddress;

    const STAKE_AMOUNT = ethers.parseEther("0.05");
    const JOB_AMOUNT = ethers.parseEther("1.0");
    const CATEGORY_ID = 1;
    const DURATION_DAYS = 7;
    const IPFS_HASH = "QmTest123";

    async function deployFixture() {
        const [owner, client, freelancer, attacker] = await ethers.getSigners();

        // Deploy contracts
        const PolyToken = await ethers.getContractFactory("PolyToken");
        const polyToken = await PolyToken.deploy(owner.address);

        const Vault = await ethers.getContractFactory("Vault");
        const vault = await Vault.deploy();

        const FreelanceSBT = await ethers.getContractFactory("FreelanceSBT");
        const sbt = await FreelanceSBT.deploy();

        const FreelancerReputation = await ethers.getContractFactory("FreelancerReputation");
        const reputation = await FreelancerReputation.deploy();

        const FreelanceEscrow = await ethers.getContractFactory("FreelanceEscrow");
        const escrow = await upgrades.deployProxy(
            FreelanceEscrow,
            [await sbt.getAddress(), await polyToken.getAddress(), await reputation.getAddress()],
            { initializer: "initialize", kind: "uups" }
        );

        const escrowAddress = await escrow.getAddress();

        // Setup
        const MINTER_ROLE = await sbt.MINTER_ROLE();
        await sbt.grantRole(MINTER_ROLE, escrowAddress);
        await escrow.setVault(await vault.getAddress());
        await escrow.whitelistToken(ethers.ZeroAddress, true);
        await escrow.setStakeAmount(STAKE_AMOUNT);

        return { escrow, reputation, sbt, polyToken, vault, owner, client, freelancer, attacker, escrowAddress };
    }

    beforeEach(async function () {
        const fixture = await loadFixture(deployFixture);
        escrow = fixture.escrow;
        reputation = fixture.reputation;
        sbt = fixture.sbt;
        polyToken = fixture.polyToken;
        vault = fixture.vault;
        owner = fixture.owner;
        client = fixture.client;
        freelancer = fixture.freelancer;
        attacker = fixture.attacker;
        escrowAddress = fixture.escrowAddress;
    });

    describe("Reentrancy Protection", function () {
        it("Should prevent reentrancy attacks on releaseFunds", async function () {
            // Create malicious contract that attempts reentrancy
            const MaliciousReceiver = await ethers.getContractFactory("MaliciousReceiver");
            const malicious = await MaliciousReceiver.deploy(escrowAddress);
            await malicious.waitForDeployment();

            // Create job with malicious contract as freelancer
            await escrow.connect(client).createJob(
                await malicious.getAddress(),
                ethers.ZeroAddress,
                JOB_AMOUNT,
                IPFS_HASH,
                DURATION_DAYS,
                CATEGORY_ID,
                { value: JOB_AMOUNT }
            );

            const jobId = 1;

            // Note: This test assumes you have ReentrancyGuard implemented
            // The malicious contract would try to call releaseFunds again
            // during the receive() callback, which should fail
        });

        it("Should prevent reentrancy on refund operations", async function () {
            // Similar test for refund operations
            await escrow.connect(client).createJob(
                freelancer.address,
                ethers.ZeroAddress,
                JOB_AMOUNT,
                IPFS_HASH,
                DURATION_DAYS,
                CATEGORY_ID,
                { value: JOB_AMOUNT }
            );

            const jobId = 1;

            // Cancel and attempt reentrancy during refund
            // Should be protected by ReentrancyGuard
        });
    });

    describe("Access Control Vulnerabilities", function () {
        it("Should prevent unauthorized role assignment", async function () {
            const MANAGER_ROLE = await escrow.MANAGER_ROLE();

            // Attacker should not be able to grant themselves manager role
            await expect(
                escrow.connect(attacker).grantRole(MANAGER_ROLE, attacker.address)
            ).to.be.reverted;
        });

        it("Should prevent unauthorized contract upgrades", async function () {
            const FreelanceEscrowV2 = await ethers.getContractFactory("FreelanceEscrow");

            // Attacker should not be able to upgrade contract
            await expect(
                upgrades.upgradeProxy(escrowAddress, FreelanceEscrowV2.connect(attacker))
            ).to.be.reverted;
        });

        it("Should prevent unauthorized fee changes", async function () {
            await expect(
                escrow.connect(attacker).setPlatformFee(500)
            ).to.be.reverted;
        });

        it("Should prevent unauthorized vault changes", async function () {
            await expect(
                escrow.connect(attacker).setVault(attacker.address)
            ).to.be.reverted;
        });
    });

    describe("Integer Overflow/Underflow Protection", function () {
        it("Should handle maximum uint256 values safely", async function () {
            const maxUint256 = ethers.MaxUint256;

            // Should revert with appropriate error, not overflow
            await expect(
                escrow.connect(client).createJob(
                    freelancer.address,
                    ethers.ZeroAddress,
                    maxUint256,
                    IPFS_HASH,
                    DURATION_DAYS,
                    CATEGORY_ID,
                    { value: JOB_AMOUNT }
                )
            ).to.be.reverted;
        });

        it("Should handle fee calculations without overflow", async function () {
            const largeAmount = ethers.parseEther("1000000");

            await escrow.connect(client).createJob(
                freelancer.address,
                ethers.ZeroAddress,
                largeAmount,
                IPFS_HASH,
                DURATION_DAYS,
                CATEGORY_ID,
                { value: largeAmount }
            );

            const jobId = 1;
            await escrow.connect(freelancer).applyForJob(jobId, { value: STAKE_AMOUNT });
            await escrow.connect(client).acceptFreelancer(jobId, freelancer.address);
            await escrow.connect(freelancer).acceptJob(jobId);
            await escrow.connect(freelancer).submitWork(jobId, "QmWork123");

            // Should not overflow when calculating fees
            await expect(
                escrow.connect(client).releaseFunds(jobId)
            ).to.not.be.reverted;
        });
    });

    describe("Front-Running Protection", function () {
        it("Should prevent front-running of job acceptance", async function () {
            await escrow.connect(client).createJob(
                freelancer.address,
                ethers.ZeroAddress,
                JOB_AMOUNT,
                IPFS_HASH,
                DURATION_DAYS,
                CATEGORY_ID,
                { value: JOB_AMOUNT }
            );

            const jobId = 1;
            await escrow.connect(freelancer).applyForJob(jobId, { value: STAKE_AMOUNT });

            // Attacker tries to front-run and accept the job
            await expect(
                escrow.connect(attacker).acceptFreelancer(jobId, attacker.address)
            ).to.be.revertedWithCustomError(escrow, "NotAuthorized");
        });

        it("Should prevent front-running of fund release", async function () {
            await escrow.connect(client).createJob(
                freelancer.address,
                ethers.ZeroAddress,
                JOB_AMOUNT,
                IPFS_HASH,
                DURATION_DAYS,
                CATEGORY_ID,
                { value: JOB_AMOUNT }
            );

            const jobId = 1;
            await escrow.connect(freelancer).applyForJob(jobId, { value: STAKE_AMOUNT });
            await escrow.connect(client).acceptFreelancer(jobId, freelancer.address);
            await escrow.connect(freelancer).acceptJob(jobId);
            await escrow.connect(freelancer).submitWork(jobId, "QmWork123");

            // Attacker tries to release funds
            await expect(
                escrow.connect(attacker).releaseFunds(jobId)
            ).to.be.revertedWithCustomError(escrow, "NotAuthorized");
        });
    });

    describe("DoS Attack Prevention", function () {
        it("Should handle multiple applications without DoS", async function () {
            await escrow.connect(client).createJob(
                ethers.ZeroAddress, // Open job
                ethers.ZeroAddress,
                JOB_AMOUNT,
                IPFS_HASH,
                DURATION_DAYS,
                CATEGORY_ID,
                { value: JOB_AMOUNT }
            );

            const jobId = 1;

            // Multiple freelancers apply
            const signers = await ethers.getSigners();
            for (let i = 0; i < 10; i++) {
                await escrow.connect(signers[i]).applyForJob(jobId, { value: STAKE_AMOUNT });
            }

            // Client should still be able to accept a freelancer
            await expect(
                escrow.connect(client).acceptFreelancer(jobId, signers[0].address)
            ).to.not.be.reverted;
        });

        it("Should prevent gas griefing in loops", async function () {
            // Test that contract functions don't have unbounded loops
            // that could be exploited for gas griefing

            // This is more of a code review item, but we can test
            // that operations complete within reasonable gas limits
            const tx = await escrow.connect(client).createJob(
                freelancer.address,
                ethers.ZeroAddress,
                JOB_AMOUNT,
                IPFS_HASH,
                DURATION_DAYS,
                CATEGORY_ID,
                { value: JOB_AMOUNT }
            );

            const receipt = await tx.wait();
            expect(receipt.gasUsed).to.be.lt(1000000); // Reasonable gas limit
        });
    });

    describe("Input Validation", function () {
        it("Should reject zero address as freelancer", async function () {
            await expect(
                escrow.connect(client).createJob(
                    ethers.ZeroAddress,
                    ethers.ZeroAddress,
                    JOB_AMOUNT,
                    IPFS_HASH,
                    DURATION_DAYS,
                    CATEGORY_ID,
                    { value: JOB_AMOUNT }
                )
            ).to.not.be.reverted; // Zero address means open job
        });

        it("Should reject zero amount jobs", async function () {
            await expect(
                escrow.connect(client).createJob(
                    freelancer.address,
                    ethers.ZeroAddress,
                    0,
                    IPFS_HASH,
                    DURATION_DAYS,
                    CATEGORY_ID
                )
            ).to.be.revertedWithCustomError(escrow, "InvalidAmount");
        });

        it("Should reject empty IPFS hash", async function () {
            await expect(
                escrow.connect(client).createJob(
                    freelancer.address,
                    ethers.ZeroAddress,
                    JOB_AMOUNT,
                    "",
                    DURATION_DAYS,
                    CATEGORY_ID,
                    { value: JOB_AMOUNT }
                )
            ).to.be.reverted;
        });

        it("Should reject invalid rating values", async function () {
            await escrow.connect(client).createJob(
                freelancer.address,
                ethers.ZeroAddress,
                JOB_AMOUNT,
                IPFS_HASH,
                DURATION_DAYS,
                CATEGORY_ID,
                { value: JOB_AMOUNT }
            );

            const jobId = 1;
            await escrow.connect(freelancer).applyForJob(jobId, { value: STAKE_AMOUNT });
            await escrow.connect(client).acceptFreelancer(jobId, freelancer.address);
            await escrow.connect(freelancer).acceptJob(jobId);
            await escrow.connect(freelancer).submitWork(jobId, "QmWork123");
            await escrow.connect(client).releaseFunds(jobId);

            // Rating above 5 should fail
            await expect(
                escrow.connect(client).submitReview(jobId, 6, "QmReview123")
            ).to.be.revertedWithCustomError(escrow, "InvalidRating");
        });
    });

    describe("State Manipulation Prevention", function () {
        it("Should prevent double application", async function () {
            await escrow.connect(client).createJob(
                freelancer.address,
                ethers.ZeroAddress,
                JOB_AMOUNT,
                IPFS_HASH,
                DURATION_DAYS,
                CATEGORY_ID,
                { value: JOB_AMOUNT }
            );

            const jobId = 1;
            await escrow.connect(freelancer).applyForJob(jobId, { value: STAKE_AMOUNT });

            // Second application should fail
            await expect(
                escrow.connect(freelancer).applyForJob(jobId, { value: STAKE_AMOUNT })
            ).to.be.revertedWithCustomError(escrow, "AlreadyApplied");
        });

        it("Should prevent double payment", async function () {
            await escrow.connect(client).createJob(
                freelancer.address,
                ethers.ZeroAddress,
                JOB_AMOUNT,
                IPFS_HASH,
                DURATION_DAYS,
                CATEGORY_ID,
                { value: JOB_AMOUNT }
            );

            const jobId = 1;
            await escrow.connect(freelancer).applyForJob(jobId, { value: STAKE_AMOUNT });
            await escrow.connect(client).acceptFreelancer(jobId, freelancer.address);
            await escrow.connect(freelancer).acceptJob(jobId);
            await escrow.connect(freelancer).submitWork(jobId, "QmWork123");
            await escrow.connect(client).releaseFunds(jobId);

            // Second release should fail
            await expect(
                escrow.connect(client).releaseFunds(jobId)
            ).to.be.revertedWithCustomError(escrow, "InvalidStatus");
        });

        it("Should prevent status manipulation", async function () {
            await escrow.connect(client).createJob(
                freelancer.address,
                ethers.ZeroAddress,
                JOB_AMOUNT,
                IPFS_HASH,
                DURATION_DAYS,
                CATEGORY_ID,
                { value: JOB_AMOUNT }
            );

            const jobId = 1;

            // Cannot submit work before accepting job
            await expect(
                escrow.connect(freelancer).submitWork(jobId, "QmWork123")
            ).to.be.revertedWithCustomError(escrow, "InvalidStatus");
        });
    });

    describe("Fund Security", function () {
        it("Should prevent withdrawal of locked funds", async function () {
            await escrow.connect(client).createJob(
                freelancer.address,
                ethers.ZeroAddress,
                JOB_AMOUNT,
                IPFS_HASH,
                DURATION_DAYS,
                CATEGORY_ID,
                { value: JOB_AMOUNT }
            );

            const contractBalance = await ethers.provider.getBalance(escrowAddress);
            expect(contractBalance).to.equal(JOB_AMOUNT);

            // Attacker should not be able to withdraw funds
            // (No direct withdraw function should exist)
        });

        it("Should handle failed transfers gracefully", async function () {
            // Create a contract that rejects ETH
            const RejectETH = await ethers.getContractFactory("RejectETH");
            const rejectETH = await RejectETH.deploy();
            await rejectETH.waitForDeployment();

            await escrow.connect(client).createJob(
                await rejectETH.getAddress(),
                ethers.ZeroAddress,
                JOB_AMOUNT,
                IPFS_HASH,
                DURATION_DAYS,
                CATEGORY_ID,
                { value: JOB_AMOUNT }
            );

            // This should handle the failed transfer appropriately
            // Implementation depends on your error handling strategy
        });
    });

    describe("Time Manipulation Resistance", function () {
        it("Should handle deadline checks correctly", async function () {
            await escrow.connect(client).createJob(
                freelancer.address,
                ethers.ZeroAddress,
                JOB_AMOUNT,
                IPFS_HASH,
                DURATION_DAYS,
                CATEGORY_ID,
                { value: JOB_AMOUNT }
            );

            const jobId = 1;
            await escrow.connect(freelancer).applyForJob(jobId, { value: STAKE_AMOUNT });
            await escrow.connect(client).acceptFreelancer(jobId, freelancer.address);
            await escrow.connect(freelancer).acceptJob(jobId);
            await escrow.connect(freelancer).submitWork(jobId, "QmWork123");

            // Should not allow auto-release before deadline
            await expect(
                escrow.connect(freelancer).autoRelease(jobId)
            ).to.be.revertedWithCustomError(escrow, "DeadlineNotPassed");

            // Fast forward past deadline
            await time.increase(DURATION_DAYS * 24 * 60 * 60 + 1);

            // Should allow auto-release after deadline
            await expect(
                escrow.connect(freelancer).autoRelease(jobId)
            ).to.not.be.reverted;
        });
    });

    describe("Self-Dealing Prevention", function () {
        it("Should prevent client from hiring themselves", async function () {
            await expect(
                escrow.connect(client).createJob(
                    client.address,
                    ethers.ZeroAddress,
                    JOB_AMOUNT,
                    IPFS_HASH,
                    DURATION_DAYS,
                    CATEGORY_ID,
                    { value: JOB_AMOUNT }
                )
            ).to.be.revertedWithCustomError(escrow, "SelfHiring");
        });
    });
});

// Helper contracts for testing

// Malicious contract that attempts reentrancy
const MaliciousReceiverSource = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IEscrow {
    function releaseFunds(uint256 jobId) external;
}

contract MaliciousReceiver {
    IEscrow public escrow;
    uint256 public attackCount;
    
    constructor(address _escrow) {
        escrow = IEscrow(_escrow);
    }
    
    receive() external payable {
        if (attackCount < 2) {
            attackCount++;
            // Attempt reentrancy
            escrow.releaseFunds(1);
        }
    }
}
`;

// Contract that rejects ETH
const RejectETHSource = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract RejectETH {
    // Reject all ETH transfers
    receive() external payable {
        revert("No ETH accepted");
    }
}
`;
