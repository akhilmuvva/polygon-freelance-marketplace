// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./FreelanceRenderer.sol";
import "./FreelanceEscrowBase.sol";
import "./interfaces/IFreelanceSBT.sol";

/**
 * @title FreelanceEscrow
 * @author Akhil Muvva
 * @notice Refactored for Antigravity's EVM.
 * Implements: 1. Milestone Factory, 2. Decentralized Dispute Resolution, 3. Soulbound Identity (SBT).
 * This contract handles the locking and release of funds for freelance work on the Polygon network.
 */
contract FreelanceEscrow is FreelanceEscrowBase, PausableUpgradeable, IArbitrable, OwnableUpgradeable {
    using SafeERC20 for IERC20;

    address public polyToken;
    address public reputationContract;
    address public completionCertContract;
    bool public emergencyMode; 

    error EmergencyActive();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address admin, address forwarder, address _sbt, address _entry) public initializer {
        if (admin == address(0) || forwarder == address(0) || _sbt == address(0) || _entry == address(0)) revert InvalidAddress();
        __ERC721_init("FreelanceWork", "FWORK");
        __AccessControl_init();
        __ReentrancyGuard_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        __Ownable_init(admin);

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MANAGER_ROLE, admin);
        _grantRole(ARBITRATOR_ROLE, admin);
        
        _trustedForwarder = forwarder;
        arbitrator = admin;
        sbtContract = _sbt;
        entryPoint = _entry;
        platformFeeBps = 250; // 2.5% default
    }

    function setSBTContract(address _sbt) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_sbt == address(0)) revert InvalidAddress();
        sbtContract = _sbt;
    }

    function setEntryPoint(address _entry) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_entry == address(0)) revert InvalidAddress();
        entryPoint = _entry;
    }

    function setVault(address _vault) external onlyOwner {
        if (_vault == address(0)) revert InvalidAddress();
        vault = _vault;
    }

    function setPlatformFee(uint256 _bps) external onlyOwner {
        if (_bps > 1000) revert InvalidStatus(); // Max 10%
        platformFeeBps = _bps;
    }

    function setPolyToken(address _token) external onlyOwner {
        polyToken = _token;
    }

    function setReputationContract(address _rep) external onlyOwner {
        reputationContract = _rep;
    }

    function setCompletionCertContract(address _cert) external onlyOwner {
        completionCertContract = _cert;
    }

    uint256 public reputationThreshold; 
    mapping(address => bool) public isSupreme;

    function setReputationThreshold(uint256 _t) external onlyRole(DEFAULT_ADMIN_ROLE) {
        reputationThreshold = _t;
    }

    mapping(address => bool) public tokenWhitelist;
    function setTokenWhitelist(address _token, bool _status) external onlyRole(MANAGER_ROLE) {
        tokenWhitelist[_token] = _status;
    }

    function applyForJob(uint256 jobId) external payable whenNotPaused nonReentrant {
        Job storage job = jobs[jobId];
        if (job.status != JobStatus.Created) revert InvalidStatus();
        if (hasApplied[jobId][_msgSender()]) revert InvalidStatus();

        uint256 stake = (job.amount * 5) / 100;

        if (job.token != address(0)) {
            IERC20(job.token).safeTransferFrom(_msgSender(), address(this), stake);
        } else {
            require(msg.value >= stake, "Low stake");
        }

        jobApplications[jobId].push(Application(_msgSender(), stake));
        hasApplied[jobId][_msgSender()] = true;
    }

    function pickFreelancer(uint256 jobId, address freelancer) external whenNotPaused {
        Job storage job = jobs[jobId];
        if (_msgSender() != job.client) revert NotAuthorized();
        if (job.status != JobStatus.Created) revert InvalidStatus();

        job.freelancer = freelancer;
        job.status = JobStatus.Accepted;

        // Refund others
        Application[] storage apps = jobApplications[jobId];
        for (uint256 i = 0; i < apps.length; i++) {
            if (apps[i].freelancer != freelancer) {
                pendingRefunds[apps[i].freelancer][job.token] += apps[i].stake;
            } else {
                job.freelancerStake = apps[i].stake;
            }
        }
    }

    function acceptJob(uint256 jobId) external payable whenNotPaused nonReentrant {
        Job storage job = jobs[jobId];
        if (_msgSender() != job.freelancer) revert NotAuthorized();
        if (job.status != JobStatus.Accepted) revert InvalidStatus();

        if (msg.value > 0) {
            job.freelancerStake += msg.value;
        }

        job.status = JobStatus.Ongoing;
    }

    function submitWork(uint256 jobId, string memory ipfsHash) external whenNotPaused {
        Job storage job = jobs[jobId];
        if (_msgSender() != job.freelancer) revert NotAuthorized();
        if (job.status != JobStatus.Ongoing) revert InvalidStatus();

        job.ipfsHash = ipfsHash;
        // Optionally update status to 'Submitted' if we had such a state, 
        // but traditionally we just wait for client to release funds.
    }

    function claimRefund(address token) external nonReentrant {
        uint256 amt = pendingRefunds[_msgSender()][token];
        if (amt == 0) revert InvalidStatus();
        pendingRefunds[_msgSender()][token] = 0;
        _sendFunds(_msgSender(), token, amt);
    }
    function setArbitrator(address _arb) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_arb == address(0)) revert InvalidAddress();
        arbitrator = _arb;
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function toggleEmergencyMode(bool _active) external onlyRole(DEFAULT_ADMIN_ROLE) {
        emergencyMode = _active;
        if (_active) _pause();
        else _unpause();
    }

    struct CreateParams {
        uint256 categoryId;
        address freelancer;
        address token;
        uint256 amount;
        string ipfsHash;
        uint256 deadline;
        uint256[] mAmounts;
        string[] mHashes;
    }

    /**
     * @notice Milestone Factory: Locks funds and defines stages upfront.
     */
    function createJob(CreateParams memory p) public payable whenNotPaused nonReentrant returns (uint256) {
        if (p.token != address(0)) {
            IERC20(p.token).safeTransferFrom(_msgSender(), address(this), p.amount);
        } else {
            require(msg.value >= p.amount, "Low value");
        }

        uint256 jobId = ++jobCount;
        Job storage job = jobs[jobId];
        job.client = _msgSender();
        job.freelancer = p.freelancer;
        job.token = p.token;
        job.amount = p.amount;
        job.status = p.freelancer == address(0) ? JobStatus.Created : JobStatus.Accepted;
        job.ipfsHash = p.ipfsHash;
        job.categoryId = uint16(p.categoryId);
        job.milestoneCount = uint16(p.mAmounts.length);

        uint256 mSum = 0;
        for (uint256 i = 0; i < p.mAmounts.length; i++) {
            mSum += p.mAmounts[i];
            jobMilestones[jobId][i] = Milestone(p.mAmounts[i], p.mHashes[i], false);
        }
        if (p.mAmounts.length > 0 && mSum != p.amount) revert InvalidStatus();

        job.deadline = uint48(p.deadline == 0 ? block.timestamp + 7 days : p.deadline);

        emit JobCreated(jobId, job.client, p.freelancer, p.amount, job.deadline);
        return jobId;
    }


    /**
     * @notice Stage-based release of funds.
     */
    function releaseMilestone(uint256 jobId, uint256 mId) external whenNotPaused nonReentrant {
        Job storage job = jobs[jobId];
        if (_msgSender() != job.client) revert NotAuthorized();
        
        uint256 mask = 1 << mId;
        if ((milestoneBitmask[jobId] & mask) != 0) revert InvalidMilestone();
        milestoneBitmask[jobId] |= mask;
        jobMilestones[jobId][mId].isReleased = true;

        uint256 amt = jobMilestones[jobId][mId].amount;
        job.totalPaidOut += amt;
        
        _sendFunds(job.freelancer, job.token, amt);
        emit MilestoneReleased(jobId, job.freelancer, mId, amt);
    }

    /**
     * @notice Completion and SBT Minting.
     */
    function completeJob(uint256 jobId, uint8 rating) public whenNotPaused nonReentrant {
        Job storage job = jobs[jobId];
        if (_msgSender() != job.client) revert NotAuthorized();
        if (job.status != JobStatus.Ongoing) revert InvalidStatus();
        if (job.paid) revert AlreadyPaid();

        uint256 payout = job.amount - job.totalPaidOut;
        uint256 fee = (job.amount * platformFeeBps) / 10000;
        
        // Fee cannot exceed the remaining payout (prevents underflow)
        if (fee > payout) fee = payout;

        // Supreme Level Check: 0% Fee for Elite Veterans
        if (reputationContract != address(0)) {
            (bool success, bytes memory data) = reputationContract.call(abi.encodeWithSignature("balanceOf(address,uint256)", job.freelancer, job.categoryId));
            if (success && data.length >= 32) {
                if (abi.decode(data, (uint256)) >= 10) fee = 0;
            }
        }
        
        uint256 freelancerNet = payout - fee;

        // State updates
        job.paid = true;
        job.status = JobStatus.Completed;
        job.rating = rating;
        job.totalPaidOut += payout;

        // Mint SBTs
        _safeMint(job.freelancer, jobId);
        
        if (sbtContract != address(0)) {
            try IFreelanceSBT(sbtContract).mintContribution(job.freelancer, job.categoryId, rating, jobId, job.client) {}
            catch {
                // Fallback to safeMint for FreelanceSBT if mintContribution fails/missing
                (bool s, ) = sbtContract.call(abi.encodeWithSignature("safeMint(address,string)", job.freelancer, job.ipfsHash));
                (s);
            }
        }

        if (completionCertContract != address(0)) {
            IFreelanceSBT(completionCertContract).mintContribution(job.freelancer, job.categoryId, rating, jobId, job.client);
        }

        if (reputationContract != address(0)) {
            (bool success, ) = reputationContract.call(abi.encodeWithSignature("levelUp(address,uint256,uint256)", job.freelancer, job.categoryId, 1));
            (success);
        }

        if (polyToken != address(0)) {
            uint256 reward = 100 * 1e18;
            // Supreme Level Check: 3x Loyalty Boost
            if (reputationContract != address(0)) {
                (bool s, bytes memory data) = reputationContract.call(abi.encodeWithSignature("balanceOf(address,uint256)", job.freelancer, job.categoryId));
                if (s && data.length >= 32) {
                    uint256 bal = abi.decode(data, (uint256));
                    if (bal >= 10) reward = 300 * 1e18; // 3x Boost for Vets
                }
            }
            (bool success, ) = polyToken.call(abi.encodeWithSignature("mint(address,uint256)", job.freelancer, reward));
            (success);
        }

        // Payout freelancer (net) + stake return
        _sendFunds(job.freelancer, job.token, freelancerNet + job.freelancerStake);
        
        // Payout vault (fee)
        if (fee > 0 && vault != address(0)) {
            _sendFunds(vault, job.token, fee);
        }

        emit FundsReleased(jobId, job.freelancer, payout, jobId);
    }

    // Traditional releaseFunds call
    function releaseFunds(uint256 jobId) external {
        completeJob(jobId, 5);
    }

    function refundExpiredJob(uint256 jobId) external whenNotPaused nonReentrant {
        Job storage job = jobs[jobId];
        if (_msgSender() != job.client) revert NotAuthorized();
        if (job.status != JobStatus.Created && job.status != JobStatus.Accepted) revert InvalidStatus();
        
        // In Emergency Mode, bypass deadline check
        if (!emergencyMode) {
             if (block.timestamp < job.deadline && job.deadline != 0) revert InvalidStatus();
        }

        job.status = JobStatus.Cancelled;
        job.paid = true;
        
        _sendFunds(job.client, job.token, job.amount);
    }

    /**
     * @notice Decentralized Dispute Integration.
     */
    function raiseDispute(uint256 jobId) public payable whenNotPaused nonReentrant {
        Job storage job = jobs[jobId];
        if (_msgSender() != job.client && _msgSender() != job.freelancer) revert NotAuthorized();
        job.status = JobStatus.Disputed;

        if (arbitrator != address(0)) {
            uint256 cost = IArbitrator(arbitrator).arbitrationCost("");
            uint256 dId = IArbitrator(arbitrator).createDispute{value: cost}(2, "");
            disputeIdToJobId[dId] = jobId;
        }
    }

    function dispute(uint256 jobId) external payable {
        raiseDispute(jobId);
    }

    function rule(uint256 dId, uint256 ruling) external override nonReentrant {
        if (_msgSender() != arbitrator) revert NotAuthorized();
        uint256 jobId = disputeIdToJobId[dId];
        Job storage job = jobs[jobId];

        uint256 payout = job.amount - job.totalPaidOut;
        
        // Effects: Update state BEFORE external calls
        job.totalPaidOut += payout;
        
        if (ruling == 1) { // Client
            job.status = JobStatus.Cancelled;
            // Return remaining budget + freelancer stake (as penalty/refund) to client? 
            // Usually, client gets budget, freelancer gets stake back unless malicious.
            // Let's stick to returning stake to the original owner (freelancer) but budget to client.
            _sendFunds(job.client, job.token, payout);
            _sendFunds(job.freelancer, job.token, job.freelancerStake);
        } else { // Freelancer
            job.status = JobStatus.Completed;
            _safeMint(job.freelancer, jobId);
            _sendFunds(job.freelancer, job.token, payout + job.freelancerStake);
        }
        emit Ruling(IArbitrator(arbitrator), dId, ruling);
    }

    function resolveDisputeManual(uint256 jobId, uint256 freelancerBps) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        Job storage job = jobs[jobId];
        if (job.status != JobStatus.Disputed) revert InvalidStatus();
        
        uint256 remaining = job.amount - job.totalPaidOut;
        uint256 freelancerAmt = (remaining * freelancerBps) / 10000;
        uint256 clientAmt = remaining - freelancerAmt;

        job.totalPaidOut += remaining;
        job.status = (freelancerBps > 5000) ? JobStatus.Completed : JobStatus.Cancelled;

        if (freelancerAmt > 0) _sendFunds(job.freelancer, job.token, freelancerAmt + job.freelancerStake);
        else _sendFunds(job.freelancer, job.token, job.freelancerStake); // Always return stake in manual resolve unless specified otherwise

        if (clientAmt > 0) _sendFunds(job.client, job.token, clientAmt);
    }

    function _sendFunds(address to, address token, uint256 amt) internal {
        if (token == address(0)) {
            (bool s, ) = payable(to).call{value: amt}("");
            require(s, "failed");
        } else {
            IERC20(token).safeTransfer(to, amt);
        }
    }

    function tokenURI(uint256 jobId) public view override returns (string memory) {
        Job storage job = jobs[jobId];
        return FreelanceRenderer.constructTokenURI(FreelanceRenderer.RenderParams({
            jobId: jobId,
            categoryId: job.categoryId,
            amount: job.amount,
            rating: job.rating,
            ipfsHash: job.ipfsHash
        }));
    }

    function supportsInterface(bytes4 id) public view override returns (bool) {
        return super.supportsInterface(id);
    }

    function _msgSender() internal view virtual override returns (address sender) {
        if (msg.sender == _trustedForwarder && msg.data.length >= 20) {
            return address(bytes20(msg.data[msg.data.length - 20:]));
        }
        return super._msgSender();
    }

    function _authorizeUpgrade(address) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
}
