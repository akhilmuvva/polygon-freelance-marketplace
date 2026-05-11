// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IYieldManager} from "./interfaces/IYieldManager.sol";

enum JobStatus { Created, Accepted, Ongoing, Disputed, Arbitration, Completed, Cancelled }

struct Job {
    // SLOT 1: Address(20) + uint32(4) + uint48(6) + uint16(2) = 32 bytes
    address client;
    uint32 id;
    uint48 deadline;
    uint16 categoryId;

    // SLOT 2: Address(20) + uint16(2) + JobStatus(1) + uint8(1) + bool(1) + Strategy(1) = 26 bytes
    address freelancer;
    uint16 milestoneCount;
    JobStatus status;
    bool paid;
    bool zkRequired;
    IYieldManager.Strategy yieldStrategy;
    uint8 rating;

    // SLOT 3: Address(20) + (12 bytes padding)
    address token;

    // SLOTS 4-6: uint256 take full slots
    uint256 amount;
    uint256 freelancerStake;
    uint256 totalPaidOut;
    string ipfsHash;
}

struct Application {
    address freelancer;
    uint256 stake;
}

struct Milestone {
    uint256 amount;
    string ipfsHash;
    bool isReleased;
    bool isUpfront;
}

struct CreateParams {
    uint256 categoryId;
    address freelancer;
    address token;
    uint256 amount;
    string ipfsHash;
    uint256 deadline;
    uint256[] mAmounts;
    string[] mHashes;
    bool[] mIsUpfront;
    IYieldManager.Strategy yieldStrategy;
    address paymentToken;
    uint256 paymentAmount;
    uint256 minAmountOut;
    bool zkRequired;
}
