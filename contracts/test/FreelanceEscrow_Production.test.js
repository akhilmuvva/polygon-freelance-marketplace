const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("FreelanceEscrow Production Features", function () {
    let Escrow, escrow, Token, token;
    let owner, client, freelancer1, freelancer2, vault;
    const amount = ethers.parseEther("10");
    const stake = ethers.parseEther("0.5"); // 5% of 10 is 0.5

    beforeEach(async function () {
        [owner, client, freelancer1, freelancer2, vault] = await ethers.getSigners();

        // Deploy Mock Token
        Token = await ethers.getContractFactory("PolyToken");
        token = await Token.deploy(owner.address);
        await token.waitForDeployment();

        // Deploy Forwarder
        const Forwarder = await ethers.getContractFactory("PolyLanceForwarder");
        const forwarder = await Forwarder.deploy();
        await forwarder.waitForDeployment();

        // Deploy SBT
        const SBT = await ethers.getContractFactory("FreelanceSBT");
        const sbt = await SBT.deploy(owner.address, owner.address);
        await sbt.waitForDeployment();

        // Deploy Escrow
        Escrow = await ethers.getContractFactory("FreelanceEscrow");
        escrow = await upgrades.deployProxy(Escrow, [
            owner.address,
            await forwarder.getAddress(),
            await sbt.getAddress(),
            owner.address // dummy entrypoint
        ], { kind: 'uups' });
        await escrow.waitForDeployment();

        await escrow.setVault(vault.address);
        // Whitelist the token
        await escrow.setTokenWhitelist(await token.getAddress(), true);

        await token.transfer(client.address, amount);
        await token.transfer(freelancer1.address, stake);
        await token.transfer(freelancer2.address, stake);
    });

    it("Should handle pull-based refunds for unselected freelancers", async function () {
        // 1. Create Job with no freelancer
        await token.connect(client).approve(await escrow.getAddress(), amount);
        const params = {
            categoryId: 0,
            freelancer: ethers.ZeroAddress,
            token: await token.getAddress(),
            amount: amount,
            ipfsHash: "ipfs://description",
            deadline: 0,
            mAmounts: [],
            mHashes: []
        };
        await escrow.connect(client).createJob(params);
        const jobId = await escrow.jobCount();

        // 2. Freelancers apply
        await token.connect(freelancer1).approve(await escrow.getAddress(), stake);
        await escrow.connect(freelancer1).applyForJob(jobId);

        await token.connect(freelancer2).approve(await escrow.getAddress(), stake);
        await escrow.connect(freelancer2).applyForJob(jobId);

        // 3. Client picks freelancer1
        await escrow.connect(client).pickFreelancer(jobId, freelancer1.address);

        // 4. Verify freelancer2 has a pending refund and freelancer1 does not
        expect(await escrow.pendingRefunds(freelancer2.address, await token.getAddress())).to.equal(stake);
        expect(await escrow.pendingRefunds(freelancer1.address, await token.getAddress())).to.equal(0);

        // 5. Freelancer2 claims refund
        const initialBalance = await token.balanceOf(freelancer2.address);
        await escrow.connect(freelancer2).claimRefund(await token.getAddress());
        const finalBalance = await token.balanceOf(freelancer2.address);

        expect(finalBalance - initialBalance).to.equal(stake);
        expect(await escrow.pendingRefunds(freelancer2.address, await token.getAddress())).to.equal(0);
    });

    it("Should verify setVault and role-based access", async function () {
        const newVault = ethers.Wallet.createRandom().address;
        await escrow.connect(owner).setVault(newVault);
        expect(await escrow.vault()).to.equal(newVault);

        await expect(
            escrow.connect(client).setVault(client.address)
        ).to.be.revertedWithCustomError(escrow, "OwnableUnauthorizedAccount");
    });
});
