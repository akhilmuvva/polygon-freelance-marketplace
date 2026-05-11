// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {OwnerIsCreator} from "@chainlink/contracts-ccip/src/v0.8/shared/access/OwnerIsCreator.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";

interface IFreelanceEscrow {
    struct CreateParams {
        uint256 categoryId;
        address freelancer;
        address token;
        uint256 amount;
        string ipfsHash;
        uint256 deadline;
        uint256[] mAmounts;
        string[] mHashes;
        bool[] mIsUpfront;
        uint256 yieldStrategy;
        address paymentToken;
        uint256 paymentAmount;
        uint256 minAmountOut;
        bool zkRequired;
    }
    function createJobFor(address client, CreateParams calldata p) external returns (uint256);
    function tokenWhitelist(address token) external view returns (bool);
}

/**
 * @title CCIPPaymentAdapter
 * @notice Allows users to fund PolyLance jobs from any CCIP-supported chain.
 * This is the "Any Coin, Any Chain" solution for PolyLance.
 */
contract CCIPPaymentAdapter is CCIPReceiver, OwnerIsCreator {
    using SafeERC20 for IERC20;

    IFreelanceEscrow public escrow;
    
    // Mapping of allowlisted source chains
    mapping(uint64 => bool) public allowlistedChains;
    // Mapping of allowlisted senders (other CCIPPaymentAdapters)
    mapping(address => bool) public allowlistedSenders;

    event JobCreatedCrossChain(uint256 indexed jobId, address indexed client, uint64 sourceChainSelector);

    constructor(address _router, address _escrow) CCIPReceiver(_router) {
        escrow = IFreelanceEscrow(_escrow);
    }

    function allowlistSourceChain(uint64 _sourceChainSelector, bool _allowed) external onlyOwner {
        allowlistedChains[_sourceChainSelector] = _allowed;
    }

    function allowlistSender(address _sender, bool _allowed) external onlyOwner {
        allowlistedSenders[_sender] = _allowed;
    }

    /**
     * @notice The entrypoint for CCIP messages.
     * @dev Only callable by the CCIP Router.
     */
    function _ccipReceive(Client.Any2EVMMessage memory any2EvmMessage) internal override {
        require(allowlistedChains[any2EvmMessage.sourceChainSelector], "Source chain not allowlisted");
        address sender = abi.decode(any2EvmMessage.sender, (address));
        require(allowlistedSenders[sender], "Sender not allowlisted");

        // Decode the job parameters
        (address client, IFreelanceEscrow.CreateParams memory params) = abi.decode(
            any2EvmMessage.data,
            (address, IFreelanceEscrow.CreateParams)
        );

        // Ensure we received the tokens
        require(any2EvmMessage.destTokenAmounts.length == 1, "Expected exactly one token");
        address receivedToken = any2EvmMessage.destTokenAmounts[0].token;
        uint256 receivedAmount = any2EvmMessage.destTokenAmounts[0].amount;

        // Override params with actual received token and amount to prevent spoofing
        params.token = receivedToken;
        params.amount = receivedAmount;

        // Approve and create job
        IERC20(receivedToken).forceApprove(address(escrow), receivedAmount);
        uint256 jobId = escrow.createJobFor(client, params);

        emit JobCreatedCrossChain(jobId, client, any2EvmMessage.sourceChainSelector);
    }

    /**
     * @notice Send a cross-chain job creation request.
     * @param destinationChainSelector The CCIP selector for the destination chain (e.g. Polygon).
     * @param receiver The address of the CCIPPaymentAdapter on the destination chain.
     * @param params The job parameters.
     * @param feeToken The token used to pay CCIP fees (Link or Native).
     */
    function payAndCreateJob(
        uint64 destinationChainSelector,
        address receiver,
        IFreelanceEscrow.CreateParams calldata params,
        address feeToken
    ) external payable returns (bytes32 messageId) {
        // Transfer tokens from user to this adapter
        IERC20(params.token).safeTransferFrom(msg.sender, address(this), params.amount);
        IERC20(params.token).forceApprove(getRouter(), params.amount);

        // Prepare the message
        Client.EVMTokenAmount[] memory tokenAmounts = new Client.EVMTokenAmount[](1);
        tokenAmounts[0] = Client.EVMTokenAmount({
            token: params.token,
            amount: params.amount
        });

        bytes memory data = abi.encode(msg.sender, params);

        Client.EVM2AnyMessage memory evm2AnyMessage = Client.EVM2AnyMessage({
            receiver: abi.encode(receiver),
            data: data,
            tokenAmounts: tokenAmounts,
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: 500_000}) // Gas limit for createJob on destination
            ),
            feeToken: feeToken
        });

        uint256 fee = IRouterClient(getRouter()).getFee(destinationChainSelector, evm2AnyMessage);

        if (feeToken == address(0)) {
            require(msg.value >= fee, "Insufficient fee");
            messageId = IRouterClient(getRouter()).ccipSend{value: fee}(
                destinationChainSelector,
                evm2AnyMessage
            );
        } else {
            IERC20(feeToken).safeTransferFrom(msg.sender, address(this), fee);
            IERC20(feeToken).forceApprove(getRouter(), fee);
            messageId = IRouterClient(getRouter()).ccipSend(
                destinationChainSelector,
                evm2AnyMessage
            );
        }
    }

    /**
     * @notice Allows the owner to recover tokens stuck in the contract.
     */
    function withdrawToken(address _token) external onlyOwner {
        uint256 balance = IERC20(_token).balanceOf(address(this));
        IERC20(_token).safeTransfer(msg.sender, balance);
    }

    /**
     * @notice Allows the owner to recover native tokens stuck in the contract.
     */
    function withdrawNative() external onlyOwner {
        (bool success, ) = msg.sender.call{value: address(this).balance}("");
        require(success, "Withdraw failed");
    }
}
