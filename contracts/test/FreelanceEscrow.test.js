const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("FreelanceEscrow", function () {
    let FreelanceEscrow;
    let escrow;
    let mockERC20;
    let owner, client, freelancer, other;

    beforeEach(async function () {
        [owner, client, freelancer, other] = await ethers.getSigners();

        // Deploy Mock ERC20
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        mockERC20 = await MockERC20.deploy("Mock USDC", "mUSDC");
        await mockERC20.waitForDeployment();

        // Deploy UUPS Proxy
        FreelanceEscrow = await ethers.getContractFactory("FreelanceEscrow");
        escrow = await upgrades.deployProxy(FreelanceEscrow, [
            owner.address,
            ethers.ZeroAddress, // trustedForwarder
            ethers.ZeroAddress, // ccipRouter
            ethers.ZeroAddress, // insurancePool
            ethers.ZeroAddress  // lzEndpoint
        ], {
            initializer: "initialize",
            kind: "uups",
        });
        await escrow.waitForDeployment();
    });

    describe("Upgradability", function () {
        it("Should be upgradeable", async function () {
            const FreelanceEscrowV2 = await ethers.getContractFactory("FreelanceEscrow");
            const upgraded = await upgrades.upgradeProxy(await escrow.getAddress(), FreelanceEscrowV2);
            expect(await upgraded.getAddress()).to.equal(await escrow.getAddress());
        });
    });

    describe("Native MATIC Job Lifecycle", function () {
        it("Should create and accept native job", async function () {
            const amount = ethers.parseEther("1");
            await escrow.connect(client).createJob(freelancer.address, ethers.ZeroAddress, amount, "ipfs://test", { value: amount });

            const stake = ethers.parseEther("0.1");
            await escrow.connect(freelancer).acceptJob(1, { value: stake });

            const job = await escrow.jobs(1);
            expect(job.status).to.equal(1); // Accepted
        });

        it("Should release funds and mint NFT", async function () {
            const amount = ethers.parseEther("1");
            await escrow.connect(client).createJob(freelancer.address, ethers.ZeroAddress, amount, "ipfs://test", { value: amount });
            await escrow.connect(freelancer).acceptJob(1, { value: ethers.parseEther("0.1") });
            await escrow.connect(freelancer).submitWork(1, "ipfs://result");

            await expect(escrow.connect(client).releaseFunds(1))
                .to.emit(escrow, "FundsReleased");

            expect(await escrow.balanceOf(freelancer.address)).to.equal(1);
        });
    });

    describe("ERC20 Job Lifecycle", function () {
        it("Should create and accept ERC20 job", async function () {
            const amount = ethers.parseUnits("100", 6);
            await mockERC20.mint(client.address, amount);
            await mockERC20.connect(client).approve(await escrow.getAddress(), amount);

            await escrow.connect(client).createJob(freelancer.address, await mockERC20.getAddress(), amount, "ipfs://test");

            const stake = amount / 10n;
            await mockERC20.mint(freelancer.address, stake);
            await mockERC20.connect(freelancer).approve(await escrow.getAddress(), stake);

            await escrow.connect(freelancer).acceptJob(1);

            const job = await escrow.jobs(1);
            expect(job.status).to.equal(1); // Accepted
            expect(job.freelancerStake).to.equal(stake);
        });
    });

    describe("Dispute Resolution", function () {
        it("Should allow arbitrator to resolve dispute (ERC20)", async function () {
            const amount = ethers.parseUnits("100", 6);
            await mockERC20.mint(client.address, amount);
            await mockERC20.connect(client).approve(await escrow.getAddress(), amount);
            await escrow.connect(client).createJob(freelancer.address, await mockERC20.getAddress(), amount, "ipfs://test");

            const stake = amount / 10n;
            await mockERC20.mint(freelancer.address, stake);
            await mockERC20.connect(freelancer).approve(await escrow.getAddress(), stake);
            await escrow.connect(freelancer).acceptJob(1);

            await escrow.connect(client).dispute(1, { value: ethers.parseEther("0.1") }); // Assuming cost

            // In our enhanced contract, we have ARBITRATOR_ROLE
            const arbitratorRole = await escrow.ARBITRATOR_ROLE();
            await escrow.grantRole(arbitratorRole, owner.address);

            await expect(escrow.connect(owner).rule(0, 2)) // Ruling 2 -> Pay Freelancer
                .to.emit(escrow, "FundsReleased");
        });
    });

    describe("Access Control", function () {
        it("Should restrict setPolyToken to admin", async function () {
            await expect(escrow.connect(other).setPolyToken(other.address))
                .to.be.revertedWithCustomError(escrow, "AccessControlUnauthorizedAccount");
        });

        it("Should allow admin to grant MANAGER_ROLE", async function () {
            const managerRole = await escrow.MANAGER_ROLE();
            await escrow.grantRole(managerRole, other.address);
            expect(await escrow.hasRole(managerRole, other.address)).to.be.true;
        });
    });
});

