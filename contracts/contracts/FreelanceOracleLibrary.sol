// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AggregatorV3Interface
 * @dev Local definition to avoid external dependency issues.
 */
interface AggregatorV3Interface {
  function latestRoundData()
    external
    view
    returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    );
}

/**
 * @title FreelanceOracleLibrary
 * @notice Provides safety guards and fallbacks for decentralized oracles.
 */
library FreelanceOracleLibrary {
    uint256 public constant STALE_PRICE_DELAY = 24 hours;

    error OracleStale();
    error OracleBroken();

    /**
     * @notice Fetches price with strict stale-check logic.
     */
    function getSafePrice(address feed) internal view returns (uint256) {
        if (feed == address(0)) revert OracleBroken();
        
        try AggregatorV3Interface(feed).latestRoundData() returns (
            uint80,
            int256 answer,
            uint256,
            uint256 updatedAt,
            uint80
        ) {
            if (updatedAt == 0 || updatedAt < block.timestamp - STALE_PRICE_DELAY) revert OracleStale();
            if (answer <= 0) revert OracleBroken();
            return uint256(answer);
        } catch {
            revert OracleBroken();
        }
    }

    /**
     * @notice Implements a heartbeat-based circuit breaker for AI Oracles.
     * @param lastHeartbeat Timestamp of the last successful oracle interaction.
     * @param timeout Period after which the circuit breaker trips (e.g., 7 days).
     */
    function isOracleAlive(uint256 lastHeartbeat, uint256 timeout) internal view returns (bool) {
        return (block.timestamp - lastHeartbeat) <= timeout;
    }
}
