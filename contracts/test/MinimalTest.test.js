const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("MinimalTest", function () {
    it("Should grant role", async function () {
        const [admin] = await ethers.getSigners();
        const forwarder = "0x000000000000000000000000000000000000dEaD";
        const Escrow = await ethers.getContractFactory("FreelanceEscrow");
        const escrow = await upgrades.deployProxy(Escrow, [
            admin.address,
            forwarder,
            admin.address,
            admin.address
        ], { kind: 'uups' });

        const DEFAULT_ADMIN_ROLE = await escrow.DEFAULT_ADMIN_ROLE();
        console.log("Admin address:", admin.address);
        console.log("Admin has DEFAULT_ADMIN_ROLE:", await escrow.hasRole(DEFAULT_ADMIN_ROLE, admin.address));
        
        const TEST_ROLE = ethers.keccak256(ethers.toUtf8Bytes("TEST_ROLE"));
        await escrow.connect(admin).grantRole(TEST_ROLE, "0x1234567890123456789012345678901234567890");
        expect(await escrow.hasRole(TEST_ROLE, "0x1234567890123456789012345678901234567890")).to.be.true;
    });
});
