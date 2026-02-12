// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {CCIPReceiver} from "./CCIPReceiver.sol";
import {Client} from "./Client.sol";
import {IRouterClient} from "./interfaces/IRouterClient.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title CrossChainEscrowManager
 * @notice Manages job escrows across multiple chains using Chainlink CCIP
 * @dev Coordinates with FreelanceEscrow contracts on different chains
 */
contract CrossChainEscrowManager is CCIPReceiver, AccessControl, ReentrancyGuard, Pausable {
    
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    IRouterClient public immutable ccipRouter;

    enum JobStatus {
        None,
        Created,
        Accepted,
        Ongoing,
        Submitted,
        Completed,
        Disputed,
        Cancelled
    }

    enum MessageType {
        CREATE_JOB,
        ACCEPT_JOB,
        SUBMIT_WORK,
        RELEASE_PAYMENT,
        INITIATE_DISPUTE,
        RESOLVE_DISPUTE,
        CANCEL_JOB
    }

    struct CrossChainJob {
        uint256 localJobId;
        uint256 remoteJobId;
        uint64 sourceChain;
        uint64 destinationChain;
        address client;
        address freelancer;
        uint256 amount;
        address token;
        JobStatus status;
        uint256 createdAt;
        bytes32 lastMessageId;
    }

    // Local job ID => CrossChainJob
    mapping(uint256 => CrossChainJob) public crossChainJobs;
    
    // Message ID => is processed
    mapping(bytes32 => bool) public processedMessages;
    
    // Chain selector => remote escrow manager address
    mapping(uint64 => address) public remoteManagers;
    
    // Chain selector => is supported
    mapping(uint64 => bool) public supportedChains;
    
    // User => chain => job IDs
    mapping(address => mapping(uint64 => uint256[])) public userJobsByChain;

    uint256 public nextJobId = 1;

    event CrossChainJobCreated(
        uint256 indexed localJobId,
        uint64 indexed destinationChain,
        address indexed client,
        uint256 amount,
        bytes32 messageId
    );

    event CrossChainJobAccepted(
        uint256 indexed localJobId,
        address indexed freelancer,
        bytes32 messageId
    );

    event CrossChainPaymentReleased(
        uint256 indexed localJobId,
        uint256 amount,
        bytes32 messageId
    );

    event CrossChainJobCancelled(
        uint256 indexed localJobId,
        bytes32 messageId
    );

    event CrossChainDisputeInitiated(
        uint256 indexed localJobId,
        bytes32 messageId
    );

    event MessageReceived(
        bytes32 indexed messageId,
        uint64 indexed sourceChain,
        MessageType messageType
    );

    event RemoteManagerSet(uint64 indexed chainSelector, address manager);

    error UnsupportedChain(uint64 chainSelector);
    error JobNotFound(uint256 jobId);
    error InvalidStatus(JobStatus current, JobStatus required);
    error NotAuthorized();
    error MessageAlreadyProcessed(bytes32 messageId);
    error InvalidRemoteManager();

    constructor(
        address _router,
        address _admin
    ) CCIPReceiver(_router) {
        ccipRouter = IRouterClient(_router);
        
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(MANAGER_ROLE, _admin);
        _grantRole(PAUSER_ROLE, _admin);
    }

    /**
     * @notice Create a cross-chain job
     * @param destinationChain The chain where the job will be executed
     * @param freelancer The freelancer address (can be zero for open jobs)
     * @param amount The job payment amount
     * @param token The payment token address
     * @param jobData Additional job data (IPFS hash, milestones, etc.)
     * @return localJobId The local job ID
     * @return messageId The CCIP message ID
     */
    function createCrossChainJob(
        uint64 destinationChain,
        address freelancer,
        uint256 amount,
        address token,
        bytes calldata jobData
    ) external payable whenNotPaused nonReentrant returns (uint256 localJobId, bytes32 messageId) {
        if (!supportedChains[destinationChain]) revert UnsupportedChain(destinationChain);
        if (remoteManagers[destinationChain] == address(0)) revert InvalidRemoteManager();

        localJobId = nextJobId++;

        // Create local job record
        CrossChainJob storage job = crossChainJobs[localJobId];
        job.localJobId = localJobId;
        job.sourceChain = uint64(block.chainid);
        job.destinationChain = destinationChain;
        job.client = msg.sender;
        job.freelancer = freelancer;
        job.amount = amount;
        job.token = token;
        job.status = JobStatus.Created;
        job.createdAt = block.timestamp;

        // Encode message
        bytes memory data = abi.encode(
            MessageType.CREATE_JOB,
            localJobId,
            msg.sender,
            freelancer,
            amount,
            token,
            jobData
        );

        // Send CCIP message
        messageId = _sendMessage(destinationChain, data);
        job.lastMessageId = messageId;

        // Track user jobs
        userJobsByChain[msg.sender][destinationChain].push(localJobId);

        emit CrossChainJobCreated(
            localJobId,
            destinationChain,
            msg.sender,
            amount,
            messageId
        );

        return (localJobId, messageId);
    }

    /**
     * @notice Accept a cross-chain job (freelancer action)
     * @param localJobId The local job ID
     */
    function acceptCrossChainJob(
        uint256 localJobId
    ) external payable whenNotPaused nonReentrant returns (bytes32 messageId) {
        CrossChainJob storage job = crossChainJobs[localJobId];
        if (job.localJobId == 0) revert JobNotFound(localJobId);
        if (job.status != JobStatus.Created) revert InvalidStatus(job.status, JobStatus.Created);
        if (job.freelancer != address(0) && job.freelancer != msg.sender) revert NotAuthorized();

        job.status = JobStatus.Accepted;
        job.freelancer = msg.sender;

        // Send acceptance message to source chain
        bytes memory data = abi.encode(
            MessageType.ACCEPT_JOB,
            localJobId,
            job.remoteJobId,
            msg.sender
        );

        messageId = _sendMessage(job.sourceChain, data);
        job.lastMessageId = messageId;

        emit CrossChainJobAccepted(localJobId, msg.sender, messageId);

        return messageId;
    }

    /**
     * @notice Release payment for a cross-chain job
     * @param localJobId The local job ID
     */
    function releaseCrossChainPayment(
        uint256 localJobId
    ) external payable whenNotPaused nonReentrant returns (bytes32 messageId) {
        CrossChainJob storage job = crossChainJobs[localJobId];
        if (job.localJobId == 0) revert JobNotFound(localJobId);
        if (msg.sender != job.client) revert NotAuthorized();
        if (job.status != JobStatus.Submitted && job.status != JobStatus.Ongoing) {
            revert InvalidStatus(job.status, JobStatus.Submitted);
        }

        job.status = JobStatus.Completed;

        // Send release message to destination chain
        bytes memory data = abi.encode(
            MessageType.RELEASE_PAYMENT,
            localJobId,
            job.remoteJobId,
            job.freelancer,
            job.amount
        );

        messageId = _sendMessage(job.destinationChain, data);
        job.lastMessageId = messageId;

        emit CrossChainPaymentReleased(localJobId, job.amount, messageId);

        return messageId;
    }

    /**
     * @notice Cancel a cross-chain job
     * @param localJobId The local job ID
     */
    function cancelCrossChainJob(
        uint256 localJobId
    ) external payable whenNotPaused nonReentrant returns (bytes32 messageId) {
        CrossChainJob storage job = crossChainJobs[localJobId];
        if (job.localJobId == 0) revert JobNotFound(localJobId);
        if (msg.sender != job.client) revert NotAuthorized();
        if (job.status != JobStatus.Created && job.status != JobStatus.Accepted) {
            revert InvalidStatus(job.status, JobStatus.Created);
        }

        job.status = JobStatus.Cancelled;

        bytes memory data = abi.encode(
            MessageType.CANCEL_JOB,
            localJobId,
            job.remoteJobId
        );

        messageId = _sendMessage(job.destinationChain, data);
        job.lastMessageId = messageId;

        emit CrossChainJobCancelled(localJobId, messageId);

        return messageId;
    }

    /**
     * @notice Initiate a dispute for a cross-chain job
     * @param localJobId The local job ID
     * @param evidence IPFS hash of dispute evidence
     */
    function initiateCrossChainDispute(
        uint256 localJobId,
        string calldata evidence
    ) external payable whenNotPaused nonReentrant returns (bytes32 messageId) {
        CrossChainJob storage job = crossChainJobs[localJobId];
        if (job.localJobId == 0) revert JobNotFound(localJobId);
        if (msg.sender != job.client && msg.sender != job.freelancer) revert NotAuthorized();

        job.status = JobStatus.Disputed;

        bytes memory data = abi.encode(
            MessageType.INITIATE_DISPUTE,
            localJobId,
            job.remoteJobId,
            msg.sender,
            evidence
        );

        messageId = _sendMessage(job.destinationChain, data);
        job.lastMessageId = messageId;

        emit CrossChainDisputeInitiated(localJobId, messageId);

        return messageId;
    }

    /**
     * @notice Internal function to send CCIP messages
     */
    function _sendMessage(
        uint64 destinationChain,
        bytes memory data
    ) internal returns (bytes32 messageId) {
        address remoteManager = remoteManagers[destinationChain];

        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(remoteManager),
            data: data,
            tokenAmounts: new Client.EVMTokenAmount[](0),
            feeToken: address(0),
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: 500_000})
            )
        });

        uint256 fee = ccipRouter.getFee(destinationChain, message);
        require(msg.value >= fee, "Insufficient fee");

        messageId = ccipRouter.ccipSend{value: fee}(destinationChain, message);

        // Refund excess
        if (msg.value > fee) {
            payable(msg.sender).transfer(msg.value - fee);
        }

        return messageId;
    }

    /**
     * @notice Handle incoming CCIP messages
     */
    function _ccipReceive(
        Client.Any2EVMMessage memory message
    ) internal override {
        bytes32 messageId = message.messageId;
        
        if (processedMessages[messageId]) revert MessageAlreadyProcessed(messageId);
        processedMessages[messageId] = true;

        // Decode message type
        MessageType msgType = abi.decode(message.data, (MessageType));

        if (msgType == MessageType.CREATE_JOB) {
            _handleCreateJob(message);
        } else if (msgType == MessageType.ACCEPT_JOB) {
            _handleAcceptJob(message);
        } else if (msgType == MessageType.RELEASE_PAYMENT) {
            _handleReleasePayment(message);
        } else if (msgType == MessageType.CANCEL_JOB) {
            _handleCancelJob(message);
        } else if (msgType == MessageType.INITIATE_DISPUTE) {
            _handleInitiateDispute(message);
        }

        emit MessageReceived(messageId, message.sourceChainSelector, msgType);
    }

    function _handleCreateJob(Client.Any2EVMMessage memory message) internal {
        (
            ,
            uint256 remoteJobId,
            address client,
            address freelancer,
            uint256 amount,
            address token,
            bytes memory jobData
        ) = abi.decode(
            message.data,
            (MessageType, uint256, address, address, uint256, address, bytes)
        );

        uint256 localJobId = nextJobId++;
        CrossChainJob storage job = crossChainJobs[localJobId];
        job.localJobId = localJobId;
        job.remoteJobId = remoteJobId;
        job.sourceChain = message.sourceChainSelector;
        job.destinationChain = uint64(block.chainid);
        job.client = client;
        job.freelancer = freelancer;
        job.amount = amount;
        job.token = token;
        job.status = JobStatus.Created;
        job.createdAt = block.timestamp;
        job.lastMessageId = message.messageId;
    }

    function _handleAcceptJob(Client.Any2EVMMessage memory message) internal {
        (, uint256 localJobId, uint256 remoteJobId, address freelancer) = abi.decode(
            message.data,
            (MessageType, uint256, uint256, address)
        );

        CrossChainJob storage job = crossChainJobs[localJobId];
        if (job.localJobId != 0) {
            job.status = JobStatus.Accepted;
            job.freelancer = freelancer;
            job.remoteJobId = remoteJobId;
        }
    }

    function _handleReleasePayment(Client.Any2EVMMessage memory message) internal {
        (, uint256 localJobId, , address freelancer, uint256 amount) = abi.decode(
            message.data,
            (MessageType, uint256, uint256, address, uint256)
        );

        CrossChainJob storage job = crossChainJobs[localJobId];
        if (job.localJobId != 0) {
            job.status = JobStatus.Completed;
        }
    }

    function _handleCancelJob(Client.Any2EVMMessage memory message) internal {
        (, uint256 localJobId, ) = abi.decode(
            message.data,
            (MessageType, uint256, uint256)
        );

        CrossChainJob storage job = crossChainJobs[localJobId];
        if (job.localJobId != 0) {
            job.status = JobStatus.Cancelled;
        }
    }

    function _handleInitiateDispute(Client.Any2EVMMessage memory message) internal {
        (, uint256 localJobId, , address initiator, string memory evidence) = abi.decode(
            message.data,
            (MessageType, uint256, uint256, address, string)
        );

        CrossChainJob storage job = crossChainJobs[localJobId];
        if (job.localJobId != 0) {
            job.status = JobStatus.Disputed;
        }
    }

    /**
     * @notice Estimate fee for cross-chain message
     */
    function estimateMessageFee(
        uint64 destinationChain,
        bytes calldata data
    ) external view returns (uint256 fee) {
        address remoteManager = remoteManagers[destinationChain];

        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(remoteManager),
            data: data,
            tokenAmounts: new Client.EVMTokenAmount[](0),
            feeToken: address(0),
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: 500_000})
            )
        });

        return ccipRouter.getFee(destinationChain, message);
    }

    /**
     * @notice Get user's jobs on a specific chain
     */
    function getUserJobsByChain(
        address user,
        uint64 chainSelector
    ) external view returns (uint256[] memory) {
        return userJobsByChain[user][chainSelector];
    }

    // ============ Admin Functions ============

    function setRemoteManager(
        uint64 chainSelector,
        address manager
    ) external onlyRole(MANAGER_ROLE) {
        remoteManagers[chainSelector] = manager;
        emit RemoteManagerSet(chainSelector, manager);
    }

    function setSupportedChain(
        uint64 chainSelector,
        bool supported
    ) external onlyRole(MANAGER_ROLE) {
        supportedChains[chainSelector] = supported;
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    receive() external payable {}
}
