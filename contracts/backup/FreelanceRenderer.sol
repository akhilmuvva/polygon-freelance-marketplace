// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

library FreelanceRenderer {
    using Strings for uint256;

    struct RenderParams {
        uint256 jobId;
        uint16 categoryId;
        uint256 amount;
        uint8 rating;
        string ipfsHash;
    }

    function generateSVG(
        uint256 jobId,
        uint16 categoryId,
        uint256 amount,
        uint8 rating
    ) internal pure returns (string memory) {
        (string memory color1, string memory color2, string memory badge) = getRatingColors(rating);

        return string(abi.encodePacked(
            "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"400\" height=\"400\" viewBox=\"0 0 400 400\">",
            "<rect width=\"100%\" height=\"100%\" fill=\"#1a1c2c\"/>",
            "<defs><linearGradient id=\"grad\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">",
            "<stop offset=\"0%\" style=\"stop-color:", color1, "\"/>",
            "<stop offset=\"100%\" style=\"stop-color:", color2, "\"/>",
            "</linearGradient></defs>",
            "<circle cx=\"200\" cy=\"200\" r=\"150\" fill=\"url(#grad)\" opacity=\"0.9\"/>",
            "<text x=\"50%\" y=\"30%\" text-anchor=\"middle\" fill=\"white\" font-family=\"Arial\" font-size=\"24\" font-weight=\"bold\">POLYLANCE WORK</text>",
            "<text x=\"50%\" y=\"45%\" text-anchor=\"middle\" fill=\"white\" font-family=\"Arial\" font-size=\"18\">Job #", jobId.toString(), "</text>",
            "<text x=\"50%\" y=\"55%\" text-anchor=\"middle\" fill=\"#fbbf24\" font-family=\"Arial\" font-size=\"20\">", getCategoryName(categoryId), "</text>",
            "<text x=\"50%\" y=\"65%\" text-anchor=\"middle\" fill=\"white\" font-family=\"Arial\" font-size=\"16\">Budget: ", amount.toString(), "</text>",
            rating > 0 ? string(abi.encodePacked(
                "<text x=\"50%\" y=\"80%\" text-anchor=\"middle\" fill=\"", badge, "\" font-family=\"Arial\" font-size=\"22\" font-weight=\"bold\">",
                getStars(rating), " ", badge, "</text>"
            )) : "",
            "</svg>"
        ));
    }

    function constructTokenURI(
        uint256 jobId,
        uint16 categoryId,
        uint256 amount,
        uint8 rating,
        string memory ipfsHash
    ) internal pure returns (string memory) {
        string memory imageURI = string(abi.encodePacked(
            "data:image/svg+xml;base64,", 
            Base64.encode(bytes(generateSVG(jobId, categoryId, amount, rating)))
        ));

        string memory json = string(abi.encodePacked(
            '{"name": "PolyLance Job #', jobId.toString(), 
            '", "description": "Proof of Work for PolyLance Marketplace", "image": "', imageURI, 
            '", "attributes": [', 
            rating > 0 ? string(abi.encodePacked('{"trait_type": "Rating", "value": "', uint256(rating).toString(), '"}, ')) : '',
            '{"trait_type": "Category", "value": "', getCategoryName(categoryId), 
            '"}, {"trait_type": "Budget", "value": "', amount.toString(), '"}]}'
        ));

        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(json))));
    }

    function getRatingColors(uint8 rating) internal pure returns (string memory color1, string memory color2, string memory badge) {
        if (rating >= 4) return ("#FFD700", "#FFA500", "GOLD");
        if (rating == 3) return ("#C0C0C0", "#808080", "SILVER");
        if (rating > 0) return ("#CD7F32", "#8B4513", "BRONZE");
        return ("#4f46e5", "#9333ea", "");
    }

    function getStars(uint8 rating) internal pure returns (string memory) {
        if (rating == 5) return "*****";
        if (rating == 4) return "****";
        if (rating == 3) return "***";
        if (rating == 2) return "**";
        if (rating == 1) return "*";
        return "";
    }

    function getCategoryName(uint256 categoryId) internal pure returns (string memory) {
        if (categoryId == 1) return "Development";
        if (categoryId == 2) return "Design";
        if (categoryId == 3) return "Marketing";
        if (categoryId == 4) return "Writing";
        return "General";
    }
}
