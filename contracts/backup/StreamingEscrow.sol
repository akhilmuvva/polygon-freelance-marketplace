// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./FreelancerReputation.sol";

/**
 * @title StreamingEscrow
 * @author Akhil Muvva
 * @notice Continuous Settlement Escrow for real-time payments on high-performance chains.
 * Funds flow from employer to freelancer based on elapsed time.
 */
contract StreamingEscrow is ReentrancyGuard, AccessControl, Pausable {
    using SafeERC20 for IERC20;

    bytes32 public constant ARBITRATOR_ROLE = keccak256("ARBITRATOR_ROLE");

    struct Stream {
        address sender;
        address recipient;
        uint256 deposit;
        address tokenAddress;
        uint256 startTime;
        uint256 stopTime;
        uint256 ratePerSecond;
        uint256 remainingBalance;
        uint256 lastUpdateTimestamp;
        uint256 totalPausedDuration;
        bool isPaused;
        bool isDisputed;
    }

    uint256 public nextStreamId = 1;
    mapping(uint256 => Stream) public streams;

    AntigravityReputation public reputationContract;
    
    address public feeCollector;
    
    // Fee configurations
    uint256 public constant BASE_FEE_BPS = 500; // 5%
    uint256 public constant MIN_FEE_BPS = 100;  // 1%
    uint256 public constant KARMA_THRESHOLD = 1000; // Karma needed for max discount

    event StreamCreated(uint256 indexed streamId, address indexed sender, address indexed recipient, uint256 deposit, address token, uint256 startTime, uint256 stopTime);
    event Withdrawal(uint256 indexed streamId, uint256 amount);
    event StreamPaused(uint256 indexed streamId, address by);
    event StreamResumed(uint256 indexed streamId, address by);
    event StreamDisputed(uint256 indexed streamId, address by);
    event StreamResolved(uint256 indexed streamId, uint256 senderAmount, uint256 recipientAmount);
    event FeeCollectorUpdated(address indexed newCollector);

    error StreamDoesNotExist();
    error Unauthorized();
    error StreamPausedOrDisputed();
    error InvalidDeposit();
    error InvalidTimeRange();
    error InsufficientBalance();

    constructor(address _reputationContract, address admin, address _feeCollector) {
        if (_reputationContract == address(0) || admin == address(0) || _feeCollector == address(0)) revert Unauthorized();
        reputationContract = AntigravityReputation(_reputationContract);
        feeCollector = _feeCollector;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ARBITRATOR_ROLE, admin);
    }

    /**
     * @notice Updates the address that receives platform fees.
     */
    function setFeeCollector(address _feeCollector) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_feeCollector == address(0)) revert Unauthorized();
        feeCollector = _feeCollector;
        emit FeeCollectorUpdated(_feeCollector);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @notice Creates a new payment stream.
     */
    function createStream(
        address recipient,
        uint256 deposit,
        address tokenAddress,
        uint256 startTime,
        uint256 stopTime
    ) external whenNotPaused nonReentrant returns (uint256) {
        if (recipient == address(0) || tokenAddress == address(0)) revert Unauthorized();
        if (deposit == 0) revert InvalidDeposit();
        if (startTime < block.timestamp) startTime = block.timestamp;
        if (stopTime <= startTime) revert InvalidTimeRange();

        uint256 duration = stopTime - startTime;
        if (deposit < duration) revert InvalidDeposit();

        // Maintain high precision for rate calculation
        uint256 ratePerSecond = (deposit * 1e18) / duration;

        IERC20(tokenAddress).safeTransferFrom(msg.sender, address(this), deposit);

        uint256 streamId = nextStreamId++;
        streams[streamId] = Stream({
            sender: msg.sender,
            recipient: recipient,
            deposit: deposit,
            tokenAddress: tokenAddress,
            startTime: startTime,
            stopTime: stopTime,
            ratePerSecond: ratePerSecond,
            remainingBalance: deposit,
            lastUpdateTimestamp: startTime,
            totalPausedDuration: 0,
            isPaused: false,
            isDisputed: false
        });

        emit StreamCreated(streamId, msg.sender, recipient, deposit, tokenAddress, startTime, stopTime);
        return streamId;
    }

    /**
     * @notice Calculates the amount currently available for withdrawal.
     */
    function balanceOf(uint256 streamId) public view returns (uint256 recipientBalance, uint256 senderBalance) {
        if (streamId == 0 || streamId >= nextStreamId) return (0, 0);
        Stream memory stream = streams[streamId];

        uint256 timeElapsed = _calculateTimeElapsed(stream);
        uint256 flowableAmount = (timeElapsed * stream.ratePerSecond) / 1e18;

        if (flowableAmount > stream.deposit) flowableAmount = stream.deposit;

        recipientBalance = flowableAmount - (stream.deposit - stream.remainingBalance);
        senderBalance = stream.remainingBalance - recipientBalance;
    }

    /**
     * @notice Withdraws available funds from the stream.
     */
    function withdrawFromStream(uint256 streamId, uint256 amount) external whenNotPaused nonReentrant {
        if (streamId == 0 || streamId >= nextStreamId) revert StreamDoesNotExist();
        Stream storage stream = streams[streamId];
        if (stream.isPaused || stream.isDisputed) revert StreamPausedOrDisputed();
        
        (uint256 available, ) = balanceOf(streamId);
        if (amount > available) revert InsufficientBalance();

        stream.remainingBalance -= amount;
        stream.lastUpdateTimestamp = block.timestamp > stream.stopTime ? stream.stopTime : block.timestamp;

        uint256 fee = _calculateFee(stream.recipient, amount);
        uint256 netAmount = amount - fee;

        IERC20(stream.tokenAddress).safeTransfer(stream.recipient, netAmount);
        if (fee > 0) {
            IERC20(stream.tokenAddress).safeTransfer(feeCollector, fee);
        }

        emit Withdrawal(streamId, amount);
    }

    /**
     * @notice Pauses the stream in case of a dispute.
     */
    function pauseStream(uint256 streamId) external {
        Stream storage stream = streams[streamId];
        if (msg.sender != stream.sender && msg.sender != stream.recipient) revert Unauthorized();
        if (stream.isPaused) revert StreamPausedOrDisputed();
        
        stream.lastUpdateTimestamp = block.timestamp > stream.stopTime ? stream.stopTime : block.timestamp;
        stream.isPaused = true;
        stream.isDisputed = true;
        
        emit StreamPaused(streamId, msg.sender);
        emit StreamDisputed(streamId, msg.sender);
    }

    /**
     * @notice Resumes a paused stream (only if not disputed or by arbitrator).
     */
    function resumeStream(uint256 streamId) external {
        Stream storage stream = streams[streamId];
        if (!hasRole(ARBITRATOR_ROLE, msg.sender)) revert Unauthorized();
        if (!stream.isPaused) return;

        uint256 pauseDuration = block.timestamp - stream.lastUpdateTimestamp;
        stream.totalPausedDuration += pauseDuration;
        
        stream.isPaused = false;
        stream.isDisputed = false;
        
        emit StreamResumed(streamId, msg.sender);
    }

    /**
     * @notice Arbitrator resolves a dispute.
     */
    function resolveDispute(uint256 streamId, uint256 senderAmount, uint256 recipientAmount) external onlyRole(ARBITRATOR_ROLE) nonReentrant {
        if (streamId == 0 || streamId >= nextStreamId) revert StreamDoesNotExist();
        Stream storage stream = streams[streamId];
        if (senderAmount + recipientAmount > stream.remainingBalance) revert InsufficientBalance();

        address sender = stream.sender;
        address recipient = stream.recipient;
        address token = stream.tokenAddress;

        // Effects
        stream.remainingBalance -= (senderAmount + recipientAmount);
        delete streams[streamId]; 

        // Interactions
        IERC20(token).safeTransfer(sender, senderAmount);
        IERC20(token).safeTransfer(recipient, recipientAmount);

        emit StreamResolved(streamId, senderAmount, recipientAmount);
    }

    function _calculateTimeElapsed(Stream memory stream) internal view returns (uint256) {
        uint256 currentTime = block.timestamp;
        if (currentTime <= stream.startTime) return 0;
        
        uint256 effectiveEnd = currentTime > (stream.stopTime + stream.totalPausedDuration) ? (stream.stopTime + stream.totalPausedDuration) : currentTime;
        
        if (stream.isPaused) {
            effectiveEnd = stream.lastUpdateTimestamp;
        }
        
        uint256 durationSinceStart = effectiveEnd - stream.startTime;
        if (durationSinceStart <= stream.totalPausedDuration) return 0;
        
        return durationSinceStart - stream.totalPausedDuration;
    }

    function _calculateFee(address freelancer, uint256 amount) internal view returns (uint256) {
        // IDs are categories. Let's assume ID 0 is general "Karma"
        uint256 karma = reputationContract.balanceOf(freelancer, reputationContract.KARMA_ID());
        
        uint256 feeBps = BASE_FEE_BPS;
        if (karma > 0) {
            uint256 discount = (BASE_FEE_BPS - MIN_FEE_BPS) * karma / KARMA_THRESHOLD;
            if (discount > (BASE_FEE_BPS - MIN_FEE_BPS)) {
                discount = BASE_FEE_BPS - MIN_FEE_BPS;
            }
            feeBps = BASE_FEE_BPS - discount;
        }
        
        return (amount * feeBps) / 10000;
    }
}
