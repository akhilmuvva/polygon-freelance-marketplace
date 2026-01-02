// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IAny2EVMMessageReceiver} from "./IAny2EVMMessageReceiver.sol";
import {Client} from "./Client.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/// @title CCIPReceiver - Base contract for CCIP applications that wish to receive messages
abstract contract CCIPReceiver is IAny2EVMMessageReceiver, IERC165 {
  address internal i_router;

  constructor(address router) {
    if (router == address(0)) revert("InvalidRouter");
    i_router = router;
  }

  function getRouter() public view virtual returns (address) {
    return i_router;
  }

  /// @dev Only calls from the set router are accepted.
  modifier onlyRouter() {
    if (msg.sender != i_router) revert("InvalidRouter");
    _;
  }

  /// @inheritdoc IAny2EVMMessageReceiver
  function ccipReceive(Client.Any2EVMMessage calldata message) external virtual override onlyRouter {
    _ccipReceive(message);
  }

  /// @notice Override this function in your contract.
  /// @param message Any2EVMMessage
  function _ccipReceive(Client.Any2EVMMessage calldata message) internal virtual;

  /// @inheritdoc IERC165
  function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
    return interfaceId == type(IAny2EVMMessageReceiver).interfaceId || interfaceId == type(IERC165).interfaceId;
  }
}
