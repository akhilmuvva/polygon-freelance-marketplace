const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Barebones CJS", function () {
    it("Should have ethers working", async function () {
        const [owner] = await ethers.getSigners();
        console.log("Owner address:", owner.address);
        expect(owner.address).to.be.properAddress;
    });
});
