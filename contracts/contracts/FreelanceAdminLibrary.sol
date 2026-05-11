// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library FreelanceAdminLibrary {
    event ConfigUpdated(string key, address value);
    event ConfigUpdatedUint(string key, uint256 value);

    enum ConfigType { 
        SBT, ENTRY_POINT, VAULT, FEE, POLY_TOKEN, REP, COMP_CERT, REVIEW_SBT, SWAP, RENDERER, JOB_NFT, PRIVACY, TIMELOCK, ORACLE 
    }

    function validateAddress(address addr) internal pure {
        if (addr == address(0)) revert("InvalidAddress");
    }

    function validateBps(uint256 bps, uint256 max) internal pure {
        if (bps > max) revert("InvalidBps");
    }
}
