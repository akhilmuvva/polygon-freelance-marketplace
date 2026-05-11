const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("PolyLance Upgrade Hardening Tests", function () {
    let escrow, timelock, owner, governor, attacker;
    let escrowAddress;

    async function deployFixture() {
        [owner, governor, attacker] = await ethers.getSigners();

        // Deploy Timelock
        const Timelock = await ethers.getContractFactory("PolyLanceTimelock");
        const timelock = await Timelock.deploy(
            [governor.address], // proposers
            [ethers.ZeroAddress], // executors (anybody)
            owner.address // admin
        );
        await timelock.waitForDeployment();
        const timelockAddress = await timelock.getAddress();

        // Deploy Escrow
        const FreelanceEscrow = await ethers.getContractFactory("FreelanceEscrow");
        const escrow = await upgrades.deployProxy(FreelanceEscrow, [
            owner.address, 
            attacker.address, // mock forwarder (different from owner)
            owner.address, 
            owner.address
        ], { initializer: "initialize", kind: "uups" });

        const escrowAddress = await escrow.getAddress();

        // Set Timelock in Escrow
        await escrow.setTimelock(timelockAddress);

        return { escrow, timelock, owner, governor, attacker, escrowAddress, timelockAddress };
    }

    beforeEach(async function () {
        Object.assign(this, await loadFixture(deployFixture));
    });

    it("Should prevent direct upgrades by owner when timelock is set", async function () {
        const FreelanceEscrowV2 = await ethers.getContractFactory("FreelanceEscrow");
        
        // Even the owner (who has DEFAULT_ADMIN_ROLE) should be blocked if they are not the timelock
        await expect(
            upgrades.upgradeProxy(this.escrowAddress, FreelanceEscrowV2)
        ).to.be.revertedWithCustomError(this.escrow, "NotAuthorized");
    });

    it("Should allow upgrades via timelock", async function () {
        const FreelanceEscrowV2 = await ethers.getContractFactory("FreelanceEscrow");
        const v2Impl = await FreelanceEscrowV2.deploy();
        await v2Impl.waitForDeployment();
        const v2ImplAddress = await v2Impl.getAddress();

        // 1. Prepare the upgrade call (upgradeToAndCall)
        // Note: upgrades.upgradeProxy normally handles this, but we need to do it via Timelock
        const upgradeData = this.escrow.interface.encodeFunctionData("upgradeToAndCall", [v2ImplAddress, "0x"]);

        // 2. Schedule the upgrade in Timelock
        const salt = ethers.encodeBytes32String("upgrade1");
        const delay = 2 * 24 * 60 * 60; // 2 days
        
        await this.timelock.connect(this.governor).schedule(
            this.escrowAddress,
            0,
            upgradeData,
            ethers.ZeroHash,
            salt,
            delay
        );

        // 3. Wait for delay
        await time.increase(delay + 1);

        // 4. Execute the upgrade
        // First, grant the Timelock the DEFAULT_ADMIN_ROLE in the Escrow so it can pass the onlyRole check
        const DEFAULT_ADMIN_ROLE = await this.escrow.DEFAULT_ADMIN_ROLE();
        await this.escrow.grantRole(DEFAULT_ADMIN_ROLE, this.timelockAddress);

        await expect(
            this.timelock.execute(
                this.escrowAddress,
                0,
                upgradeData,
                ethers.ZeroHash,
                salt
            )
        ).to.not.be.reverted;
    });
});
