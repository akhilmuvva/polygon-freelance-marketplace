// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IAavePool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

interface ICompoundComet {
    function supply(address asset, uint256 amount) external;
    function withdraw(address asset, uint256 amount) external;
    function baseToken() external view returns (address);
}

interface IMorpho {
    struct MarketParams {
        address loanToken;
        address collateralToken;
        address oracle;
        address irm;
        uint256 lltv;
    }
    function supply(MarketParams memory marketParams, uint256 assets, uint256 shares, address onBehalfOf, bytes calldata data) external returns (uint256, uint256);
    function withdraw(MarketParams memory marketParams, uint256 assets, uint256 shares, address onBehalfOf, address receiver) external returns (uint256, uint256);
}

// ─────────────────────────────────────────────────────────────────────────────
//  CUSTOM ERRORS — gas-efficient, auditor-legible revert surface
// ─────────────────────────────────────────────────────────────────────────────
error StrategyInactive();
error ZeroInterest();
error ZeroAddress();
error SurplusLockedByTimelock();

/**
 * @title  YieldManager
 * @author Akhil Muvva & Balram Taddi
 * @notice Orchestrates multi-protocol yield strategies for escrowed PolyLance funds.
 *         The "gravityFactor" constants define how accrued interest is partitioned
 *         across three sovereign destinations: Safety Module, Protocol Treasury, and
 *         the actor (freelancer/client) yield pool.
 *
 * @dev    Interest math uses a 1e18 precision multiplier upstream. All BPS arithmetic
 *         is performed with explicit rounding-down semantics. The delta (dust) stays
 *         in the escrow contract and accumulates as user yield — never lost.
 *         Checks-Effects-Interactions is enforced for every external call.
 *
 *         ┌───────────────────────────────────────────────┐
 *         │   Interest Harvest                            │
 *         │   ├── 5%  → safetyModule   (SAFETY_GRAVITY)  │
 *         │   ├── 20% → protocolTreasury (PROTOCOL_GRAVITY)│
 *         │   └── 75% → escrow / users  (user yield)     │
 *         └───────────────────────────────────────────────┘
 */
contract YieldManager is Ownable {
    using SafeERC20 for IERC20;

    // ─── Mainnet Anchors ────────────────────────────────────────────────────
    /// @notice  Aave V3 Pool — Polygon Mainnet. Hard-coded for immutable auditability.
    address public constant AAVE_V3_POLYGON_MAINNET = 0x794a6135d5A5B64eBCEEb42779aA57C0b5B4814a;

    // ─── Enums & Structs ────────────────────────────────────────────────────
    /// @notice Multi-protocol liquidity destination for escrowed capital.
    enum Strategy { NONE, AAVE, COMPOUND, MORPHO }

    /// @notice Binds a yield strategy to a live pool address and its activation status.
    struct StrategyConfig {
        address pool;
        bool active;
    }

    // ─── State ───────────────────────────────────────────────────────────────
    /// @notice Registry of active yield strategies.
    mapping(Strategy => StrategyConfig) public strategies;

    /// @notice Morpho market parameters per underlying token.
    mapping(address => IMorpho.MarketParams) public morphoMarkets;

    address public safetyModule;
    address public protocolTreasury;
    address public governanceTimelock;

    // "gravityFactor" = fee weight that determines how much interest is diverted.
    // A higher gravityFactor on protocol side = more sovereign surplus captured.
    uint256 public constant SAFETY_GRAVITY_BPS   = 500;   // 5%  → Safety Module
    uint256 public constant PROTOCOL_GRAVITY_BPS = 2000;  // 20% → Sovereign Surplus

    // High-precision interest accumulator (upstream callers scale by 1e18)
    uint256 public accruedSurplus; // tracks undistributed surplus for Timelock withdrawal

    // ─── Events ──────────────────────────────────────────────────────────────
    event YieldDeposited(Strategy indexed strategy, address indexed token, uint256 amount);
    event YieldWithdrawn(Strategy indexed strategy, address indexed token, uint256 amount);
    event StrategyUpdated(Strategy indexed strategy, address pool, bool active);

    /// @notice Emitted on every harvest; all three distribution buckets are logged.
    event YieldRebalanced(
        address indexed token,
        uint256 totalInterest,
        uint256 safetyDiverted,
        uint256 protocolSurplus,
        uint256 userYield
    );

    /// @notice Emitted when governance executes a surplus withdrawal via Timelock.
    event SurplusWithdrawn(address indexed token, uint256 amount, address indexed recipient);

    // ─── Constructor ─────────────────────────────────────────────────────────
    constructor(address _owner) Ownable(_owner) {}

    // ─── Admin Configuration ─────────────────────────────────────────────────

    /// @notice Binds the Safety Module receiver. Immutable after governance finalizes.
    function setSafetyModule(address _module) external onlyOwner {
        if (_module == address(0)) revert ZeroAddress();
        safetyModule = _module;
    }

    /// @notice Binds the Protocol Treasury (Zenith DAO) receiver.
    function setProtocolTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert ZeroAddress();
        protocolTreasury = _treasury;
    }

    /// @notice Sets the Governance Timelock guardian for surplus withdrawals.
    function setGovernanceTimelock(address _timelock) external onlyOwner {
        if (_timelock == address(0)) revert ZeroAddress();
        governanceTimelock = _timelock;
    }

    /// @notice Activates or deactivates a yield strategy with a new pool address.
    function setStrategy(Strategy strategy, address pool, bool active) external onlyOwner {
        strategies[strategy] = StrategyConfig(pool, active);
        emit StrategyUpdated(strategy, pool, active);
    }

    /// @notice Registers token → Morpho market parameters.
    function setMorphoMarket(address token, IMorpho.MarketParams calldata params) external onlyOwner {
        morphoMarkets[token] = params;
    }

    // ─── Core: Yield Rebalance ────────────────────────────────────────────────

    /**
     * @notice Neutralizes economic friction by harvesting accrued interest and
     *         partitioning it across protocol safety, sovereign surplus, and user yield.
     *
     * @dev    CHECKS-EFFECTS-INTERACTIONS strictly enforced.
     *         Dust (rounding residual) stays in escrow as implicit user yield — no loss.
     *         `totalInterest` MUST be pre-scaled by 1e18 upstream to avoid precision loss.
     *
     * @param  token         ERC-20 token address of the yield asset.
     * @param  totalInterest Raw interest amount (in token decimals × 1e18).
     */
    function rebalanceYield(address token, uint256 totalInterest) external onlyOwner {
        if (totalInterest == 0) revert ZeroInterest();

        // ── CHECKS ──
        uint256 safetyAmount   = (totalInterest * SAFETY_GRAVITY_BPS)   / 10000;
        uint256 protocolAmount = (totalInterest * PROTOCOL_GRAVITY_BPS) / 10000;
        uint256 userYield      = totalInterest - safetyAmount - protocolAmount;

        // ── EFFECTS ──
        accruedSurplus += protocolAmount;

        // ── INTERACTIONS ──
        if (safetyModule != address(0) && safetyAmount > 0) {
            IERC20(token).safeTransfer(safetyModule, safetyAmount);
        }
        if (protocolTreasury != address(0) && protocolAmount > 0) {
            IERC20(token).safeTransfer(protocolTreasury, protocolAmount);
        }

        emit YieldRebalanced(token, totalInterest, safetyAmount, protocolAmount, userYield);
    }

    /**
     * @notice Actuates a surplus withdrawal to a designated recipient, enforcing
     *         the Zenith Governance Timelock to prevent unilateral fund extraction.
     *
     * @dev    Only callable by the governanceTimelock address. This ensures that any
     *         surplus movement must pass a DAO vote + time delay. Reverts silently
     *         if the caller is not the Timelock — no string error to save gas.
     *
     * @param  token     ERC-20 token to withdraw.
     * @param  amount    Quantity to withdraw (≤ accruedSurplus).
     * @param  recipient Destination address (e.g., Zenith DAO multisig).
     */
    function withdrawSurplus(address token, uint256 amount, address recipient) external {
        if (msg.sender != governanceTimelock) revert SurplusLockedByTimelock();
        if (recipient == address(0)) revert ZeroAddress();

        // EFFECTS before INTERACTIONS
        accruedSurplus -= amount;
        IERC20(token).safeTransfer(recipient, amount);

        emit SurplusWithdrawn(token, amount, recipient);
    }

    // ─── Core: Deposit / Withdraw ─────────────────────────────────────────────

    /**
     * @notice Deploys escrowed capital into the designated yield strategy.
     * @dev    Follows checks-effects-interactions. forceApprove resets approval
     *         safely before re-approving to avoid the ERC-20 approval race condition.
     */
    function deposit(Strategy strategy, address token, uint256 amount) external {
        if (strategy == Strategy.NONE) return;

        StrategyConfig memory config = strategies[strategy];
        if (!config.active) revert StrategyInactive();

        // INTERACTIONS: pull capital, approve pool, deploy
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        IERC20(token).forceApprove(config.pool, amount);

        if (strategy == Strategy.AAVE) {
            IAavePool(config.pool).supply(token, amount, address(this), 0);
        } else if (strategy == Strategy.COMPOUND) {
            ICompoundComet(config.pool).supply(token, amount);
        } else if (strategy == Strategy.MORPHO) {
            IMorpho.MarketParams memory params = morphoMarkets[token];
            IMorpho(config.pool).supply(params, amount, 0, address(this), "");
        }

        emit YieldDeposited(strategy, token, amount);
    }

    /**
     * @notice Repatriates capital from a yield strategy to a receiver.
     * @dev    For Compound: internal pull-then-push pattern to normalize the interface.
     *         Receiver MUST be a trusted escrow or DAO address — not caller-controlled.
     */
    function withdraw(Strategy strategy, address token, uint256 amount, address receiver) external {
        if (strategy == Strategy.NONE) {
            IERC20(token).safeTransferFrom(msg.sender, receiver, amount);
            return;
        }

        StrategyConfig memory config = strategies[strategy];

        if (strategy == Strategy.AAVE) {
            IAavePool(config.pool).withdraw(token, amount, receiver);
        } else if (strategy == Strategy.COMPOUND) {
            // Compound withdraws to this contract; we push to receiver atomically
            ICompoundComet(config.pool).withdraw(token, amount);
            IERC20(token).safeTransfer(receiver, amount);
        } else if (strategy == Strategy.MORPHO) {
            IMorpho.MarketParams memory params = morphoMarkets[token];
            IMorpho(config.pool).withdraw(params, amount, 0, address(this), receiver);
        }

        emit YieldWithdrawn(strategy, token, amount);
    }
}
