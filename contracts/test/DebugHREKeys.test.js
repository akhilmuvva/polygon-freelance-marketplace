const { expect } = require("chai");
const hre = require("hardhat");

describe("Debug HRE keys", function () {
    it("Should log hre keys", async function () {
        console.log("HRE keys:", Object.keys(hre));
        if (hre.ethers) {
            console.log("HRE.ethers keys:", Object.keys(hre.ethers));
        }
    });
});
