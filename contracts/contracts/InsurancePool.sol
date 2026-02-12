// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title InsurancePool
 * @author Akhil Muvva
 * @notice Collects fees from jobs and provides a safety net for disputes.
 * @dev Manages both Native (MATIC) and ERC20 token balances for insurance payouts.
 */
contract InsurancePool is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    /// @notice Current balance of each token held in the pool
    mapping(address => uint256) public balances;
    /// @notice Total historical deposits for each token
    mapping(address => uint256) public totalInsurancePool; 

    event FundsAdded(address indexed token, uint256 amount);
    event PayoutExecuted(address indexed token, address indexed recipient, uint256 amount);

    error InvalidAddress();
    error InsufficientFunds();
    error TransferFailed();
    error UseDepositNative();

    /**
     * @notice Deploys the insurance pool
     * @param initialOwner Address of the pool administrator
     */
    constructor(address initialOwner) Ownable(initialOwner) {
        if (initialOwner == address(0)) revert InvalidAddress();
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Allows the Escrow contract to deposit ERC20 fees
     * @param token Address of the payment token
     * @param amount Amount to deposit
     */
    function deposit(address token, uint256 amount) external whenNotPaused {
        if (token == address(0)) {
            revert UseDepositNative();
        }
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        balances[token] += amount;
        totalInsurancePool[token] += amount;
        emit FundsAdded(token, amount);
    }

    /**
     * @notice Allows depositing native MATIC fee
     */
    function depositNative() external payable whenNotPaused {
        balances[address(0)] += msg.value;
        totalInsurancePool[address(0)] += msg.value;
        emit FundsAdded(address(0), msg.value);
    }

    /**
     * @notice Executed by the Admin to resolve extreme cases or fund external arbitration
     * @param token Address of the token to pay out
     * @param to Recipient address
     * @param amount Payout amount
     */
    function payout(address token, address to, uint256 amount) external onlyOwner whenNotPaused nonReentrant {
        if (to == address(0)) revert InvalidAddress();
        if (balances[token] < amount) revert InsufficientFunds();
        balances[token] -= amount;
        
        if (token == address(0)) {
            (bool success, ) = payable(to).call{value: amount}("");
            if (!success) revert TransferFailed();
        } else {
            IERC20(token).safeTransfer(to, amount);
        }

        emit PayoutExecuted(token, to, amount);
    }

    /**
     * @notice Fallback to accept direct native transfers
     */
    receive() external payable {
        balances[address(0)] += msg.value;
        totalInsurancePool[address(0)] += msg.value;
    }
}
