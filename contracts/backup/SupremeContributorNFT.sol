// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract SupremeContributorNFT is ERC721URIStorage, Ownable {
    using Strings for uint256;

    uint256 public nextTokenId;
    
    constructor() ERC721("PolyLance Supreme Contributor", "SUPREME") Ownable(msg.sender) {}

    function mintSupreme(address to) public onlyOwner {
        uint256 tokenId = nextTokenId++;
        string memory finalTokenUri = generateMetadata(tokenId);
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, finalTokenUri);
    }

    function generateMetadata(uint256 tokenId) internal pure returns (string memory) {
        string memory svg = string(abi.encodePacked(
            '<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">',
            '<rect width="500" height="500" fill="#02040a"/>',
            '<circle cx="250" cy="250" r="200" fill="none" stroke="#7c3aed" stroke-width="4" stroke-dasharray="10 5"/>',
            '<path d="M250 100 L400 200 L400 350 L250 450 L100 350 L100 200 Z" fill="none" stroke="#f59e0b" stroke-width="8"/>',
            '<text x="50%" y="260" text-anchor="middle" fill="#ffffff" font-family="Arial" font-weight="900" font-size="28">SUPREME</text>',
            '<text x="50%" y="290" text-anchor="middle" fill="#7c3aed" font-family="Arial" font-weight="700" font-size="16">ZENITH CONTRIBUTOR</text>',
            '<text x="50%" y="480" text-anchor="middle" fill="#ffffff" opacity="0.5" font-family="Arial" font-size="10">ID: ', tokenId.toString(), '</text>',
            '</svg>'
        ));

        string memory json = Base64.encode(bytes(string(abi.encodePacked(
            '{"name": "Supreme Contributor #', tokenId.toString(), '",',
            '"description": "Commemorative Zenith-tier recognition for excellence in PolyLance Protocol development.",',
            '"image": "data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '",',
            '"attributes": [{"trait_type": "Tier", "value": "Zenith"}, {"trait_type": "Utility", "value": "Governance Boost"}]}'
        ))));

        return string(abi.encodePacked("data:application/json;base64,", json));
    }
}
