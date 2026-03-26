// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ReputationStaking
 * @notice Implements "Stake-to-Challenge" economic security for PolyLance Zenith.
 * Provides "Economic Teeth" to prevent spam disputes and sybil attacks.
 */
contract ReputationStaking is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Stake {
        uint256 amount;
        uint256 timestamp;
        bool active;
    }

    mapping(address => Stake) public userStakes;
    address public safetyModule;
    IERC20 public stakingToken;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event Slashed(address indexed user, uint256 amount, address indexed destination);

    constructor(address _stakingToken, address _safetyModule, address _owner) Ownable(_owner) {
        stakingToken = IERC20(_stakingToken);
        safetyModule = _safetyModule;
    }

    /**
     * @notice Returns the "Gravitational Reputation" of a user based on their stake.
     * Users staking the native POL token receive a 1.5x reputation boost.
     * @param _user The address of the freelancer or client.
     */
    function getEffectiveReputation(address _user) public view returns (uint256) {
        uint256 baseStake = userStakes[_user].amount;
        if (!userStakes[_user].active) return 0;

        // Polygon Mainnet POL Address: 0x455E53Cbb86018ac2b8092FDcd39D8444FFF5A44
        // If the staking token is the native POL, grant a 1.5x "Gravitational Boost"
        if (address(stakingToken) == 0x455E53Cbb86018ac2b8092FDcd39D8444FFF5A44) {
            return (baseStake * 15) / 10;
        }

        return baseStake;
    }

    /**
     * @notice Returns the Reward Tier for a user based on their POL stake.
     * Tier 1: > 1,000 POL -> 10% Fee Discount
     * Tier 2: > 5,000 POL -> 25% Fee Discount + 5% Yield Boost
     * Tier 3: > 10,000 POL -> 50% Fee Discount + 15% Yield Boost + "Zenith Elite" Status
     */
    function getRewardTier(address _user) public view returns (uint8 tier, uint256 feeDiscountBps, uint256 yieldBoostBps) {
        uint256 stakeAmount = userStakes[_user].amount;
        // Only applies if staking the native POL token
        if (address(stakingToken) != 0x455E53Cbb86018ac2b8092FDcd39D8444FFF5A44) return (0, 0, 0);

        if (stakeAmount >= 10000 * 1e18) {
            return (3, 5000, 1500); // 50% discount, 15% boost
        } else if (stakeAmount >= 5000 * 1e18) {
            return (2, 2500, 500);  // 25% discount, 5% boost
        } else if (stakeAmount >= 1000 * 1e18) {
            return (1, 1000, 0);    // 10% discount, 0% boost
        }
        
        return (0, 0, 0);
    }

    /**
     * @notice Stakes tokens to enable challenging behavior or as a prerequisite for elite access.
     */
    function stake(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Amount must be > 0");
        stakingToken.safeTransferFrom(msg.sender, address(this), _amount);
        
        userStakes[msg.sender].amount += _amount;
        userStakes[msg.sender].timestamp = block.timestamp;
        userStakes[msg.sender].active = true;

        emit Staked(msg.sender, _amount);
    }

    /**
     * @notice Unstakes tokens.
     */
    function unstake(uint256 _amount) external nonReentrant {
        require(userStakes[msg.sender].amount >= _amount, "Insufficient stake");
        
        userStakes[msg.sender].amount -= _amount;
        if (userStakes[msg.sender].amount == 0) {
            userStakes[msg.sender].active = false;
        }

        stakingToken.safeTransfer(msg.sender, _amount);
        emit Unstaked(msg.sender, _amount);
    }

    /**
     * @notice Slash a malicious actor's stake to the Safety Module.
     * @dev Only callable by the Antigravity Agent or Protocol Owner upon negative arbitration.
     */
    function slash(address _user, uint256 _amount) external onlyOwner {
        require(userStakes[_user].amount >= _amount, "Insufficient user stake");
        
        userStakes[_user].amount -= _amount;
        stakingToken.safeTransfer(safetyModule, _amount);
        
        emit Slashed(_user, _amount, safetyModule);
    }

    /**
     * @notice Set a new Safety Module address.
     */
    function setSafetyModule(address _module) external onlyOwner {
        require(_module != address(0), "Invalid address");
        safetyModule = _module;
    }
}
