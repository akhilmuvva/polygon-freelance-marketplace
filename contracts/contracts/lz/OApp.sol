// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Minimal OApp standard for LayerZero V2 integration without a full npm dependency
abstract contract OApp {
    address public lzEndpoint;
    mapping(uint32 => bytes32) public peers;

    function __OApp_init(address _endpoint) internal {
        lzEndpoint = _endpoint;
    }

    function setPeer(uint32 _eid, bytes32 _peer) external virtual {
        peers[_eid] = _peer;
    }

    // placeholder for _lzSend and _lzReceive
}
