// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {CCIPReceiver} from "./CCIPReceiver.sol";
import {Client} from "./Client.sol";
import {IRouterClient} from "./interfaces/IRouterClient.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title CCIPTokenBridge
 * @notice Enables cross-chain token transfers using Chainlink CCIP
 * @dev Supports native tokens, stablecoins, and custom PolyToken bridging
 */
contract CCIPTokenBridge is CCIPReceiver, AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    bytes32 public constant BRIDGE_ADMIN_ROLE = keccak256("BRIDGE_ADMIN_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    IRouterClient public immutable ccipRouter;

    // Chain selector => is supported
    mapping(uint64 => bool) public supportedChains;
    
    // Token => is whitelisted for bridging
    mapping(address => bool) public whitelistedTokens;
    
    // Token => chain selector => remote token address
    mapping(address => mapping(uint64 => address)) public tokenMappings;
    
    // Maximum amount that can be bridged per transaction
    mapping(address => uint256) public maxBridgeAmount;
    
    // Minimum amount that can be bridged per transaction
    mapping(address => uint256) public minBridgeAmount;
    
    // Track bridged amounts for analytics
    mapping(address => uint256) public totalBridged;
    
    // Message ID => is processed (for replay protection)
    mapping(bytes32 => bool) public processedMessages;

    struct BridgeRequest {
        address sender;
        address receiver;
        address token;
        uint256 amount;
        uint64 destinationChain;
        uint256 timestamp;
    }

    // Track pending bridge requests
    mapping(bytes32 => BridgeRequest) public pendingBridges;

    event TokensBridged(
        bytes32 indexed messageId,
        address indexed sender,
        address indexed receiver,
        address token,
        uint256 amount,
        uint64 destinationChain,
        uint256 fee
    );

    event TokensReceived(
        bytes32 indexed messageId,
        address indexed receiver,
        address token,
        uint256 amount,
        uint64 sourceChain
    );

    event ChainSupportUpdated(uint64 indexed chainSelector, bool supported);
    event TokenWhitelisted(address indexed token, bool whitelisted);
    event TokenMappingSet(address indexed localToken, uint64 indexed chainSelector, address remoteToken);
    event BridgeLimitsUpdated(address indexed token, uint256 minAmount, uint256 maxAmount);

    error UnsupportedChain(uint64 chainSelector);
    error TokenNotWhitelisted(address token);
    error AmountBelowMinimum(uint256 amount, uint256 minimum);
    error AmountExceedsMaximum(uint256 amount, uint256 maximum);
    error InsufficientFee(uint256 provided, uint256 required);
    error InvalidReceiver();
    error MessageAlreadyProcessed(bytes32 messageId);
    error InvalidTokenMapping();

    constructor(
        address _router,
        address _admin
    ) CCIPReceiver(_router) {
        ccipRouter = IRouterClient(_router);
        
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(BRIDGE_ADMIN_ROLE, _admin);
        _grantRole(PAUSER_ROLE, _admin);
    }

    /**
     * @notice Bridge tokens to another chain
     * @param destinationChainSelector The CCIP chain selector for the destination
     * @param receiver The address to receive tokens on the destination chain
     * @param token The token address to bridge
     * @param amount The amount to bridge
     * @return messageId The CCIP message ID
     */
    function bridgeTokens(
        uint64 destinationChainSelector,
        address receiver,
        address token,
        uint256 amount
    ) external payable whenNotPaused nonReentrant returns (bytes32 messageId) {
        if (!supportedChains[destinationChainSelector]) revert UnsupportedChain(destinationChainSelector);
        if (!whitelistedTokens[token]) revert TokenNotWhitelisted(token);
        if (receiver == address(0)) revert InvalidReceiver();
        if (amount < minBridgeAmount[token]) revert AmountBelowMinimum(amount, minBridgeAmount[token]);
        if (maxBridgeAmount[token] > 0 && amount > maxBridgeAmount[token]) {
            revert AmountExceedsMaximum(amount, maxBridgeAmount[token]);
        }

        // Transfer tokens from sender to this contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        // Build CCIP message
        address remoteToken = tokenMappings[token][destinationChainSelector];
        if (remoteToken == address(0)) revert InvalidTokenMapping();

        Client.EVMTokenAmount[] memory tokenAmounts = new Client.EVMTokenAmount[](1);
        tokenAmounts[0] = Client.EVMTokenAmount({
            token: token,
            amount: amount
        });

        // Encode receiver address and additional data
        bytes memory data = abi.encode(receiver, msg.sender, block.timestamp);

        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(address(this)), // Receiver is the bridge contract on destination
            data: data,
            tokenAmounts: tokenAmounts,
            feeToken: address(0), // Pay fees in native token
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: 200_000})
            )
        });

        // Calculate and validate fee
        uint256 fee = ccipRouter.getFee(destinationChainSelector, message);
        if (msg.value < fee) revert InsufficientFee(msg.value, fee);

        // Approve router to spend tokens
        IERC20(token).approve(address(ccipRouter), amount);

        // Send CCIP message
        messageId = ccipRouter.ccipSend{value: fee}(
            destinationChainSelector,
            message
        );

        // Store pending bridge request
        pendingBridges[messageId] = BridgeRequest({
            sender: msg.sender,
            receiver: receiver,
            token: token,
            amount: amount,
            destinationChain: destinationChainSelector,
            timestamp: block.timestamp
        });

        // Update analytics
        totalBridged[token] += amount;

        emit TokensBridged(
            messageId,
            msg.sender,
            receiver,
            token,
            amount,
            destinationChainSelector,
            fee
        );

        // Refund excess fee
        if (msg.value > fee) {
            payable(msg.sender).transfer(msg.value - fee);
        }

        return messageId;
    }

    /**
     * @notice Estimate the fee for bridging tokens
     * @param destinationChainSelector The destination chain selector
     * @param token The token to bridge
     * @param amount The amount to bridge
     * @return fee The estimated fee in native token
     */
    function estimateBridgeFee(
        uint64 destinationChainSelector,
        address token,
        uint256 amount
    ) external view returns (uint256 fee) {
        Client.EVMTokenAmount[] memory tokenAmounts = new Client.EVMTokenAmount[](1);
        tokenAmounts[0] = Client.EVMTokenAmount({
            token: token,
            amount: amount
        });

        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(address(this)),
            data: abi.encode(msg.sender, msg.sender, block.timestamp),
            tokenAmounts: tokenAmounts,
            feeToken: address(0),
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: 200_000})
            )
        });

        return ccipRouter.getFee(destinationChainSelector, message);
    }

    /**
     * @notice Internal function to handle incoming CCIP messages
     * @param message The CCIP message
     */
    function _ccipReceive(
        Client.Any2EVMMessage memory message
    ) internal override {
        bytes32 messageId = message.messageId;
        
        if (processedMessages[messageId]) revert MessageAlreadyProcessed(messageId);
        processedMessages[messageId] = true;

        // Decode receiver and sender
        (address receiver, address originalSender, ) = abi.decode(
            message.data,
            (address, address, uint256)
        );

        // Process received tokens
        for (uint256 i = 0; i < message.destTokenAmounts.length; i++) {
            address token = message.destTokenAmounts[i].token;
            uint256 amount = message.destTokenAmounts[i].amount;

            // Transfer tokens to receiver
            IERC20(token).safeTransfer(receiver, amount);

            emit TokensReceived(
                messageId,
                receiver,
                token,
                amount,
                message.sourceChainSelector
            );
        }
    }

    // ============ Admin Functions ============

    /**
     * @notice Add or remove support for a chain
     */
    function setSupportedChain(
        uint64 chainSelector,
        bool supported
    ) external onlyRole(BRIDGE_ADMIN_ROLE) {
        supportedChains[chainSelector] = supported;
        emit ChainSupportUpdated(chainSelector, supported);
    }

    /**
     * @notice Whitelist or delist a token for bridging
     */
    function setWhitelistedToken(
        address token,
        bool whitelisted
    ) external onlyRole(BRIDGE_ADMIN_ROLE) {
        whitelistedTokens[token] = whitelisted;
        emit TokenWhitelisted(token, whitelisted);
    }

    /**
     * @notice Set token mapping for cross-chain transfers
     */
    function setTokenMapping(
        address localToken,
        uint64 chainSelector,
        address remoteToken
    ) external onlyRole(BRIDGE_ADMIN_ROLE) {
        tokenMappings[localToken][chainSelector] = remoteToken;
        emit TokenMappingSet(localToken, chainSelector, remoteToken);
    }

    /**
     * @notice Set bridge limits for a token
     */
    function setBridgeLimits(
        address token,
        uint256 minAmount,
        uint256 maxAmount
    ) external onlyRole(BRIDGE_ADMIN_ROLE) {
        minBridgeAmount[token] = minAmount;
        maxBridgeAmount[token] = maxAmount;
        emit BridgeLimitsUpdated(token, minAmount, maxAmount);
    }

    /**
     * @notice Pause the bridge
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause the bridge
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @notice Withdraw stuck tokens (emergency only)
     */
    function emergencyWithdraw(
        address token,
        address to,
        uint256 amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        IERC20(token).safeTransfer(to, amount);
    }

    /**
     * @notice Withdraw stuck native tokens
     */
    function emergencyWithdrawNative(
        address payable to,
        uint256 amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        to.transfer(amount);
    }

    receive() external payable {}
}
