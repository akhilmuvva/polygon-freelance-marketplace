// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

// ─────────────────────────────────────────────────────────────────────────────
//  CUSTOM ERRORS
//  Gas-efficient revert surface. Eliminates string-literal storage entirely.
// ─────────────────────────────────────────────────────────────────────────────
error UnauthorizedActor();
error ZeroAddress();
error RatingOutOfBounds();

/**
 * @title  AntigravityReputation
 * @author Akhil Muvva × Jhansi Kupireddy
 * @notice The on-chain identity backbone of the PolyLance Zenith protocol.
 *         Reputation is not a number — it is a sovereign record of verifiable
 *         contribution, expressed as ERC-1155 skill tokens and composed gravity
 *         metrics that flow into yield discount rates and elite-intent routing.
 *
 * @dev    Each token ID maps to a skill domain (Dev, Design, Legal, etc.).
 *         Balance depth — not binary ownership — determines a freelancer's
 *         "orbital category." A higher balance means more experience points
 *         accumulated across sovereign work completions.
 *
 *         gravityScore: risk proxy [0..10000 bps]. 0 = weightless, 10000 = maximum friction.
 *         completionRate: track record expressed in basis points (10000 = 100%).
 *
 *         These two metrics are consumed by InvoiceNFT's `calculateDiscountRate()` and
 *         the AGA's GravityScoreService for Elite Intent routing.
 */
contract AntigravityReputation is
    Initializable,
    ERC1155Upgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    // ─── Roles ────────────────────────────────────────────────────────────────
    /// @notice Authorized to mint sovereignty points. Bound to the Escrow contract post-deployment.
    bytes32 public constant MINTER_ROLE   = keccak256("MINTER_ROLE");
    /// @notice Authorized to push UUPS implementation upgrades via Governance Timelock.
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    // ─── Skill Categories (Token IDs) ─────────────────────────────────────────
    /// @notice KARMA_ID: Universal reputation token. High balance = eligible for fee subsidy.
    uint256 public constant KARMA_ID = 0;

    // ─── Gravity Metrics ──────────────────────────────────────────────────────
    /// @dev Cumulative rating points received across all completed engagements.
    mapping(address => uint256) public totalStars;

    /// @dev Number of rated engagements — denominator for averageRating.
    mapping(address => uint256) public totalEngagements;

    /// @dev Rolling average [0–5]. Recomputed on every rating actuated.
    mapping(address => uint8) public averageRating;

    /// @dev Ceramic/IPFS CID anchoring the freelancer's sovereign portfolio.
    ///      Stored on-chain only as a content-addressed pointer — data remains P2P.
    mapping(address => string) public portfolioCID;

    /// @dev Completion rate in basis points. 10000 = perfect track record.
    ///      Used by InvoiceNFT to determine discount rate in the RWA market.
    mapping(address => uint16) public completionRate;

    /// @dev Gravity Score in basis points [0..10000].
    ///      0 = Negative Gravity (Elite / S-Tier).
    ///      High score = High friction = Higher yield discount demanded by financiers.
    mapping(address => uint16) public gravityScores;

    // ─── Events ───────────────────────────────────────────────────────────────
    event SovereignRatingActuated(address indexed sovereign, uint8 newAverage, uint256 totalEngagements);
    event PortfolioAnchored(address indexed sovereign, string ceramicCID);
    event GravityCalibrated(address indexed sovereign, uint16 completionRate, uint16 gravityScore);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() { _disableInitializers(); }

    // ─── Initializer ──────────────────────────────────────────────────────────

    /**
     * @notice Bootstraps the Antigravity Reputation registry.
     * @dev    Called exactly once via the UUPS proxy. Subsequent calls revert.
     * @param  admin The sovereign deployer — receives all privileged roles initially.
     * @param  uri   ERC-1155 metadata URI. Points to the Zenith IPFS metadata gateway.
     */
    function initialize(address admin, string memory uri) public initializer {
        if (admin == address(0)) revert ZeroAddress();
        __ERC1155_init(uri);
        __AccessControl_init();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(UPGRADER_ROLE, admin);
    }

    // ─── Configuration ────────────────────────────────────────────────────────

    /// @notice Re-points the ERC-1155 metadata gateway. Useful for IPFS→Arweave migration.
    function setURI(string memory newuri) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _setURI(newuri);
    }

    // ─── Core: Reputation Actuations ──────────────────────────────────────────

    /**
     * @notice Mints sovereignty experience points to a freelancer's skill domain.
     * @dev    Called by the Escrow contract upon milestone release. Accumulation depth
     *         determines discount eligibility in the Invoice RWA market.
     *         Only MINTER_ROLE (bound to FreelanceEscrow) may actuate this.
     *
     * @param  sovereign The freelancer's wallet address that earned the XP.
     * @param  skillId   The ERC-1155 token ID for the relevant skill domain.
     * @param  xp        Experience points to credit — calibrated to milestone value.
     */
    function actuateSovereignXP(address sovereign, uint256 skillId, uint256 xp)
        external
        onlyRole(MINTER_ROLE)
    {
        _mint(sovereign, skillId, xp, "");
    }

    /**
     * @notice Records a verified client rating and recomputes the rolling average.
     * @dev    Rolling average is floor-rounded intentionally — we bias conservatively.
     *         Prevents rating inflation from small-denomination work.
     *
     * @param  sovereign The freelancer receiving the rating.
     * @param  rating    Client's satisfaction score [0–5]. Reverts on out-of-bounds.
     */
    function actuateRating(address sovereign, uint8 rating)
        external
        onlyRole(MINTER_ROLE)
    {
        if (rating > 5) revert RatingOutOfBounds();

        unchecked {
            totalStars[sovereign]      += rating;
            totalEngagements[sovereign] += 1;
        }

        // Conservative floor division — prevents fraudulent rating ceiling exploitation
        averageRating[sovereign] = uint8(totalStars[sovereign] / totalEngagements[sovereign]);

        emit SovereignRatingActuated(sovereign, averageRating[sovereign], totalEngagements[sovereign]);
    }

    /**
     * @notice Anchors a sovereign's portfolio to a Ceramic/IPFS content-addressed CID.
     * @dev    Self-sovereign: no admin required. The caller is the authority over their identity.
     *         This pointer is consumed by SubgraphService and the AGA's profile hydration.
     *
     * @param  cid The Ceramic StreamID or IPFS CIDv1 of the portfolio document.
     */
    function anchorPortfolio(string calldata cid) external {
        portfolioCID[msg.sender] = cid;
        emit PortfolioAnchored(msg.sender, cid);
    }

    /**
     * @notice Calibrates the gravity metrics for a sovereign — called by the AGA's oracle role.
     * @dev    gravityScore feeds directly into InvoiceNFT.calculateDiscountRate() and the
     *         GravityScoreService Elite Intent routing threshold. Lower score → lower risk
     *         premium demanded by Morpho/Aave financiers → cheaper invoice factoring.
     *
     *         To maintain the 0% fee equilibrium: high-gravity freelancers pay more in
     *         yield cost, while weightless (negative-gravity) sovereigns access elite lanes.
     *
     * @param  sovereign      The freelancer's identity address.
     * @param  _completionRate Track record in BPS (10000 = 100%).
     * @param  _gravityScore   Risk metric in BPS (0 = S-Tier Elite, 10000 = High Friction).
     */
    function calibrateGravity(address sovereign, uint16 _completionRate, uint16 _gravityScore)
        external
        onlyRole(MINTER_ROLE)
    {
        completionRate[sovereign] = _completionRate;
        gravityScores[sovereign]  = _gravityScore;
        emit GravityCalibrated(sovereign, _completionRate, _gravityScore);
    }

    // ─── UUPS & Interface ─────────────────────────────────────────────────────

    /**
     * @notice Upgrade authorization gate. Enforces that only Governance Timelock
     *         can push new implementations — prevents unilateral protocol mutation.
     */
    function _authorizeUpgrade(address newImpl) internal override onlyRole(UPGRADER_ROLE) {}

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC1155Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /// @dev ERC-7201 storage gap — MUST remain the final declaration in this contract.
    uint256[50] private __gap;
}
