const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("Ethers Check", function () {
    it("Should have getSigners", async function () {
        console.log("Ethers type:", typeof ethers);
        console.log("Ethers keys:", Object.keys(ethers));
        console.log("Is getSigners defined?", typeof ethers.getSigners);
        expect(ethers.getSigners).to.not.be.undefined;
    });
});
