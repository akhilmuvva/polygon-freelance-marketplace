console.log("Starting test file...");
const { expect } = require("chai");
console.log("Importing hardhat...");
const { ethers } = require("hardhat");
console.log("Hardhat imported.");

describe("Barebones", function () {
    it("Should have ethers working", async function () {
        console.log("Ethers version in test:", ethers.version);
        const [owner] = await ethers.getSigners();
        expect(owner.address).to.be.properAddress;
    });
});
