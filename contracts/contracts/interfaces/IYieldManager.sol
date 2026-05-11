// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IYieldManager {
    enum Strategy { NONE, AAVE, COMPOUND, MORPHO }
    struct StrategyConfig {
        address pool;
        bool active;
    }
    function strategies(Strategy strategy) external view returns (address pool, bool active);
    function deposit(Strategy strategy, address token, uint256 amount) external;
    function withdraw(Strategy strategy, address token, uint256 amount, address to) external;
}
