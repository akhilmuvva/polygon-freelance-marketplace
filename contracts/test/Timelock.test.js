const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("PolyLanceTimelock Integration", function () {
    let timelock, owner, governance, attacker;
    const TWO_DAYS = 2 * 24 * 60 * 60; // 172800 seconds

    beforeEach(async function () {
        [owner, governance, attacker] = await ethers.getSigners();

        const Timelock = await ethers.getContractFactory("PolyLanceTimelock");
        timelock = await Timelock.deploy(
            [governance.address],
            [ethers.ZeroAddress],
            owner.address
        );
        await timelock.waitForDeployment();
    });

    it("enforces 48-hour minimum delay", async function () {
        const delay = await timelock.getMinDelay();
        expect(Number(delay)).to.equal(TWO_DAYS);
    });

    it("grants PROPOSER_ROLE to governance address", async function () {
        const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
        expect(await timelock.hasRole(PROPOSER_ROLE, governance.address)).to.be.true;
    });

    it("denies PROPOSER_ROLE to attacker", async function () {
        const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
        expect(await timelock.hasRole(PROPOSER_ROLE, attacker.address)).to.be.false;
    });

    it("blocks execution before delay expires", async function () {
        const timelockAddress = await timelock.getAddress();
        const salt = ethers.encodeBytes32String("test1");
        await timelock.connect(governance).schedule(
            timelockAddress, 0, "0x",
            ethers.ZeroHash, salt, TWO_DAYS
        );
        await expect(
            timelock.execute(timelockAddress, 0, "0x", ethers.ZeroHash, salt)
        ).to.be.reverted;
    });

    it("allows execution after delay expires", async function () {
        const timelockAddress = await timelock.getAddress();
        const salt = ethers.encodeBytes32String("test2");
        await timelock.connect(governance).schedule(
            timelockAddress, 0, "0x",
            ethers.ZeroHash, salt, TWO_DAYS
        );
        await time.increase(TWO_DAYS + 1);
        await expect(
            timelock.execute(timelockAddress, 0, "0x", ethers.ZeroHash, salt)
        ).to.not.be.reverted;
    });
});
