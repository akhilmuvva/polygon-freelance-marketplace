// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IRouterClient {
    error UnsupportedDestinationChain(uint64 destinationChainSelector);
    error InsufficientFeeTokenAmount();
    error InvalidMsgValue();

    struct EVM2AnyMessage {
        bytes receiver;
        bytes data;
        EVMTokenAmount[] tokenAmounts;
        address feeToken;
        bytes extraArgs;
    }

    struct EVMTokenAmount {
        address token;
        uint256 amount;
    }

    function getFee(
        uint64 destinationChainSelector,
        EVM2AnyMessage memory message
    ) external view returns (uint256 fee);

    function ccipSend(
        uint64 destinationChainSelector,
        EVM2AnyMessage memory message
    ) external payable returns (bytes32 messageId);

    function isChainSupported(uint64 chainSelector) external view returns (bool);
}
