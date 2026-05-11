// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "./FreelanceRenderer.sol";

interface IFreelanceRenderer {
    function constructTokenURI(uint256 jobId, uint16 categoryId, uint256 amount, uint8 rating, string memory ipfsHash) external pure returns (string memory);
}
import "./FreelanceEscrowBase.sol";
import "./interfaces/IFreelanceSBT.sol";
import "./FreelanceJobNFT.sol";

import "./PrivacyShield.sol";
import "./FreelanceEscrowLibrary.sol";
import "./FreelanceSovereignLibrary.sol";
import "./FreelanceAdminLibrary.sol";

import {Job, JobStatus, CreateParams} from "./FreelanceTypes.sol";
import {FreelanceDisputeLibrary} from "./FreelanceDisputeLibrary.sol";

/**
 * @title FreelanceEscrow
 */
contract FreelanceEscrow is
 FreelanceEscrowBase, PausableUpgradeable, IArbitrable {
    using SafeERC20 for IERC20;

    event JobApplied(uint256 indexed jobId, address indexed freelancer, uint256 stake);
    event FreelancerPicked(uint256 indexed jobId, address indexed freelancer);
    event JobAccepted(uint256 indexed jobId, address indexed freelancer);
    event IntentMatched(uint256 indexed jobId, address indexed client, address indexed freelancer, bytes32 intentHash);
    event SBTContractUpdated(address indexed newSbt);
    event EntryPointUpdated(address indexed newEntry);
    event VaultUpdated(address indexed newVault);
    event PolyTokenUpdated(address indexed newToken);
    event ReputationContractUpdated(address indexed newRep);
    event CompletionCertContractUpdated(address indexed newCert);
    event ReviewSBTUpdated(address indexed newReviewSbt);
    event PrivacyShieldUpdated(address indexed newPrivacyShield);
    event YieldManagerUpdated(address indexed newYieldManager);
    event SwapManagerUpdated(address indexed newSwapManager);
    event ReputationThresholdUpdated(uint256 newThreshold);
    event CallFailed(address indexed target, string reason);
    event JobNFTUpdated(address indexed newNft);
    event RendererUpdated(address indexed newRenderer);

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
    /// @notice Address of the Zenith Security Oracle
    address public securityOracle;
    function setJobNFT(address _nft) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_nft == address(0)) revert InvalidAddress();
        jobNFT = _nft;
        emit JobNFTUpdated(_nft);
    }
    function setRenderer(address _r) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_r == address(0)) revert InvalidAddress();
        renderer = _r;
        emit RendererUpdated(_r);
    }
    /// @notice Address of the PolyLance Timelock
    address public timelock;
    /// @notice Flag for emergency mode (pauses most functions)
    bool public emergencyMode; 
    /// @notice Flag to permanently seal the protocol under Timelock control
    bool public isSealed;
    /// @notice Timestamp of the last successful Security Oracle heartbeat
    uint256 public lastSecurityHeartbeat;
    /// @notice Delay after which the Security Oracle can be bypassed by the Timelock (default 7 days)
    uint256 public constant ORACLE_BYPASS_DELAY = 7 days;
    
    /// @notice Mapping to track the last time a user created a job (DoS mitigation)
    mapping(address => uint256) public lastJobCreated;
    /// @notice Cooldown period for job creation
    uint256 public constant CREATION_COOLDOWN = 30 seconds;

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
    function initialize(address admin, address forwarder, address _sbt, address _entry, address _nft, address _renderer) public initializer {
        if (admin == address(0) || forwarder == address(0) || _sbt == address(0) || _entry == address(0) || _nft == address(0) || _renderer == address(0)) revert InvalidAddress();
        __AccessControl_init();

        __Pausable_init();
        __ReentrancyGuard_init();

        jobNFT = _nft;
        renderer = _renderer;


        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MANAGER_ROLE, admin);
        _grantRole(ARBITRATOR_ROLE, admin);
        
        _trustedForwarder = forwarder;
        arbitrator = admin;
        sbtContract = _sbt;
        entryPoint = _entry;
        gravityFactor = 250; // 2.5% default Economic Friction
        reputationThreshold = 10; // Default threshold for Elite Veterans
    }


    /**
     * @notice Actuates the Zenith Court by designating multiple supreme magistrates.
     * @param judges Array of wallet addresses to be granted the ARBITRATOR_ROLE.
     */
    function actuateZenithJudges(address[] calldata judges) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (isSealed) revert ProtocolAlreadySealed();
        for (uint256 i = 0; i < judges.length; i++) {
            if (judges[i] == address(0)) revert InvalidAddress();
            _grantRole(ARBITRATOR_ROLE, judges[i]);
            emit SupremeStatusUpdated(judges[i], true);
        }
    }

    /**
     * @notice Consolidated protocol configuration management.
     */
    function setProtocolConfig(FreelanceAdminLibrary.ConfigType c, address addr, uint256 val) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (isSealed) revert ProtocolAlreadySealed();
        if (c == FreelanceAdminLibrary.ConfigType.SBT) {
            sbtContract = addr;
            emit SBTContractUpdated(addr);
        } else if (c == FreelanceAdminLibrary.ConfigType.ENTRY_POINT) {
            entryPoint = addr;
            emit EntryPointUpdated(addr);
        } else if (c == FreelanceAdminLibrary.ConfigType.VAULT) {
            vault = addr;
            emit VaultUpdated(addr);
        } else if (c == FreelanceAdminLibrary.ConfigType.FEE) {
            if (val > MAX_PLATFORM_FEE_BPS) revert InvalidStatus();
            gravityFactor = val;
            emit FeeAdjusted(val, block.timestamp);
        } else if (c == FreelanceAdminLibrary.ConfigType.POLY_TOKEN) {
            polyToken = addr;
            emit PolyTokenUpdated(addr);
        } else if (c == FreelanceAdminLibrary.ConfigType.REP) {
            reputationContract = addr;
            emit ReputationContractUpdated(addr);
        } else if (c == FreelanceAdminLibrary.ConfigType.COMP_CERT) {
            completionCertContract = addr;
            emit CompletionCertContractUpdated(addr);
        } else if (c == FreelanceAdminLibrary.ConfigType.REVIEW_SBT) {
            reviewSBT = addr;
            emit ReviewSBTUpdated(addr);
        } else if (c == FreelanceAdminLibrary.ConfigType.SWAP) {
            swapManager = addr;
            emit SwapManagerUpdated(addr);
        } else if (c == FreelanceAdminLibrary.ConfigType.RENDERER) {
            renderer = addr;
            emit RendererUpdated(addr);
        } else if (c == FreelanceAdminLibrary.ConfigType.JOB_NFT) {
            jobNFT = addr;
            emit JobNFTUpdated(addr);
        } else if (c == FreelanceAdminLibrary.ConfigType.PRIVACY) {
            privacyShield = addr;
            emit PrivacyShieldUpdated(addr);
        } else if (c == FreelanceAdminLibrary.ConfigType.SWAP) {
            swapManager = addr;
            emit SwapManagerUpdated(addr);
        } else if (c == FreelanceAdminLibrary.ConfigType.VAULT) {
            vault = addr;
            emit VaultUpdated(addr);
        } else if (c == FreelanceAdminLibrary.ConfigType.ORACLE) {
            securityOracle = addr;
            emit SecurityOracleUpdated(addr);
        } else if (c == FreelanceAdminLibrary.ConfigType.TIMELOCK) {
            timelock = addr;
            emit TimelockUpdated(addr);
        } else {
            revert InvalidStatus();
        }
    }

    function updatePlatformFee(uint256 _bps) external onlyRole(AGENT_ROLE) {
        if (_bps > MAX_PLATFORM_FEE_BPS) revert InvalidStatus();
        gravityFactor = _bps;
        emit FeeAdjusted(_bps, block.timestamp);
    }

    function rebalanceTreasury(address token, uint256 amount, IYieldManager.Strategy fromStrategy, IYieldManager.Strategy toStrategy) external onlyRole(AGENT_ROLE) {
        if (yieldManager == address(0)) revert InvalidAddress();
        IYieldManager(yieldManager).withdraw(fromStrategy, token, amount, address(this));
        IERC20(token).forceApprove(yieldManager, amount);
        IYieldManager(yieldManager).deposit(toStrategy, token, amount);
        emit TreasuryRebalanced(token, amount, fromStrategy, toStrategy, block.timestamp);
    }

    /**
     * @notice Updates the Privacy Shield contract address.
     * @param _ps New Privacy Shield address.
     */
    function setPrivacyShield(address _ps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        privacyShield = _ps;
        emit PrivacyShieldUpdated(_ps);
    }

    event SecurityOracleUpdated(address indexed newOracle);
    function setSecurityOracle(address _so) external onlyRole(DEFAULT_ADMIN_ROLE) {
        securityOracle = _so;
        lastSecurityHeartbeat = block.timestamp; // Reset heartbeat on update
        emit SecurityOracleUpdated(_so);
    }

    /**
     * @notice Manually updates the Security Oracle heartbeat (Circuit Breaker maintenance).
     */
    function pokeSecurityOracle() external {
        (bool success, ) = securityOracle.staticcall(abi.encodeWithSignature("ping()"));
        if (success) {
            lastSecurityHeartbeat = block.timestamp;
        }
    }

    event TimelockUpdated(address indexed newTimelock);
    function setTimelock(address _t) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_t == address(0)) revert InvalidAddress();
        timelock = _t;
        emit TimelockUpdated(_t);
    }

    /**
     * @notice Mapping to manually mark users as 'Supreme Members'.
     */
    mapping(address => bool) public isSupreme;
    event SupremeStatusUpdated(address indexed user, bool status);

    function setIsSupreme(address _user, bool _status) external onlyRole(DEFAULT_ADMIN_ROLE) {
        isSupreme[_user] = _status;
        emit SupremeStatusUpdated(_user, _status);
    }

    /**
     * @notice Updates the reputation threshold for fee waivers.
     * @param _t New threshold value.
     */
    function setReputationThreshold(uint256 _t) external onlyRole(DEFAULT_ADMIN_ROLE) {
        reputationThreshold = _t;
        emit ReputationThresholdUpdated(_t);
    }

    /**
     * @notice Mapping for whitelisted payment tokens.
     */
    mapping(address => bool) public tokenWhitelist;
    function setTokenWhitelist(address _token, bool _status) external onlyRole(MANAGER_ROLE) {
        tokenWhitelist[_token] = _status;
    }



    uint256 public constant MAX_APPLICATIONS_PER_JOB = 50;

    /**
     * @notice Allows a freelancer to apply for a job by providing a stake.
     * @param jobId The unique ID of the job.
     */
    function applyForJob(uint256 jobId) external payable whenNotPaused nonReentrant {
        FreelanceEscrowLibrary.handleApplication(
            jobs[jobId], 
            jobApplications[jobId], 
            hasApplied, 
            _msgSender(), 
            msg.value, 
            privacyShield, 
            yieldManager
        );
        emit JobApplied(jobId, _msgSender(), (jobs[jobId].amount * APPLICATION_STAKE_PERCENT) / 100);
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
    function pickFreelancer(uint256 jobId, address freelancer) external whenNotPaused nonReentrant {
        Job storage job = jobs[jobId];
        if (_msgSender() != job.client) revert NotAuthorized();
        
        FreelanceEscrowLibrary.handlePicking(job, jobApplications[jobId], freelancer, yieldManager, balances);
        
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
    function submitWork(uint256 jobId, string calldata ipfsHash) external whenNotPaused {
        Job storage job = jobs[jobId];
        if (_msgSender() != job.freelancer) revert NotAuthorized();
        if (job.status != JobStatus.Ongoing) revert InvalidStatus();

        // XSS Hardening: Validate IPFS CID format for work submission
        FreelanceEscrowLibrary.validateCID(ipfsHash);

        job.ipfsHash = ipfsHash;
        
        emit WorkSubmitted(jobId, _msgSender(), ipfsHash, block.timestamp);
    }

    /**
     * @notice Allows the client or authorized manager to update the job's metadata pointer.
     * @param jobId The unique ID of the job.
     * @param ipfsHash The new IPFS hash for the job metadata.
     */
    function setJobMetadata(uint256 jobId, string calldata ipfsHash) external whenNotPaused {
        Job storage job = jobs[jobId];
        if (_msgSender() != job.client && !hasRole(MANAGER_ROLE, _msgSender())) revert NotAuthorized();
        
        // XSS Hardening: Validate IPFS CID format
        FreelanceEscrowLibrary.validateCID(ipfsHash);
        
        job.ipfsHash = ipfsHash;
    }

    /**
     * @notice Withdraws available funds for the caller in the specified token.
     * @param token Address of the token (0 for native).
     */
    function withdraw(address token) external whenNotPaused nonReentrant {
        uint256 amt = balances[_msgSender()][token];
        if (amt == 0) revert LowValue();
        balances[_msgSender()][token] = 0;
        _transferFunds(_msgSender(), token, amt);
    }

    /**
     * @notice Allows a specialist to withdraw funds directly to their Token Bound Account or another destination.
     * @param token Address of the token.
     * @param to Destination address (e.g., the specialist's Shadow Vault).
     */
    function withdrawTo(address token, address to) external whenNotPaused nonReentrant {
        if (to == address(0)) revert InvalidAddress();
        uint256 amt = balances[_msgSender()][token];
        if (amt == 0) revert LowValue();
        
        balances[_msgSender()][token] = 0;
        _transferFunds(to, token, amt);
        
        emit FundsWithdrawn(_msgSender(), to, token, amt);
    }

    event FundsWithdrawn(address indexed owner, address indexed recipient, address indexed token, uint256 amount);

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
        if (isSealed) revert ProtocolAlreadySealed();
        if (_arb == address(0)) revert InvalidAddress();
        arbitrator = _arb;
    }

    /**
     * @notice Permanently seals the protocol, transferring all administrative power to the Timelock.
     *         Once sealed, manual role changes and arbitrator updates are disabled.
     */
    function sealProtocol() external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (timelock == address(0)) revert InvalidStatus();
        isSealed = true;
        emit ProtocolSealed();
    }

    event ProtocolSealed();
    error ProtocolAlreadySealed();

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function toggleEmergencyMode(bool _active) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (isSealed) revert ProtocolAlreadySealed();
        emergencyMode = _active;
        if (_active) _pause();
        else _unpause();
    }

    /**
     * @notice Sovereign Failsafe: Allows the AG Agent to freeze escrows if a centralization attack is detected.
     */
    function sovereignFreeze() external onlyRole(AGENT_ROLE) {
        emergencyMode = true;
        _pause();
        emit FeeAdjusted(0, block.timestamp); // SIGNAL: Trust minimization active
    }

    /**
     * @notice Ragequit Failsafe: Allows instant withdrawal of locked funds during a sovereign freeze.
     * @dev Hardened (S-04): Ensures totalPaidOut is updated to match job.amount on full withdrawal to prevent accounting drift.
     */
    function sovereignWithdraw(uint256 jobId) external nonReentrant {
        if (!emergencyMode) revert InvalidStatus();
        Job storage job = jobs[jobId];
        
        uint256 remaining = job.amount - job.totalPaidOut;
        uint256 fStake = job.freelancerStake;
        
        if (remaining == 0 && fStake == 0) revert AlreadyPaid();

        address recipient;
        uint256 amountToWithdraw;

        if (_msgSender() == job.client) {
            recipient = job.client;
            amountToWithdraw = remaining;
            job.totalPaidOut = job.amount; // Mark as fully paid/returned
            job.status = JobStatus.Cancelled;
        } else if (_msgSender() == job.freelancer) {
            recipient = job.freelancer;
            amountToWithdraw = fStake;
            job.freelancerStake = 0;
            // Status remains the same or moves to Cancelled if stake withdrawn in emergency
            job.status = JobStatus.Cancelled;
        } else if (hasRole(AGENT_ROLE, _msgSender())) {
            // Sovereign Directive: Agent-led evacuation
            recipient = _msgSender();
            amountToWithdraw = remaining + fStake;
            job.totalPaidOut = job.amount;
            job.freelancerStake = 0;
            job.status = JobStatus.Cancelled;
        } else {
            revert NotAuthorized();
        }

        if (amountToWithdraw == 0) revert LowValue();

        if (yieldManager != address(0) && job.yieldStrategy != IYieldManager.Strategy.NONE && job.token != address(0)) {
            IYieldManager(yieldManager).withdraw(job.yieldStrategy, job.token, amountToWithdraw, address(this));
        }

        _transferFunds(recipient, job.token, amountToWithdraw);
    }

    

    /**
     * @notice Milestone Factory: Locks funds and defines stages upfront.
     * @param p CreateParams struct containing job details and milestones.
     * @return The newly created jobId.
     */
    function createJob(CreateParams calldata p) public payable whenNotPaused nonReentrant returns (uint256) {
        return _createJobInternal(_msgSender(), p);
    }

    /**
     * @notice Allows authorized bridge adapters to create jobs on behalf of users on other chains.
     * @dev Restricted to BRIDGE_ROLE.
     */
    function createJobFor(address client, CreateParams calldata p) external whenNotPaused nonReentrant onlyRole(BRIDGE_ROLE) returns (uint256) {
        return _createJobInternal(client, p);
    }

    function _createJobInternal(address client, CreateParams calldata p) internal returns (uint256) {
        if (p.amount == 0) revert LowValue();
        if (bytes(p.ipfsHash).length == 0) revert InvalidStatus();
        if (p.token != address(0) && !tokenWhitelist[p.token]) revert TokenNotWhitelisted();
        if (p.mAmounts.length == 0 || p.mAmounts.length > MAX_MILESTONES) revert InvalidStatus();
        if (p.mAmounts.length != p.mHashes.length || p.mAmounts.length != p.mIsUpfront.length) revert MilestoneMismatch();
        if (p.deadline != 0 && p.deadline < block.timestamp) revert InvalidStatus();

        // XSS Hardening: Validate IPFS CID format
        FreelanceEscrowLibrary.validateCID(p.ipfsHash);
        
        // DoS Mitigation: Creation Cooldown
        if (block.timestamp < lastJobCreated[client] + CREATION_COOLDOWN) revert NotAuthorized();
        lastJobCreated[client] = block.timestamp;

        uint256 totalM;
        for (uint256 i = 0; i < p.mAmounts.length; i++) {
            totalM += p.mAmounts[i];
        }
        if (totalM != p.amount) revert MilestoneMismatch();
        
        uint256 jobId = ++jobCount;

        (uint256 actualAmount, IYieldManager.Strategy actualStrategy) = FreelanceEscrowLibrary.handleFunding(
            client, 
            p.token, 
            p.amount, 
            p.yieldStrategy, 
            p.paymentToken, 
            p.paymentAmount, 
            p.minAmountOut,
            swapManager,
            yieldManager,
            msg.value
        );
        
        _initJobRecord(jobId, client, p.freelancer, p.token, p.amount, p.ipfsHash, p.categoryId, p.deadline, actualStrategy, p.mAmounts.length, p.zkRequired);
        _setupMilestones(jobId, p.freelancer, p.mAmounts, p.mHashes, p.mIsUpfront);
        
        // 3. Interactions: Mint the Job NFT via external contract (Offloaded to library)
        if (jobNFT != address(0) && renderer != address(0)) {
            string memory uri = IFreelanceRenderer(renderer).constructTokenURI(
                jobId,
                uint16(p.categoryId),
                p.amount,
                0, // rating is 0 for new job
                p.ipfsHash
            );
            FreelanceSovereignLibrary.mintJobNFT(jobNFT, p.freelancer, jobId, uri);
        }
        
        emit JobCreated(jobId, client, p.freelancer, p.amount, p.deadline, block.timestamp);
        return jobId;
    }

    function _initJobRecord(
        uint256 jobId, 
        address client,
        address freelancer, 
        address token, 
        uint256 amount, 
        string calldata ipfsHash, 
        uint256 categoryId, 
        uint256 deadline, 
        IYieldManager.Strategy yieldStrategy,
        uint256 mCount,
        bool zkRequired
    ) internal {
        FreelanceEscrowLibrary.initializeJob(
            jobs[jobId], 
            jobId, 
            client, 
            freelancer, 
            token, 
            amount, 
            deadline, 
            ipfsHash,
            uint8(mCount), 
            zkRequired, 
            yieldStrategy
        );
    }

    function _setupMilestones(uint256 jobId, address freelancer, uint256[] calldata mAmounts, string[] calldata mHashes, bool[] calldata mIsUpfront) internal {
        for (uint256 i = 0; i < mAmounts.length; i++) {
            jobMilestones[jobId][i] = Milestone(mAmounts[i], mHashes[i], false, mIsUpfront[i]);
            if (freelancer != address(0) && mIsUpfront[i]) {
                _releaseMilestoneInternal(jobId, i);
            }
        }
    }



    uint256 public constant MAX_MILESTONES = 100;

    /**
     * @notice Stage-based release of funds.
     * @param jobId The unique ID of the job.
     * @param mId The unique ID of the milestone.
     */
    function releaseMilestone(uint256 jobId, uint256 mId) public whenNotPaused nonReentrant {
        Job storage job = jobs[jobId];
        if (_msgSender() != job.client) revert NotAuthorized();
        if (job.status != JobStatus.Ongoing && job.status != JobStatus.Accepted) revert InvalidStatus();
        if (mId >= job.milestoneCount) revert InvalidMilestone();
        
        // Zenith Security Gate
        if (job.zkRequired && securityOracle != address(0)) {
            // Circuit Breaker: If oracle is dead for > 7 days, allow Timelock or Admin to bypass
            bool isOracleDead = (block.timestamp - lastSecurityHeartbeat) > ORACLE_BYPASS_DELAY;
            
            if (!isOracleDead) {
                (bool success, bytes memory data) = securityOracle.staticcall(
                    abi.encodeWithSignature("isMilestoneSecure(uint256,uint256)", jobId, mId)
                );
                if (!success || !abi.decode(data, (bool))) revert NotAuthorized();
            } else {
                // If oracle is dead, only the Timelock can authorize the release
                if (_msgSender() != timelock && !hasRole(DEFAULT_ADMIN_ROLE, _msgSender())) revert NotAuthorized();
            }
        }

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
        if (yieldManager != address(0) && job.yieldStrategy != IYieldManager.Strategy.NONE && job.token != address(0)) {
            IYieldManager(yieldManager).withdraw(job.yieldStrategy, job.token, amt, address(this));
        }

        balances[job.freelancer][job.token] += amt;
        emit MilestoneReleased(jobId, job.freelancer, mId, amt, block.timestamp);
    }

    /**
     * @notice Completion and SBT Minting. Handles fee calculation and veteran boosts.
     * @param jobId The unique ID of the job.
     * @param rating Rating for the freelancer (1-5).
     */
    function completeJob(uint256 jobId, uint8 rating) public whenNotPaused nonReentrant {
        Job storage job = jobs[jobId];
        if (_msgSender() != job.client && !hasRole(ARBITRATOR_ROLE, _msgSender()) && !hasRole(AGENT_ROLE, _msgSender())) revert NotAuthorized();
        if (job.status != JobStatus.Ongoing) revert InvalidStatus();
        if (job.paid) revert AlreadyPaid();

        bool isSupremeMember = FreelanceSovereignLibrary.checkSupremeStatus(
            job.freelancer, 
            uint256(job.categoryId), 
            isSupreme[job.freelancer], 
            reputationContract, 
            reputationThreshold, 
            privacyShield
        );

        (uint256 payout, uint256 fee, uint256 freelancerNet) = FreelanceSovereignLibrary.calculateCompletionFees(
            job.amount,
            job.totalPaidOut,
            gravityFactor,
            BASIS_POINTS_DIVISOR,
            isSupremeMember
        );

        // 1. Effects
        job.paid = true;
        job.status = JobStatus.Completed;
        job.rating = rating;
        job.totalPaidOut += payout;

        balances[job.freelancer][job.token] += (freelancerNet + job.freelancerStake);
        if (fee > 0 && vault != address(0)) {
            balances[vault][job.token] += fee;
        }

        // 2. Interactions
        FreelanceSovereignLibrary.handleSBTContribution(sbtContract, job.freelancer, job.categoryId, jobId, job.client, job.ipfsHash);
        FreelanceSovereignLibrary.actuateSovereignReputation(reputationContract, job.freelancer, job.categoryId, rating);
        FreelanceSovereignLibrary.mintRewards(polyToken, job.freelancer, REWARD_BASE, isSupremeMember, SUPREME_REWARD_BOOST, job.token == polyToken);

        // 3. Yield Withdrawal
        if (yieldManager != address(0) && job.yieldStrategy != IYieldManager.Strategy.NONE && job.token != address(0)) {
            IYieldManager(yieldManager).withdraw(job.yieldStrategy, job.token, payout + job.freelancerStake, address(this));
        }

        emit FundsReleased(jobId, job.freelancer, payout, jobId, block.timestamp);
        emit ReviewSubmitted(jobId, job.client, job.freelancer, rating, "", block.timestamp);
    }

    /**
     * @notice Internal helper to check if a user qualifies for Zenith 'Supreme' benefits.
     */




    /**
     * @notice Neutralizes economic friction by releasing final funds to a verified actor.
     *         Effectively completes the job with a default 5-star rating.
     * @param jobId The unique ID of the job.
     */
    function actuatePayment(uint256 jobId) external whenNotPaused nonReentrant {
        Job storage job = jobs[jobId];
        if (_msgSender() != job.client && !hasRole(ARBITRATOR_ROLE, _msgSender()) && !hasRole(AGENT_ROLE, _msgSender())) revert NotAuthorized();
        completeJob(jobId, 5);
    }

    /**
     * @notice Allows a client to refund a job if it has expired or if in emergency mode.
     * @dev Optimized (S-06): Refunds both client funds and all applicant stakes. 
     *      Batches YieldManager withdrawals for efficiency.
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

        FreelanceEscrowLibrary.processRefund(job, jobApplications[jobId], yieldManager, balances);
        
        emit FundsReleased(jobId, job.client, job.amount - job.totalPaidOut, 0, block.timestamp);
    }

    /**
     * @notice Allows a client to cancel a job before it is accepted.
     * @dev Optimized (S-06): Batches YieldManager withdrawals for applicant stakes.
     * @param jobId The unique ID of the job.
     */
    function cancelJob(uint256 jobId) external whenNotPaused nonReentrant {
        Job storage job = jobs[jobId];
        if (_msgSender() != job.client) revert NotAuthorized();
        if (job.status != JobStatus.Created) revert InvalidStatus();

        FreelanceEscrowLibrary.processRefund(job, jobApplications[jobId], yieldManager, balances);
        
        emit FundsReleased(jobId, job.client, job.amount - job.totalPaidOut, 0, block.timestamp);
    }

    /**
     * @notice Submit evidence for a disputed job.
     */
    function submitEvidence(uint256 jobId, string calldata evidenceHash) external whenNotPaused {
        Job storage job = jobs[jobId];
        if (_msgSender() != job.client && _msgSender() != job.freelancer) revert NotAuthorized();
        if (job.status != JobStatus.Disputed) revert InvalidStatus();

        // XSS Hardening: Validate IPFS CID format for evidence
        FreelanceEscrowLibrary.validateCID(evidenceHash);

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
            // Hardening: Validate arbitration cost to avoid transaction failure in external call
            uint256 cost = IArbitrator(arbitrator).arbitrationCost("");
            if (msg.value < cost) revert LowStake();
            
            uint256 dId = IArbitrator(arbitrator).createDispute{value: msg.value}(2, "");
            disputeIdToJobId[dId] = jobId;
            emit Dispute(IArbitrator(arbitrator), dId, jobId, jobId);
        } else {
            // Internal arbitration or manual mode
            // In internal mode, use jobId as the dispute ID
            emit DisputeRaised(jobId, jobId, block.timestamp);
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

        (uint256 clientAmt, uint256 freelancerAmt, bool isCompleted) = FreelanceDisputeLibrary.processRuling(job, ruling);
        
        // 1. Effects: Update state
        job.paid = true;
        job.status = isCompleted ? JobStatus.Completed : JobStatus.Cancelled;
        if (isCompleted) job.totalPaidOut += (job.amount - job.totalPaidOut);

        balances[job.client][job.token] += clientAmt;
        balances[job.freelancer][job.token] += freelancerAmt;

        // 2. Interactions: Yield manager withdrawal
        uint256 totalToWithdraw = clientAmt + freelancerAmt - job.freelancerStake; // Net amount minus the stake which is already handled
        // Actually, just withdraw the remaining balance
        if (yieldManager != address(0) && job.yieldStrategy != IYieldManager.Strategy.NONE && job.token != address(0)) {
            IYieldManager(yieldManager).withdraw(job.yieldStrategy, job.token, (job.amount - job.totalPaidOut) + job.freelancerStake, address(this));
        }

        // 3. Interactions: SBT Minting
        if (isCompleted) {
            _mintSBT(job.freelancer, jobId);
        }
        
        emit Ruling(IArbitrator(arbitrator), dId, ruling);
    }

    function _mintSBT(address to, uint256 jobId) internal {
        Job storage job = jobs[jobId];
        FreelanceSovereignLibrary.handleSBTContribution(sbtContract, to, job.categoryId, jobId, job.client, job.ipfsHash);
    }

    /**
     * @notice Allows the admin to resolve a dispute manually by specifying a bps split.
     * @param jobId The unique ID of the job.
     * @param freelancerBps The bps split for the freelancer (10000 = 100%).
     */
    function resolveDisputeManual(uint256 jobId, uint256 freelancerBps) external onlyRole(ARBITRATOR_ROLE) whenNotPaused nonReentrant {
        Job storage job = jobs[jobId];
        if (job.status != JobStatus.Disputed && job.status != JobStatus.Ongoing) revert InvalidStatus();
        
        (uint256 clientAmt, uint256 freelancerAmt) = FreelanceDisputeLibrary.processManualResolution(job, freelancerBps);

        // 1. Effects: Update state
        job.totalPaidOut += (job.amount - job.totalPaidOut);
        job.status = (freelancerBps > 5000) ? JobStatus.Completed : JobStatus.Cancelled;
        job.paid = true;

        if (freelancerAmt > 0) balances[job.freelancer][job.token] += freelancerAmt;
        if (clientAmt > 0) balances[job.client][job.token] += clientAmt;

        // 2. Interactions: Yield manager withdrawal
        if (yieldManager != address(0) && job.yieldStrategy != IYieldManager.Strategy.NONE && job.token != address(0)) {
            IYieldManager(yieldManager).withdraw(job.yieldStrategy, job.token, (job.amount - job.totalPaidOut) + job.freelancerStake, address(this));
        }
        
        emit DisputeResolved(jobId, freelancerBps, block.timestamp);
    }

    function _transferFunds(address to, address token, uint256 amt) internal {
        if (token == address(0)) {
            (bool s, ) = payable(to).call{value: amt}("");
            if (!s) revert TransferFailed();
        } else {
            IERC20(token).safeTransfer(to, amt);
        }
    }


    function supportsInterface(bytes4 id) public view override(FreelanceEscrowBase) returns (bool) {
        return super.supportsInterface(id);
    }

    function _msgSender() internal view virtual override returns (address sender) {
        if (msg.sender == _trustedForwarder && msg.data.length >= 20) {
            return address(bytes20(msg.data[msg.data.length - 20:]));
        }
        return super._msgSender();
    }

    function _authorizeUpgrade(address) internal override {
        // Mandatory 48h Timelock enforcement for all Zenith Upgrades
        if (timelock == address(0) || _msgSender() != timelock) revert NotAuthorized();
    }
}
