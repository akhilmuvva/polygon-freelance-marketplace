// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/metatx/ERC2771Forwarder.sol";

/**
 * @title PolyLanceForwarder
 * @dev A simple EIP-2771 Forwarder for the PolyLance Marketplace.
 * Allows relayers (like Biconomy or OZ Defender) to submit transactions on behalf of users.
 */
contract PolyLanceForwarder is ERC2771Forwarder {
    constructor() ERC2771Forwarder("PolyLanceForwarder") {}
}
