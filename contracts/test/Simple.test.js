const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Simple Test", function () {
    it("Should get signers", async function () {
        const signers = await ethers.getSigners();
        console.log("Got signers:", signers.length);
        expect(signers.length).to.be.gt(0);
    });
});
