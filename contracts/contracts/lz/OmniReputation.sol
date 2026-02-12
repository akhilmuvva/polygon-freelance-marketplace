// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./OApp.sol";
import "./interfaces/ILayerZeroEndpointV2.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title OmniReputation
 * @notice Cross-chain reputation system using LayerZero V2
 * @dev Syncs reputation scores across all supported chains
 */
contract OmniReputation is OApp, AccessControl, ReentrancyGuard, Pausable {
    
    bytes32 public constant REPUTATION_MANAGER_ROLE = keccak256("REPUTATION_MANAGER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    ILayerZeroEndpointV2 public immutable lzEndpointV2;

    struct ReputationScore {
        uint256 totalScore;
        uint256 jobsCompleted;
        uint256 totalEarned;
        uint256 averageRating; // Scaled by 100 (e.g., 450 = 4.50 stars)
        uint256 disputesLost;
        uint256 lastUpdated;
        uint256 lastSyncedAt;
    }

    struct ChainReputation {
        uint32 chainId;
        uint256 score;
        uint256 jobsCompleted;
        uint256 lastSynced;
    }

    // User address => ReputationScore
    mapping(address => ReputationScore) public reputationScores;
    
    // User => chain EID => ChainReputation
    mapping(address => mapping(uint32 => ChainReputation)) public chainReputations;
    
    // User => total chains with activity
    mapping(address => uint32[]) public userActiveChains;
    
    // Minimum time between reputation syncs (anti-spam)
    uint256 public constant SYNC_COOLDOWN = 1 hours;
    
    // Minimum stake required to sync reputation
    uint256 public minStakeForSync = 0.01 ether;
    
    // Message nonce for replay protection
    mapping(bytes32 => bool) public processedMessages;

    enum MessageType {
        SYNC_REPUTATION,
        UPDATE_REPUTATION,
        AGGREGATE_REPUTATION
    }

    event ReputationUpdated(
        address indexed user,
        uint256 newScore,
        uint256 jobsCompleted,
        uint256 averageRating
    );

    event ReputationSynced(
        address indexed user,
        uint32 indexed dstEid,
        uint256 score,
        bytes32 guid
    );

    event ReputationReceived(
        address indexed user,
        uint32 indexed srcEid,
        uint256 score,
        uint256 jobsCompleted
    );

    event ReputationAggregated(
        address indexed user,
        uint256 totalScore,
        uint32 chainsCount
    );

    error InsufficientStake();
    error SyncCooldownActive(uint256 remainingTime);
    error MessageAlreadyProcessed(bytes32 guid);
    error InvalidChainId();
    error NoReputationToSync();

    constructor(
        address _endpoint,
        address _admin
    ) OApp(_admin) {
        lzEndpointV2 = ILayerZeroEndpointV2(_endpoint);
        lzEndpoint = _endpoint;
        
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(REPUTATION_MANAGER_ROLE, _admin);
        _grantRole(PAUSER_ROLE, _admin);
    }

    /**
     * @notice Update local reputation score
     * @param user The user address
     * @param scoreIncrease Amount to increase score
     * @param jobCompleted Whether a job was completed
     * @param rating Job rating (0-500, scaled by 100)
     * @param earned Amount earned in the job
     */
    function updateReputation(
        address user,
        uint256 scoreIncrease,
        bool jobCompleted,
        uint256 rating,
        uint256 earned
    ) external onlyRole(REPUTATION_MANAGER_ROLE) {
        ReputationScore storage rep = reputationScores[user];
        
        rep.totalScore += scoreIncrease;
        
        if (jobCompleted) {
            rep.jobsCompleted++;
            rep.totalEarned += earned;
            
            // Update average rating
            if (rating > 0) {
                uint256 totalRating = rep.averageRating * (rep.jobsCompleted - 1) + rating;
                rep.averageRating = totalRating / rep.jobsCompleted;
            }
        }
        
        rep.lastUpdated = block.timestamp;

        emit ReputationUpdated(
            user,
            rep.totalScore,
            rep.jobsCompleted,
            rep.averageRating
        );
    }

    /**
     * @notice Sync reputation to another chain
     * @param dstEid Destination chain endpoint ID
     * @param options LayerZero message options
     */
    function syncReputationToChain(
        uint32 dstEid,
        bytes calldata options
    ) external payable whenNotPaused nonReentrant {
        ReputationScore storage rep = reputationScores[msg.sender];
        
        if (rep.totalScore == 0) revert NoReputationToSync();
        
        // Check cooldown
        if (block.timestamp < rep.lastSyncedAt + SYNC_COOLDOWN) {
            revert SyncCooldownActive(rep.lastSyncedAt + SYNC_COOLDOWN - block.timestamp);
        }

        // Check stake requirement
        if (msg.value < minStakeForSync) revert InsufficientStake();

        // Encode message
        bytes memory message = abi.encode(
            MessageType.SYNC_REPUTATION,
            msg.sender,
            rep.totalScore,
            rep.jobsCompleted,
            rep.totalEarned,
            rep.averageRating,
            block.timestamp
        );

        // Get peer address
        bytes32 peer = peers[dstEid];
        if (peer == bytes32(0)) revert InvalidChainId();

        // Send LayerZero message
        ILayerZeroEndpointV2.MessagingParams memory params = ILayerZeroEndpointV2.MessagingParams({
            dstEid: dstEid,
            receiver: peer,
            message: message,
            options: options,
            payInLzToken: false
        });

        ILayerZeroEndpointV2.MessagingReceipt memory receipt = lzEndpointV2.send{
            value: msg.value - minStakeForSync
        }(params, payable(msg.sender));

        rep.lastSyncedAt = block.timestamp;

        emit ReputationSynced(
            msg.sender,
            dstEid,
            rep.totalScore,
            receipt.guid
        );
    }

    /**
     * @notice Aggregate reputation from all chains
     * @param user The user address
     * @param chainEids Array of chain EIDs to aggregate from
     */
    function aggregateReputation(
        address user,
        uint32[] calldata chainEids,
        bytes[] calldata options
    ) external payable whenNotPaused nonReentrant {
        require(chainEids.length == options.length, "Length mismatch");

        // Request reputation from each chain
        for (uint256 i = 0; i < chainEids.length; i++) {
            bytes memory message = abi.encode(
                MessageType.AGGREGATE_REPUTATION,
                user,
                msg.sender // requester
            );

            bytes32 peer = peers[chainEids[i]];
            if (peer == bytes32(0)) continue;

            ILayerZeroEndpointV2.MessagingParams memory params = ILayerZeroEndpointV2.MessagingParams({
                dstEid: chainEids[i],
                receiver: peer,
                message: message,
                options: options[i],
                payInLzToken: false
            });

            // Split fee evenly
            uint256 feePerChain = msg.value / chainEids.length;
            lzEndpointV2.send{value: feePerChain}(params, payable(msg.sender));
        }
    }

    /**
     * @notice Handle incoming LayerZero messages
     */
    function _lzReceive(
        uint32 _srcEid,
        bytes32 _guid,
        bytes memory _message,
        address _executor,
        bytes memory _extraData
    ) internal virtual override {
        if (processedMessages[_guid]) revert MessageAlreadyProcessed(_guid);
        processedMessages[_guid] = true;

        MessageType msgType = abi.decode(_message, (MessageType));

        if (msgType == MessageType.SYNC_REPUTATION) {
            _handleSyncReputation(_srcEid, _message);
        } else if (msgType == MessageType.UPDATE_REPUTATION) {
            _handleUpdateReputation(_srcEid, _message);
        } else if (msgType == MessageType.AGGREGATE_REPUTATION) {
            _handleAggregateRequest(_srcEid, _message);
        }
    }

    function _handleSyncReputation(uint32 srcEid, bytes memory message) internal {
        (
            ,
            address user,
            uint256 score,
            uint256 jobsCompleted,
            uint256 totalEarned,
            uint256 averageRating,
            uint256 timestamp
        ) = abi.decode(
            message,
            (MessageType, address, uint256, uint256, uint256, uint256, uint256)
        );

        // Update chain-specific reputation
        ChainReputation storage chainRep = chainReputations[user][srcEid];
        chainRep.chainId = srcEid;
        chainRep.score = score;
        chainRep.jobsCompleted = jobsCompleted;
        chainRep.lastSynced = timestamp;

        // Add to active chains if not already present
        bool chainExists = false;
        uint32[] storage activeChains = userActiveChains[user];
        for (uint256 i = 0; i < activeChains.length; i++) {
            if (activeChains[i] == srcEid) {
                chainExists = true;
                break;
            }
        }
        if (!chainExists) {
            activeChains.push(srcEid);
        }

        // Update aggregated reputation
        ReputationScore storage rep = reputationScores[user];
        rep.totalScore = _calculateAggregatedScore(user);
        rep.lastUpdated = block.timestamp;

        emit ReputationReceived(user, srcEid, score, jobsCompleted);
    }

    function _handleUpdateReputation(uint32 srcEid, bytes memory message) internal {
        // Handle reputation updates from remote chains
        _handleSyncReputation(srcEid, message);
    }

    function _handleAggregateRequest(uint32 srcEid, bytes memory message) internal {
        (, address user, address requester) = abi.decode(
            message,
            (MessageType, address, address)
        );

        // Send back current reputation
        ReputationScore storage rep = reputationScores[user];
        
        bytes memory responseMessage = abi.encode(
            MessageType.SYNC_REPUTATION,
            user,
            rep.totalScore,
            rep.jobsCompleted,
            rep.totalEarned,
            rep.averageRating,
            block.timestamp
        );

        // Note: In production, this would need proper fee handling
        // For now, we just emit an event
        emit ReputationSynced(user, srcEid, rep.totalScore, bytes32(0));
    }

    /**
     * @notice Calculate aggregated reputation score across all chains
     */
    function _calculateAggregatedScore(address user) internal view returns (uint256) {
        uint32[] storage activeChains = userActiveChains[user];
        uint256 totalScore = 0;
        uint256 totalJobs = 0;

        for (uint256 i = 0; i < activeChains.length; i++) {
            ChainReputation storage chainRep = chainReputations[user][activeChains[i]];
            totalScore += chainRep.score;
            totalJobs += chainRep.jobsCompleted;
        }

        // Weight by number of jobs (more jobs = more reliable score)
        if (totalJobs > 0) {
            return totalScore * (100 + totalJobs) / 100;
        }

        return totalScore;
    }

    /**
     * @notice Get user's reputation across all chains
     */
    function getAggregatedReputation(
        address user
    ) external view returns (
        uint256 totalScore,
        uint256 totalJobs,
        uint256 totalEarned,
        uint256 averageRating,
        uint32 activeChainCount
    ) {
        ReputationScore storage rep = reputationScores[user];
        uint32[] storage activeChains = userActiveChains[user];

        uint256 aggregatedJobs = rep.jobsCompleted;
        uint256 aggregatedEarned = rep.totalEarned;

        for (uint256 i = 0; i < activeChains.length; i++) {
            ChainReputation storage chainRep = chainReputations[user][activeChains[i]];
            aggregatedJobs += chainRep.jobsCompleted;
        }

        return (
            _calculateAggregatedScore(user),
            aggregatedJobs,
            aggregatedEarned,
            rep.averageRating,
            uint32(activeChains.length)
        );
    }

    /**
     * @notice Get reputation on a specific chain
     */
    function getChainReputation(
        address user,
        uint32 chainEid
    ) external view returns (ChainReputation memory) {
        return chainReputations[user][chainEid];
    }

    /**
     * @notice Estimate fee for syncing reputation
     */
    function estimateSyncFee(
        uint32 dstEid,
        bytes calldata options
    ) external view returns (uint256 nativeFee, uint256 lzTokenFee) {
        bytes memory message = abi.encode(
            MessageType.SYNC_REPUTATION,
            msg.sender,
            uint256(0),
            uint256(0),
            uint256(0),
            uint256(0),
            block.timestamp
        );

        bytes32 peer = peers[dstEid];

        ILayerZeroEndpointV2.MessagingParams memory params = ILayerZeroEndpointV2.MessagingParams({
            dstEid: dstEid,
            receiver: peer,
            message: message,
            options: options,
            payInLzToken: false
        });

        ILayerZeroEndpointV2.MessagingFee memory fee = lzEndpointV2.quote(params, address(this));
        
        return (fee.nativeFee + minStakeForSync, fee.lzTokenFee);
    }

    // ============ Admin Functions ============

    function setMinStakeForSync(uint256 _minStake) external onlyRole(DEFAULT_ADMIN_ROLE) {
        minStakeForSync = _minStake;
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function withdrawStake(address payable to, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        to.transfer(amount);
    }

    receive() external payable {}
}
