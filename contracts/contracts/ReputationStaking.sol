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
