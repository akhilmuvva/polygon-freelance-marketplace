// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title PolyToken
 * @notice Governance and utility token with quadratic voting support
 * @dev ERC20Votes enables on-chain governance with delegation
 */
contract PolyToken is ERC20, ERC20Burnable, ERC20Permit, ERC20Votes, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    
    // Token distribution
    uint256 public constant COMMUNITY_ALLOCATION = 400_000_000 * 10**18; // 40%
    uint256 public constant TEAM_ALLOCATION = 200_000_000 * 10**18;      // 20%
    uint256 public constant TREASURY_ALLOCATION = 200_000_000 * 10**18;  // 20%
    uint256 public constant LIQUIDITY_ALLOCATION = 100_000_000 * 10**18; // 10%
    uint256 public constant REWARDS_ALLOCATION = 100_000_000 * 10**18;   // 10%
    
    // Vesting
    mapping(address => VestingSchedule) public vestingSchedules;
    
    struct VestingSchedule {
        uint256 totalAmount;
        uint256 releasedAmount;
        uint256 startTime;
        uint256 duration;
        uint256 cliff;
    }
    
    // Referral rewards
    mapping(address => uint256) public referralRewards;
    mapping(address => uint256) public claimedReferralRewards;
    
    // Creator royalties
    mapping(uint256 => address) public projectCreators;
    mapping(uint256 => uint256) public projectRoyalties;
    
    // Events
    event TokensMinted(address indexed to, uint256 amount, string reason);
    event VestingScheduleCreated(address indexed beneficiary, uint256 amount, uint256 duration);
    event TokensReleased(address indexed beneficiary, uint256 amount);
    event ReferralRewardClaimed(address indexed referrer, uint256 amount);
    event CreatorRoyaltyPaid(uint256 indexed projectId, address indexed creator, uint256 amount);

    constructor() 
        ERC20("PolyLance Token", "POLY") 
        ERC20Permit("PolyLance Token")
    {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        
        // Initial distribution for liquidity provision
        _mint(msg.sender, LIQUIDITY_ALLOCATION); 
    }

    /**
     * @notice Mint tokens with a reason (restricted to MINTER_ROLE).
     * @param to Recipient address.
     * @param amount Amount to mint.
     * @param reason Reason string for logging.
     */
    function mint(address to, uint256 amount, string memory reason) public onlyRole(MINTER_ROLE) {
        if (totalSupply() + amount > MAX_SUPPLY) revert("Exceeds max supply");
        _mint(to, amount);
        emit TokensMinted(to, amount, reason);
    }

    /**
     * @notice Simplified mint for compatibility with external contracts.
     * @param to Recipient address.
     * @param amount Amount to mint.
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        mint(to, amount, "Zenith Rewards");
    }

    /**
     * @notice Create vesting schedule
     * @param beneficiary Address to receive vested tokens
     * @param amount Total amount to vest
     * @param duration Vesting duration in seconds
     * @param cliff Cliff period in seconds
     */
    function createVestingSchedule(
        address beneficiary,
        uint256 amount,
        uint256 duration,
        uint256 cliff
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(vestingSchedules[beneficiary].totalAmount == 0, "Schedule exists");
        require(amount > 0, "Amount must be > 0");
        require(duration > 0, "Duration must be > 0");
        require(cliff <= duration, "Cliff > duration");
        
        vestingSchedules[beneficiary] = VestingSchedule({
            totalAmount: amount,
            releasedAmount: 0,
            startTime: block.timestamp,
            duration: duration,
            cliff: cliff
        });
        
        _mint(address(this), amount); // Mint to contract for vesting
        
        emit VestingScheduleCreated(beneficiary, amount, duration);
    }

    /**
     * @notice Release vested tokens
     */
    function releaseVestedTokens() external {
        VestingSchedule storage schedule = vestingSchedules[msg.sender];
        require(schedule.totalAmount > 0, "No vesting schedule");
        
        uint256 releasable = _releasableAmount(msg.sender);
        require(releasable > 0, "No tokens to release");
        
        schedule.releasedAmount += releasable;
        _transfer(address(this), msg.sender, releasable);
        
        emit TokensReleased(msg.sender, releasable);
    }

    /**
     * @notice Award referral rewards
     * @param referrer Address of referrer
     * @param amount Reward amount
     */
    function awardReferralReward(
        address referrer,
        uint256 amount
    ) external onlyRole(MINTER_ROLE) {
        referralRewards[referrer] += amount;
    }

    /**
     * @notice Claim referral rewards
     */
    function claimReferralRewards() external {
        uint256 pending = referralRewards[msg.sender] - claimedReferralRewards[msg.sender];
        require(pending > 0, "No rewards to claim");
        
        claimedReferralRewards[msg.sender] += pending;
        _mint(msg.sender, pending);
        
        emit ReferralRewardClaimed(msg.sender, pending);
    }

    /**
     * @notice Pay creator royalty
     * @param projectId Project identifier
     * @param creator Creator address
     * @param amount Royalty amount
     */
    function payCreatorRoyalty(
        uint256 projectId,
        address creator,
        uint256 amount
    ) external onlyRole(MINTER_ROLE) {
        projectCreators[projectId] = creator;
        projectRoyalties[projectId] += amount;
        
        _mint(creator, amount);
        
        emit CreatorRoyaltyPaid(projectId, creator, amount);
    }

    /**
     * @notice Calculate releasable vested tokens
     */
    function _releasableAmount(address beneficiary) internal view returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[beneficiary];
        
        if (block.timestamp < schedule.startTime + schedule.cliff) {
            return 0;
        }
        
        uint256 elapsed = block.timestamp - schedule.startTime;
        uint256 vested;
        
        if (elapsed >= schedule.duration) {
            vested = schedule.totalAmount;
        } else {
            vested = (schedule.totalAmount * elapsed) / schedule.duration;
        }
        
        return vested - schedule.releasedAmount;
    }

    /**
     * @notice Get pending referral rewards
     */
    function getPendingReferralRewards(address referrer) external view returns (uint256) {
        return referralRewards[referrer] - claimedReferralRewards[referrer];
    }

    /**
     * @notice Get releasable vested amount
     */
    function getReleasableAmount(address beneficiary) external view returns (uint256) {
        return _releasableAmount(beneficiary);
    }

    // Required overrides
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
