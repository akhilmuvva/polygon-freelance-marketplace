// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IEscrow {
    function releaseFunds(uint256 jobId) external;
}

/**
 * @title MaliciousReceiver
 * @notice Contract used for testing reentrancy protection
 * @dev Attempts to call releaseFunds recursively when receiving ETH
 */
contract MaliciousReceiver {
    IEscrow public escrow;
    uint256 public attackCount;
    uint256 public maxAttacks = 2;
    
    constructor(address _escrow) {
        escrow = IEscrow(_escrow);
    }
    
    receive() external payable {
        if (attackCount < maxAttacks) {
            attackCount++;
            // Attempt reentrancy attack
            try escrow.releaseFunds(1) {
                // Attack succeeded (should not happen with proper protection)
            } catch {
                // Attack failed (expected with ReentrancyGuard)
            }
        }
    }
    
    function resetAttackCount() external {
        attackCount = 0;
    }
}

/**
 * @title RejectETH
 * @notice Contract that rejects all ETH transfers
 * @dev Used for testing failed transfer handling
 */
contract RejectETH {
    receive() external payable {
        revert("No ETH accepted");
    }
    
    fallback() external payable {
        revert("No ETH accepted");
    }
}

/**
 * @title GasGriefing
 * @notice Contract that consumes excessive gas
 * @dev Used for testing DoS attack prevention
 */
contract GasGriefing {
    uint256[] public data;
    
    receive() external payable {
        // Consume gas by writing to storage
        for (uint256 i = 0; i < 100; i++) {
            data.push(i);
        }
    }
}
