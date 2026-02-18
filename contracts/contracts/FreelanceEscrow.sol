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
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "./FreelanceRenderer.sol";
import "./FreelanceEscrowBase.sol";
import "./interfaces/IFreelanceSBT.sol";
import "./PrivacyShield.sol";

/**
 * @title FreelanceEscrow
 * @author Akhil Muvva
 * @notice Refactored for Antigravity's EVM with Zenith protocol enhancements.
 * @dev Implements a milestone-based escrow system with yield strategies, decentralized dispute resolution, 
 * and Soulbound Identity (SBT) for freelancers. Inherits from FreelanceEscrowBase and integrates 
 * with Arbitrable for Kleros-compatible dispute handling.
 */
contract FreelanceEscrow is FreelanceEscrowBase, PausableUpgradeable, IArbitrable {
    using SafeERC20 for IERC20;

    event JobApplied(uint256 indexed jobId, address indexed freelancer, uint256 stake);
    event FreelancerPicked(uint256 indexed jobId, address indexed freelancer);
    event JobAccepted(uint256 indexed jobId, address indexed freelancer);

    /// @notice Address of the PolyToken (REWARD token)
    address public polyToken;
    /// @notice Address of the reputation contract
    address public reputationContract;
    /// @notice Address of the completion certificate contract
    address public completionCertContract;
    /// @notice Address of the review SBT contract
    address public reviewSBT;
    /// @notice Address of the privacy shield contract
    address public privacyShield;
    /// @notice Flag for emergency mode (pauses most functions)
    bool public emergencyMode; 

    uint256 public constant REWARD_BASE = 100 * 1e18;
    uint256 public constant SUPREME_REWARD_BOOST = 3;
    uint256 public constant BASIS_POINTS_DIVISOR = 10000;
    uint256 public constant MAX_PLATFORM_FEE_BPS = 1000; // 10%

    error EmergencyActive();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the FreelanceEscrow contract with basic configuration and roles.
     * @dev Should be called immediately after proxy deployment. Sets up initial roles and parameters.
     * @param admin The address to be granted DEFAULT_ADMIN_ROLE, MANAGER_ROLE, and ARBITRATOR_ROLE.
     * @param forwarder The address of the trusted forwarder for meta-transactions.
     * @param _sbt The address of the Soulbound Token contract for freelancer identity.
     * @param _entry The address of the ERC-4337 EntryPoint contract.
     */
    function initialize(address admin, address forwarder, address _sbt, address _entry) public initializer {
        if (admin == address(0) || forwarder == address(0) || _sbt == address(0) || _entry == address(0)) revert InvalidAddress();
        __ERC721_init("PolyLance Zenith Project", "ZENITH");
        __AccessControl_init();
        __ReentrancyGuard_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MANAGER_ROLE, admin);
        _grantRole(ARBITRATOR_ROLE, admin);
        
        _trustedForwarder = forwarder;
        arbitrator = admin;
        sbtContract = _sbt;
        entryPoint = _entry;
        platformFeeBps = 250; // 2.5% default
        reputationThreshold = 10; // Default threshold for Elite Veterans
    }

    /**
     * @notice Updates the Soulbound Token (SBT) contract address.
     * @param _sbt New SBT contract address.
     */
    function setSBTContract(address _sbt) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_sbt == address(0)) revert InvalidAddress();
        sbtContract = _sbt;
    }

    /**
     * @notice Updates the Account Abstraction (ERC-4337) EntryPoint address.
     * @param _entry New EntryPoint address.
     */
    function setEntryPoint(address _entry) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_entry == address(0)) revert InvalidAddress();
        entryPoint = _entry;
    }

    /**
     * @notice Updates the vault address where platform fees are collected.
     * @param _vault New vault address.
     */
    function setVault(address _vault) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_vault == address(0)) revert InvalidAddress();
        vault = _vault;
    }

    /**
     * @notice Sets the platform fee in basis points (10000 = 100%).
     * @dev Limited to a maximum of 10% (MAX_PLATFORM_FEE_BPS).
     * @param _bps Fee in basis points.
     */
    function setPlatformFee(uint256 _bps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_bps > MAX_PLATFORM_FEE_BPS) revert InvalidStatus(); 
        platformFeeBps = _bps;
    }

    /**
     * @notice Updates the PolyToken reward contract address.
     * @param _token New token address.
     */
    function setPolyToken(address _token) external onlyRole(DEFAULT_ADMIN_ROLE) {
        polyToken = _token;
    }

    /**
     * @notice Updates the Reputation contract address.
     * @param _rep New reputation address.
     */
    function setReputationContract(address _rep) external onlyRole(DEFAULT_ADMIN_ROLE) {
        reputationContract = _rep;
    }

    /**
     * @notice Updates the Completion Certificate contract address.
     * @param _cert New certificate address.
     */
    function setCompletionCertContract(address _cert) external onlyRole(DEFAULT_ADMIN_ROLE) {
        completionCertContract = _cert;
    }

    /**
     * @notice Updates the Review SBT contract address.
     * @param _rsbt New Review SBT address.
     */
    function setReviewSBT(address _rsbt) external onlyRole(DEFAULT_ADMIN_ROLE) {
        reviewSBT = _rsbt;
    }

    /**
     * @notice Updates the Privacy Shield contract address.
     * @param _ps New Privacy Shield address.
     */
    function setPrivacyShield(address _ps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        privacyShield = _ps;
    }

    /**
     * @notice Minimum reputation balance required to be considered a 'Supreme Member' (0% fees).
     */
    uint256 public reputationThreshold; 
    
    /**
     * @notice Mapping to manually mark users as 'Supreme Members'.
     */
    mapping(address => bool) public isSupreme;

    /**
     * @notice Updates the reputation threshold for fee waivers.
     * @param _t New threshold value.
     */
    function setReputationThreshold(uint256 _t) external onlyRole(DEFAULT_ADMIN_ROLE) {
        reputationThreshold = _t;
    }

    /**
     * @notice Mapping for whitelisted payment tokens.
     */
    mapping(address => bool) public tokenWhitelist;
    function setTokenWhitelist(address _token, bool _status) external onlyRole(MANAGER_ROLE) {
        tokenWhitelist[_token] = _status;
    }

    function setYieldManager(address _ym) external onlyRole(DEFAULT_ADMIN_ROLE) {
        yieldManager = _ym;
    }

    function setSwapManager(address _sm) external onlyRole(DEFAULT_ADMIN_ROLE) {
        swapManager = _sm;
    }

    uint256 public constant MAX_APPLICATIONS_PER_JOB = 50;

    /**
     * @notice Allows a freelancer to apply for a job by providing a stake.
     * @param jobId The unique ID of the job.
     */
    function applyForJob(uint256 jobId) external payable whenNotPaused nonReentrant {
        Job storage job = jobs[jobId];
        if (job.client == address(0)) revert InvalidAddress();
        if (job.status != JobStatus.Created) revert InvalidStatus();
        if (hasApplied[jobId][_msgSender()]) revert InvalidStatus();
        if (jobApplications[jobId].length >= MAX_APPLICATIONS_PER_JOB) revert NotAuthorized(); // Simplified error for "Capacity Reached"

        uint256 stake = (job.amount * APPLICATION_STAKE_PERCENT) / 100;

        if (job.token != address(0)) {
            IERC20(job.token).safeTransferFrom(_msgSender(), address(this), stake);
            // Optionally deposit freelancer stake into yield manager if strategy is set
            if (yieldManager != address(0) && job.yieldStrategy != IYieldManager.Strategy.NONE) {
                 IERC20(job.token).forceApprove(yieldManager, stake);
                 IYieldManager(yieldManager).deposit(job.yieldStrategy, job.token, stake);
            }
        } else {
            if (msg.value < stake) revert LowStake();
        }

        jobApplications[jobId].push(Application(_msgSender(), stake));
        hasApplied[jobId][_msgSender()] = true;
        
        emit JobApplied(jobId, _msgSender(), stake);
    }

    /**
     * @notice Returns all applications for a specific job.
     * @param jobId The unique ID of the job.
     * @return An array of Application structs.
     */
    function getJobApplications(uint256 jobId) external view returns (Application[] memory) {
        return jobApplications[jobId];
    }

    /**
     * @notice Allows a client to select a freelancer from the applications.
     * @param jobId The unique ID of the job.
     * @param freelancer The address of the selected freelancer.
     */
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
                if (yieldManager != address(0) && job.yieldStrategy != IYieldManager.Strategy.NONE) {
                    IYieldManager(yieldManager).withdraw(job.yieldStrategy, job.token, apps[i].stake, address(this));
                }
                balances[apps[i].freelancer][job.token] += apps[i].stake;
            } else {
                job.freelancerStake = apps[i].stake;
            }
        }

        emit FreelancerPicked(jobId, freelancer);
    }

    /**
     * @notice Allows the selected freelancer to accept the job.
     * @param jobId The unique ID of the job.
     */
    function acceptJob(uint256 jobId) external payable whenNotPaused nonReentrant {
        Job storage job = jobs[jobId];
        if (_msgSender() != job.freelancer) revert NotAuthorized();
        if (job.status != JobStatus.Accepted) revert InvalidStatus();

        if (msg.value > 0) {
            job.freelancerStake += msg.value;
        }

        job.status = JobStatus.Ongoing;
        emit JobAccepted(jobId, _msgSender());
    }

    /**
     * @notice Allows the freelancer to submit work (IPFS hash).
     * @param jobId The unique ID of the job.
     * @param ipfsHash The IPFS hash of the submitted work.
     */
    function submitWork(uint256 jobId, string memory ipfsHash) external whenNotPaused {
        Job storage job = jobs[jobId];
        if (_msgSender() != job.freelancer) revert NotAuthorized();
        if (job.status != JobStatus.Ongoing) revert InvalidStatus();

        job.ipfsHash = ipfsHash;
        // Optionally update status to 'Submitted' if we had such a state, 
        // but traditionally we just wait for client to release funds.
    }

    /**
     * @notice Withdraws available funds for the caller in the specified token.
     * @param token Address of the token (0 for native).
     */
    function withdraw(address token) external whenNotPaused nonReentrant {
        uint256 amt = balances[_msgSender()][token];
        if (amt == 0) revert InvalidStatus();
        balances[_msgSender()][token] = 0;
        _transferFunds(_msgSender(), token, amt);
    }

    /**
     * @notice Allows users to stake their earned balance into a yield strategy.
     */
    function stakeBalance(address token, uint256 amount, IYieldManager.Strategy strategy) external whenNotPaused nonReentrant {
        if (amount == 0 || balances[_msgSender()][token] < amount) revert LowValue();
        if (yieldManager == address(0) || strategy == IYieldManager.Strategy.NONE) revert InvalidStatus();

        balances[_msgSender()][token] -= amount;
        
        IERC20(token).forceApprove(yieldManager, amount);
        IYieldManager(yieldManager).deposit(strategy, token, amount);
        
        // Track the user's staked balance (simplified: we'd need a mapping for user stakes)
        // For now, let's assume the contract owns the yield and user gets fixed underlying back
        userStakes[_msgSender()][token][strategy] += amount;
        
        emit BalanceStaked(_msgSender(), token, amount, strategy);
    }

    /**
     * @notice Allows users to unstake their balance from a yield strategy.
     */
    function unstakeBalance(address token, uint256 amount, IYieldManager.Strategy strategy) external whenNotPaused nonReentrant {
        if (amount == 0 || userStakes[_msgSender()][token][strategy] < amount) revert LowValue();
        
        userStakes[_msgSender()][token][strategy] -= amount;
        IYieldManager(yieldManager).withdraw(strategy, token, amount, address(this));
        
        balances[_msgSender()][token] += amount;
        
        emit BalanceUnstaked(_msgSender(), token, amount, strategy);
    }

    mapping(address => mapping(address => mapping(IYieldManager.Strategy => uint256))) public userStakes;
    event BalanceStaked(address indexed user, address indexed token, uint256 amount, IYieldManager.Strategy strategy);
    event BalanceUnstaked(address indexed user, address indexed token, uint256 amount, IYieldManager.Strategy strategy);

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
        address token; // Target token for escrow
        uint256 amount; // Target amount in target token
        string ipfsHash;
        uint256 deadline;
        uint256[] mAmounts;
        string[] mHashes;
        bool[] mIsUpfront;
        IYieldManager.Strategy yieldStrategy;
        address paymentToken; // Token used for payment (can be different from target)
        uint256 paymentAmount; // Amount of paymentToken sent
        uint256 minAmountOut; // Slippage protection for swap
    }

    /**
     * @notice Milestone Factory: Locks funds and defines stages upfront.
     * @param p CreateParams struct containing job details and milestones.
     * @return The newly created jobId.
     */
    function createJob(CreateParams calldata p) public payable whenNotPaused nonReentrant returns (uint256) {
        if (p.amount == 0) revert LowValue();
        if (bytes(p.ipfsHash).length == 0) revert InvalidStatus();
        if (p.token != address(0) && !tokenWhitelist[p.token]) revert TokenNotWhitelisted();

        uint256 jobId = ++jobCount;
        
        uint256 actualAmount = _handleJobFunding(
            p.token, 
            p.amount, 
            p.yieldStrategy, 
            p.paymentToken, 
            p.paymentAmount, 
            p.minAmountOut
        );

        // Validation: Sum of milestones must equal total amount
        uint256 mSum = 0;
        for(uint256 i=0; i<p.mAmounts.length; i++) {
            mSum += p.mAmounts[i];
        }
        if (mSum != p.amount) revert InvalidStatus(); // Insolvency protection
        
        _initJobRecord(jobId, p.freelancer, p.token, actualAmount, p.ipfsHash, p.categoryId, p.deadline, p.yieldStrategy, p.mAmounts.length);
        _setupMilestones(jobId, p.freelancer, p.mAmounts, p.mHashes, p.mIsUpfront);

        emit JobCreated(jobId, _msgSender(), p.freelancer, actualAmount, jobs[jobId].deadline);
        return jobId;
    }

    function _initJobRecord(
        uint256 jobId, 
        address freelancer, 
        address token, 
        uint256 amount, 
        string calldata ipfsHash, 
        uint256 categoryId, 
        uint256 deadline, 
        IYieldManager.Strategy yieldStrategy,
        uint256 mCount
    ) internal {
        Job storage job = jobs[jobId];
        job.client = _msgSender();
        job.freelancer = freelancer;
        job.token = token;
        job.amount = amount;
        job.status = freelancer == address(0) ? JobStatus.Created : JobStatus.Accepted;
        job.ipfsHash = ipfsHash;
        job.categoryId = uint16(categoryId);
        job.milestoneCount = uint16(mCount);
        job.yieldStrategy = yieldStrategy;
        job.deadline = uint48(deadline == 0 ? block.timestamp + 7 days : deadline);
    }

    function _setupMilestones(uint256 jobId, address freelancer, uint256[] calldata mAmounts, string[] calldata mHashes, bool[] calldata mIsUpfront) internal {
        for (uint256 i = 0; i < mAmounts.length; i++) {
            jobMilestones[jobId][i] = Milestone(mAmounts[i], mHashes[i], false, mIsUpfront[i]);
            if (freelancer != address(0) && mIsUpfront[i]) {
                _releaseMilestoneInternal(jobId, i);
            }
        }
    }

    function _handleJobFunding(
        address token,
        uint256 amount,
        IYieldManager.Strategy yieldStrategy,
        address paymentToken,
        uint256 paymentAmount,
        uint256 minAmountOut
    ) internal returns (uint256 actualAmount) {
        actualAmount = amount;

        // Instant Conversion Logic
        if (paymentToken != token && swapManager != address(0)) {
            if (paymentToken != address(0)) {
                IERC20(paymentToken).safeTransferFrom(_msgSender(), address(this), paymentAmount);
                IERC20(paymentToken).forceApprove(swapManager, paymentAmount);
            }
            
            // Call SwapManager using typed interface
            actualAmount = ISwapManager(swapManager).swap{value: paymentToken == address(0) ? msg.value : 0}(
                paymentToken, token, paymentAmount, minAmountOut, address(this)
            );
        } else {
            // Standard funding
            if (token != address(0)) {
                IERC20(token).safeTransferFrom(_msgSender(), address(this), amount);
            } else {
                if (msg.value < amount) revert LowValue();
            }
        }

        // Auto-deposit into yield manager if strategy is selected
        if (yieldManager != address(0) && yieldStrategy != IYieldManager.Strategy.NONE && token != address(0)) {
            IERC20(token).forceApprove(yieldManager, actualAmount);
            IYieldManager(yieldManager).deposit(yieldStrategy, token, actualAmount);
        }
    }

    /**
     * @notice Stage-based release of funds.
     * @param jobId The unique ID of the job.
     * @param mId The unique ID of the milestone.
     */
    function releaseMilestone(uint256 jobId, uint256 mId) public whenNotPaused nonReentrant {
        Job storage job = jobs[jobId];
        if (_msgSender() != job.client) revert NotAuthorized();
        _releaseMilestoneInternal(jobId, mId);
    }

    function _releaseMilestoneInternal(uint256 jobId, uint256 mId) internal {
        Job storage job = jobs[jobId];
        uint256 mask = 1 << mId;
        if ((milestoneBitmask[jobId] & mask) != 0) revert MilestoneAlreadyReleased();
        milestoneBitmask[jobId] |= mask;
        jobMilestones[jobId][mId].isReleased = true;

        uint256 amt = jobMilestones[jobId][mId].amount;
        job.totalPaidOut += amt;
        
        // Finalize payout by withdrawing from yield manager if active
        if (yieldManager != address(0) && job.yieldStrategy != IYieldManager.Strategy.NONE) {
            IYieldManager(yieldManager).withdraw(job.yieldStrategy, job.token, amt, address(this));
        }

        balances[job.freelancer][job.token] += amt;
        emit MilestoneReleased(jobId, job.freelancer, mId, amt);
    }

    /**
     * @notice Completion and SBT Minting. Handles fee calculation and veteran boosts.
     * @param jobId The unique ID of the job.
     * @param rating Rating for the freelancer (1-5).
     */
    function completeJob(uint256 jobId, uint8 rating) public whenNotPaused nonReentrant {
        Job storage job = jobs[jobId];
        if (_msgSender() != job.client) revert NotAuthorized();
        if (job.status != JobStatus.Ongoing) revert InvalidStatus();
        if (job.paid) revert AlreadyPaid();

        uint256 payout = job.amount - job.totalPaidOut;
        uint256 fee = (job.amount * platformFeeBps) / BASIS_POINTS_DIVISOR;
        
        // Fee cannot exceed the remaining payout (prevents underflow)
        if (fee > payout) fee = payout;

        // Supreme Level Check: 0% Fee for Elite Veterans or Private Verified Users
        bool isSupremeMember = _checkSupremeStatus(job.freelancer, uint256(job.categoryId));

        if (isSupremeMember) fee = 0;
        
        uint256 freelancerNet = payout - fee;

        // State updates
        job.paid = true;
        job.status = JobStatus.Completed;
        job.rating = rating;
        job.totalPaidOut += payout;

        // Mint SBTs
        _mintSBT(job.freelancer, jobId);

        if (completionCertContract != address(0)) {
            IFreelanceSBT(completionCertContract).mintContribution(job.freelancer, job.categoryId, rating, jobId, job.client);
        }

        if (reputationContract != address(0)) {
            (bool success, ) = reputationContract.call(abi.encodeWithSignature("levelUp(address,uint256,uint256)", job.freelancer, job.categoryId, 1));
            success;
            (success, ) = reputationContract.call(abi.encodeWithSignature("updateRating(address,uint8)", job.freelancer, rating));
            success;
        }

        if (rating == 5 && reviewSBT != address(0)) {
            (bool success, ) = reviewSBT.call(abi.encodeWithSignature("mint(address)", job.freelancer));
            success;
        }

        if (polyToken != address(0)) {
            uint256 reward = isSupremeMember ? REWARD_BASE * SUPREME_REWARD_BOOST : REWARD_BASE;
            (bool success, ) = polyToken.call(abi.encodeWithSignature("mint(address,uint256)", job.freelancer, reward));
            success;
        }

        // Finalize payout by withdrawing from yield manager if active
        if (yieldManager != address(0) && job.yieldStrategy != IYieldManager.Strategy.NONE) {
            IYieldManager(yieldManager).withdraw(job.yieldStrategy, job.token, payout + job.freelancerStake, address(this));
        }

        // Payout freelancer (net) + stake return
        balances[job.freelancer][job.token] += (freelancerNet + job.freelancerStake);
        
        // Payout vault (fee)
        if (fee > 0 && vault != address(0)) {
            balances[vault][job.token] += fee;
        }

        emit FundsReleased(jobId, job.freelancer, payout, jobId);
        emit ReviewSubmitted(jobId, job.client, job.freelancer, rating, "");
    }

    /**
     * @notice Internal helper to check if a user qualifies for Zenith 'Supreme' benefits.
     */
    function _checkSupremeStatus(address user, uint256 categoryId) internal view returns (bool) {
        if (isSupreme[user]) return true;
        
        if (reputationContract != address(0)) {
            try IERC1155(reputationContract).balanceOf(user, categoryId) returns (uint256 bal) {
                if (bal >= reputationThreshold) return true;
            } catch {}
        }
        
        if (privacyShield != address(0)) {
            try PrivacyShield(privacyShield).isVerified(user) returns (bool verified) {
                return verified;
            } catch {}
        }
        
        return false;
    }

    function void(bool) internal pure {}

    /**
     * @notice Traditional releaseFunds call, effectively completes the job with a default 5-star rating.
     * @param jobId The unique ID of the job.
     */
    function releaseFunds(uint256 jobId) external {
        completeJob(jobId, 5);
    }

    /**
     * @notice Allows a client to refund a job if it has expired or if in emergency mode.
     * @param jobId The unique ID of the job.
     */
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
        
        // Withdraw from yield manager if active
        // Withdraw from yield manager if active
        if (yieldManager != address(0) && job.yieldStrategy != IYieldManager.Strategy.NONE) {
            IYieldManager(yieldManager).withdraw(job.yieldStrategy, job.token, job.amount - job.totalPaidOut, address(this));
        }

        uint256 remaining = job.amount - job.totalPaidOut;
        if (remaining > 0) {
            balances[job.client][job.token] += remaining;
        }
    }

    /**
     * @notice Submit evidence for a disputed job.
     */
    function submitEvidence(uint256 jobId, string calldata evidenceHash) external whenNotPaused {
        Job storage job = jobs[jobId];
        if (_msgSender() != job.client && _msgSender() != job.freelancer) revert NotAuthorized();
        if (job.status != JobStatus.Disputed) revert InvalidStatus();

        emit Evidence(IArbitrator(arbitrator), jobId, _msgSender(), evidenceHash);
    }

    /**
     * @notice Decentralized Dispute Integration. Raises a dispute for a job.
     * @param jobId The unique ID of the job.
     */
    function raiseDispute(uint256 jobId) public payable whenNotPaused nonReentrant {
        Job storage job = jobs[jobId];
        if (_msgSender() != job.client && _msgSender() != job.freelancer) revert NotAuthorized();
        if (job.status != JobStatus.Created && job.status != JobStatus.Accepted && job.status != JobStatus.Ongoing) revert InvalidStatus();
        
        job.status = JobStatus.Disputed;

        if (arbitrator != address(0) && arbitrator != address(this)) {
            uint256 cost = IArbitrator(arbitrator).arbitrationCost("");
            uint256 dId = IArbitrator(arbitrator).createDispute{value: msg.value}(2, "");
            disputeIdToJobId[dId] = jobId;
            emit Dispute(IArbitrator(arbitrator), dId, jobId, jobId);
        } else {
            // Internal arbitration or manual mode
            emit DisputeRaised(jobId, jobId);
        }
    }

    /**
     * @notice Alias for raiseDispute.
     * @param jobId The unique ID of the job.
     */
    function dispute(uint256 jobId) external payable {
        raiseDispute(jobId);
    }

    /**
     * @notice Allows the arbitrator to rule on a dispute.
     * @param dId The unique ID of the dispute.
     * @param ruling The ruling (1: Split, 2: Client wins, 3: Freelancer wins).
     */
    function rule(uint256 dId, uint256 ruling) external override whenNotPaused nonReentrant {
        if (_msgSender() != arbitrator) revert NotAuthorized();
        uint256 jobId = disputeIdToJobId[dId];
        Job storage job = jobs[jobId];
        if (job.status != JobStatus.Disputed) revert InvalidStatus();

        uint256 payout = job.amount - job.totalPaidOut;
        uint256 stake = job.freelancerStake;
        
        job.paid = true;
        
        // Withdraw from yield manager if active
        if (yieldManager != address(0) && job.yieldStrategy != IYieldManager.Strategy.NONE) {
            IYieldManager(yieldManager).withdraw(job.yieldStrategy, job.token, payout + stake, address(this));
        }

        if (ruling == 1) { // Refuse to Rule / Split 50-50
            job.status = JobStatus.Cancelled;
            balances[job.client][job.token] += (payout / 2);
            balances[job.freelancer][job.token] += ((payout / 2) + stake);
        } else if (ruling == 2) { // Client Wins
            job.status = JobStatus.Cancelled;
            balances[job.client][job.token] += (payout + stake); // Client gets stake as penalty
        } else if (ruling == 3) { // Freelancer Wins
            job.status = JobStatus.Completed;
            job.totalPaidOut += payout;
            balances[job.freelancer][job.token] += (payout + stake);
            _mintSBT(job.freelancer, jobId);
        }
        
        emit Ruling(IArbitrator(arbitrator), dId, ruling);
    }

    function _mintSBT(address to, uint256 jobId) internal {
        if (sbtContract != address(0)) {
            Job storage job = jobs[jobId];
            try IFreelanceSBT(sbtContract).mintContribution(to, job.categoryId, 5, jobId, job.client) {} catch {
                (bool s, ) = sbtContract.call(abi.encodeWithSignature("safeMint(address,string)", to, job.ipfsHash));
                (s);
            }
        }
    }

    /**
     * @notice Allows the admin to resolve a dispute manually by specifying a bps split.
     * @param jobId The unique ID of the job.
     * @param freelancerBps The bps split for the freelancer (10000 = 100%).
     */
    function resolveDisputeManual(uint256 jobId, uint256 freelancerBps) external onlyRole(ARBITRATOR_ROLE) whenNotPaused nonReentrant {
        Job storage job = jobs[jobId];
        if (job.status != JobStatus.Disputed) revert InvalidStatus();
        
        uint256 remaining = job.amount - job.totalPaidOut;
        uint256 freelancerAmt = (remaining * freelancerBps) / 10000;
        uint256 clientAmt = remaining - freelancerAmt;

        job.totalPaidOut += remaining;
        job.status = (freelancerBps > 5000) ? JobStatus.Completed : JobStatus.Cancelled;

        // Withdraw from yield manager if active
        if (yieldManager != address(0) && job.yieldStrategy != IYieldManager.Strategy.NONE) {
            IYieldManager(yieldManager).withdraw(job.yieldStrategy, job.token, remaining + job.freelancerStake, address(this));
        }

        if (freelancerAmt > 0) balances[job.freelancer][job.token] += (freelancerAmt + job.freelancerStake);
        else balances[job.freelancer][job.token] += job.freelancerStake;

        if (clientAmt > 0) balances[job.client][job.token] += clientAmt;
        
        emit DisputeResolved(jobId, freelancerBps);
    }

    function _transferFunds(address to, address token, uint256 amt) internal {
        if (token == address(0)) {
            (bool s, ) = payable(to).call{value: amt}("");
            if (!s) revert TransferFailed();
        } else {
            IERC20(token).safeTransfer(to, amt);
        }
    }

    /**
     * @notice Returns the metadata URI for a job NFT.
     * @dev Generates an on-chain SVG representation using FreelanceRenderer.
     * @param jobId The unique ID of the job.
     * @return A base64 encoded JSON metadata URI.
     */
    function tokenURI(uint256 jobId) public view override returns (string memory) {
        Job storage job = jobs[jobId];
        return FreelanceRenderer.constructTokenURI(
            jobId,
            job.categoryId,
            job.amount,
            job.rating,
            job.ipfsHash
        );
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
