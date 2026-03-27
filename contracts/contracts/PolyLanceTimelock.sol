// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title  PolyLanceTimelock
 * @notice Enforces a 48-hour mandatory delay between a governance proposal
 *         passing and its on-chain execution.
 *
 *         This prevents instant governance attacks — even if a malicious
 *         proposal passes, token holders have 48 hours to exit before
 *         execution is possible.
 *
 * @dev    Deployed once. ZenithGovernance is set as the sole proposer.
 *         Executors is open (address(0)) — anyone can trigger after delay.
 *         Admin should be renounced after setup for full decentralisation.
 */
contract PolyLanceTimelock is TimelockController {

    /// @notice 48-hour minimum delay. Immutable after deployment.
    uint256 public constant MIN_DELAY = 2 days;

    constructor(
        address[] memory proposers,
        address[] memory executors,
        address admin
    ) TimelockController(MIN_DELAY, proposers, executors, admin) {}
}
