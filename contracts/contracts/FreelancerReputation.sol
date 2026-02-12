// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title FreelancerReputation
 * @author PolyLance Team
 * @notice Tracks multi-category skill levels using ERC-1155 tokens.
 * @dev Each token ID represents a category (e.g., 1 for Dev, 2 for Design).
 * The balance of the token represents the 'level' or 'experience points'.
 * This contract is intentionally soulbound by logic if not transferring is enforced, 
 * but here it follows standard ERC1155 for reputation accumulation.
 */
contract FreelancerReputation is Initializable, ERC1155Upgradeable, AccessControlUpgradeable, UUPSUpgradeable {
    event RatingUpdated(address indexed freelancer, uint8 averageRating, uint256 totalJobs);
    event PortfolioUpdated(address indexed freelancer, string cid);

    /// @notice Role authorized to mint reputation points (usually the Escrow contract)
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    /// @notice Role authorized to authorize UUPS upgrades
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    /// @notice ID for the general Karma category (used for fee discounts)
    uint256 public constant KARMA_ID = 0;

    /// @notice Tracks total stars received by a freelancer
    mapping(address => uint256) public totalStars;
    /// @notice Tracks total number of jobs reviewed for a freelancer
    mapping(address => uint256) public totalJobsReviewed;
    /// @notice Current average rating of a freelancer (0-5)
    mapping(address => uint8) public averageRating;
    /// @notice IPFS CID for a freelancer's dynamic portfolio
    mapping(address => string) public portfolioCID;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the FreelancerReputation contract
     * @param defaultAdmin Address granted the admin, minter, and upgrader roles
     * @param uri Metadata URI for the reputation categories
     */
    function initialize(address defaultAdmin, string memory uri) public initializer {
        __ERC1155_init(uri);
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, defaultAdmin);
        _grantRole(UPGRADER_ROLE, defaultAdmin);
    }

    /**
     * @notice Updates the metadata URI for all token types
     * @param newuri The new metadata URI
     */
    function setURI(string memory newuri) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _setURI(newuri);
    }

    /**
     * @notice Increases a freelancer's reputation level in a specific category
     * @dev Restricted to addresses with MINTER_ROLE
     * @param to The freelancer's address
     * @param id The category ID (e.g., 1 for Development, 2 for Design)
     * @param amount The amount of experience/reputation points to add
     */
    function levelUp(address to, uint256 id, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, id, amount, "");
    }

    /**
     * @notice Updates the freelancer's average rating
     * @param freelancer The freelancer's address
     * @param rating The new rating received (0-5)
     */
    function updateRating(address freelancer, uint8 rating) external onlyRole(MINTER_ROLE) {
        totalStars[freelancer] += rating;
        totalJobsReviewed[freelancer]++;
        averageRating[freelancer] = uint8(totalStars[freelancer] / totalJobsReviewed[freelancer]);
        emit RatingUpdated(freelancer, averageRating[freelancer], totalJobsReviewed[freelancer]);
    }

    /**
     * @notice Updates the freelancer's portfolio IPFS CID
     * @param cid The IPFS CID for the portfolio metadata
     */
    function updatePortfolio(string calldata cid) external {
        portfolioCID[msg.sender] = cid;
        emit PortfolioUpdated(msg.sender, cid);
    }

    /**
     * @dev Compliance hook for UUPS upgrades.
     * @param newImplementation Address of the new implementation
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

    /**
     * @notice Standard interface support check
     * @param interfaceId The interface identifier
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
