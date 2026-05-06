// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IERC5192.sol";

/**
 * @title BetaTesterSBT
 * @notice Soulbound Token distributed to early beta testers of the PolyLance Zenith Protocol.
 * @dev Non-transferable ERC-721 token that grants "Pioneer Status" UI badges and potential protocol perks.
 */
contract BetaTesterSBT is ERC721, AccessControl, IERC5192 {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    uint256 private _nextTokenId;
    string private _baseTokenURI;

    error SoulboundTokenNonTransferable();

    constructor(address defaultAdmin, string memory baseURI) ERC721("PolyLance Beta Pioneer", "PIONEER") {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, defaultAdmin);
        _baseTokenURI = baseURI;
    }

    function setBaseURI(string memory newBaseURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _baseTokenURI = newBaseURI;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function mint(address to) external onlyRole(MINTER_ROLE) {
        // Prevent multiple mints to the same address for exclusivity
        require(balanceOf(to) == 0, "Address already owns a Pioneer badge");
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        emit Locked(tokenId);
    }

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        // If from != address(0) and to != address(0), it's a transfer
        if (from != address(0) && to != address(0)) {
            revert SoulboundTokenNonTransferable();
        }
        return super._update(to, tokenId, auth);
    }

    function locked(uint256 tokenId) external view override returns (bool) {
        if (_ownerOf(tokenId) == address(0)) revert("Nonexistent token");
        return true;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return interfaceId == 0xb45a3c0e || super.supportsInterface(interfaceId);
    }
}
