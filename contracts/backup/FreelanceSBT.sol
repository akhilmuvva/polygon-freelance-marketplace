// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

import "./interfaces/IERC5192.sol";

/**
 * @title FreelanceSBT
 * @author Akhil Muvva
 * @notice Soulbound Token (non-transferable) for freelancer reputation and ratings.
 * @dev Implements ERC-721 with non-transferability (Soulbound) and ERC-5192 locking events.
 * Tokens represent completed jobs and their associated persistent ratings.
 */
contract FreelanceSBT is ERC721, ERC721URIStorage, AccessControl, IERC5192 {
    /// @notice Role authorized to mint reputation tokens (usually the Escrow contract)
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    /// @dev Counter for unique reputation token IDs
    uint256 private _nextTokenId;

    /// @notice Error thrown when a transfer of a Soulbound token is attempted
    error SoulboundTokenNonTransferable();

    /**
     * @notice Initializes the FreelanceSBT contract
     * @param defaultAdmin Address for the primary administrator
     * @param minter Initial address granted the MINTER_ROLE
     */
    constructor(address defaultAdmin, address minter) ERC721("Freelance Reputation", "FREP") {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, minter);
    }

    /**
     * @notice Mints a reputation token (Soulbound) to a freelancer
     * @dev Only callable by addresses with MINTER_ROLE
     * @param to The freelancer's wallet address
     * @param uri IPFS CID containing job completion and rating metadata
     */
    function safeMint(address to, string memory uri) public onlyRole(MINTER_ROLE) {
        uint256 tokenId = _nextTokenId++;
        
        // Metadata update before mint to ensure consistency
        _setTokenURI(tokenId, uri);
        _safeMint(to, tokenId);
        
        emit Locked(tokenId);
    }

    /**
     * @dev Internal hook to prevent transfers (Soulbound logic)
     * Reverts if 'from' and 'to' are both non-zero (indicating a transfer rather than mint/burn)
     */
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert SoulboundTokenNonTransferable();
        }
        return super._update(to, tokenId, auth);
    }

    /**
     * @notice Checks if a token is locked as per ERC-5192
     * @param tokenId The ID of the token to check
     * @return bool Always returns true for minted tokens in this SBT implementation
     */
    function locked(uint256 tokenId) external view override returns (bool) {
        if (_ownerOf(tokenId) == address(0)) revert("Nonexistent token");
        return true;
    }

    // --- Overrides required by Solidity ---

    /**
     * @notice Returns the URI for a given token ID
     * @param tokenId The ID of the token
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    /**
     * @notice Standard interface support check
     * @param interfaceId The interface identifier
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return interfaceId == 0xb45a3c0e || super.supportsInterface(interfaceId);
    }
}
