// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/**
 * @title PolyCompletionSBT
 * @dev Soulbound Token (ERC-5192) for Job Completion Certificates on PolyLance.
 * These tokens are non-transferable and serve as on-chain proof of successful delivery.
 */
contract PolyCompletionSBT is ERC721, Ownable {
    using Strings for uint256;

    uint256 private _nextTokenId;
    address public marketplace;

    struct CertificateData {
        uint16 categoryId;
        uint8 rating;
        uint48 completionTimestamp;
    }

    mapping(uint256 => CertificateData) public certificateDetails;

    // ERC-5192 Events
    event Locked(uint256 tokenId);
    event Unlocked(uint256 tokenId);

    error NotMarketplace();
    error Soulbound();
    error NonExistentToken();

    constructor(address initialOwner, address _marketplace) 
        ERC721("PolyLance Completion Certificate", "PLCC") 
        Ownable(initialOwner) 
    {
        marketplace = _marketplace;
    }

    /**
     * @notice Updates the authorized marketplace address
     */
    function setMarketplace(address _marketplace) external onlyOwner {
        marketplace = _marketplace;
    }

    /**
     * @notice Mints a soulbound completion certificate
     * @dev Restricted to the Marketplace contract
     */
    function mintCertificate(address to, uint16 categoryId, uint8 rating) external returns (uint256) {
        if (msg.sender != marketplace) revert NotMarketplace();
        
        uint256 tokenId = ++_nextTokenId;
        _safeMint(to, tokenId);
        
        certificateDetails[tokenId] = CertificateData({
            categoryId: categoryId,
            rating: rating,
            completionTimestamp: uint48(block.timestamp)
        });

        emit Locked(tokenId);
        return tokenId;
    }

    /**
     * @notice ERC-5192: Returns the locking status of a token
     */
    function locked(uint256 tokenId) external view returns (bool) {
        if (_ownerOf(tokenId) == address(0)) revert NonExistentToken();
        return true; // Always locked as it is soulbound
    }

    /**
     * @dev Soulbound logic: Prevent all transfers with ERC721's new _update hook
     */
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        // Only allow minting (from == 0) and burning (to == 0)
        if (from != address(0) && to != address(0)) {
            revert Soulbound();
        }
        return super._update(to, tokenId, auth);
    }

    /**
     * @notice Generates on-chain metadata with the job results
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        CertificateData memory data = certificateDetails[tokenId];
        
        string memory category = _getCategoryName(data.categoryId);
        
        string memory json = string(abi.encodePacked(
            '{"name": "Work Certificate #', tokenId.toString(), 
            '", "description": "Official Proof of Work verified by PolyLance Protocol", ',
            '"attributes": [',
            '{"trait_type": "Category", "value": "', category, '"},',
            '{"trait_type": "Rating", "value": ', uint256(data.rating).toString(), '},',
            '{"display_type": "date", "trait_type": "Completion Date", "value": ', uint256(data.completionTimestamp).toString(), '}',
            ']}'
        ));

        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(json))));
    }

    function _getCategoryName(uint16 id) internal pure returns (string memory) {
        if (id == 1) return "Development";
        if (id == 2) return "Design";
        if (id == 3) return "Marketing";
        if (id == 4) return "Writing";
        return "General Services";
    }

    /**
     * @notice Supported interfaces including ERC-5192
     */
    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return interfaceId == 0xb45a3c0e || super.supportsInterface(interfaceId);
    }
}
