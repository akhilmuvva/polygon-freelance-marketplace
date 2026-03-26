// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ReviewSBT
 * @notice Soulbound Token for 5-star job reviews.
 */
contract ReviewSBT is ERC721, Ownable {
    uint256 private _nextTokenId;

    error Soulbound();

    constructor(address initialOwner) ERC721("PolyLance Elite Review", "PER") Ownable(initialOwner) {}

    function mint(address to) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        return tokenId;
    }

    /**
     * @dev Prevents transfers and makes it soulbound.
     */
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert Soulbound();
        }
        return super._update(to, tokenId, auth);
    }
}
