const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PolyToken", function () {
    let PolyToken;
    let polyToken;
    let owner;
    let addr1;
    let addr2;

    beforeEach(async function () {
        PolyToken = await ethers.getContractFactory("PolyToken");
        [owner, addr1, addr2] = await ethers.getSigners();
        polyToken = await PolyToken.deploy(owner.address);
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await polyToken.owner()).to.equal(owner.address);
        });

        it("Should assign the total supply of tokens to the owner", async function () {
            const ownerBalance = await polyToken.balanceOf(owner.address);
            expect(await polyToken.totalSupply()).to.equal(ownerBalance);
        });

        it("Should have a total supply of 1 billion", async function () {
            const decimals = await polyToken.decimals();
            const expectedSupply = ethers.parseUnits("1000000000", decimals);
            expect(await polyToken.totalSupply()).to.equal(expectedSupply);
        });
    });

    describe("Transactions", function () {
        it("Should transfer tokens between accounts", async function () {
            const decimals = await polyToken.decimals();
            const amount = ethers.parseUnits("100", decimals);
            // Transfer 100 tokens from owner to addr1
            await polyToken.transfer(addr1.address, amount);
            expect(await polyToken.balanceOf(addr1.address)).to.equal(amount);

            // Transfer 50 tokens from addr1 to addr2
            const amount2 = ethers.parseUnits("50", decimals);
            await polyToken.connect(addr1).transfer(addr2.address, amount2);
            expect(await polyToken.balanceOf(addr2.address)).to.equal(amount2);
        });

        it("Should fail if sender doesn't have enough tokens", async function () {
            const initialOwnerBalance = await polyToken.balanceOf(owner.address);
            // Try to send 1 token from addr1 (0 tokens) to owner
            await expect(
                polyToken.connect(addr1).transfer(owner.address, 1)
            ).to.be.revertedWithCustomError(polyToken, "ERC20InsufficientBalance");

            expect(await polyToken.balanceOf(owner.address)).to.equal(initialOwnerBalance);
        });
    });
});
