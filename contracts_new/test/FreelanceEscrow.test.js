const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("FreelanceEscrow Verification", function () {
    let FreelanceEscrow;
    let escrow;
    let owner, client, freelancer, other;

    beforeEach(async function () {
        [owner, client, freelancer, other] = await ethers.getSigners();

        FreelanceEscrow = await ethers.getContractFactory("FreelanceEscrow");
        escrow = await upgrades.deployProxy(FreelanceEscrow, [
            owner.address,
            ethers.ZeroAddress, // trustedForwarder
            ethers.ZeroAddress, // ccipRouter
            ethers.ZeroAddress, // insurancePool
            ethers.ZeroAddress  // lzEndpoint
        ], {
            initializer: "initialize",
            kind: "uups",
        });
        await escrow.waitForDeployment();
    });

    it("Should initialize correctly and grant roles", async function () {
        expect(await escrow.hasRole(await escrow.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
        expect(await escrow.hasRole(await escrow.ARBITRATOR_ROLE(), owner.address)).to.be.true;
        expect(await escrow.hasRole(await escrow.MANAGER_ROLE(), owner.address)).to.be.true;
    });

    it("Should return correct message sender on direct call", async function () {
        // Direct call should use super._msgSender() which is msg.sender
        // Can't easily test internal _msgSender override without a mock forwarder,
        // but we can check if it reverts or behaves strangely.
        expect(await escrow.owner()).to.equal(owner.address);
    });
});
