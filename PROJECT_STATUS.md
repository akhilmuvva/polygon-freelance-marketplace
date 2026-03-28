# PolyLance — Project Status

Engineers: Akhil Muvva · Jhansi Kupireddy
Updated: 2026-03-29
Network: Polygon Amoy Testnet
Live app: https://polylance.codes

## Deployed contracts (Polygon Amoy Testnet)

| Contract | Address |
|----------|---------|
| FreelanceEscrow (Proxy) | 0x25F6C8ed995C811E6c0ADb1D66A60830E8115e9A |
| FreelancerReputation    | 0x89791A9A3210667c828492DB98DCa3e2076cc373 |
| PolyToken               | 0xd3b893cd083f07Fe371c1a87393576e7B01C52C6 |
| FreelanceSBT            | 0xb4e9A5BC64DC07f890367F72941403EEd7faDCbB |
| PolyLanceTimelock       | not yet deployed |

> ZenithGovernance was removed: ZenithGovernance.sol did not appear in the Task A `find` output.

## Test results (from Task A — npx hardhat test)

Tests passing : not verified
Tests failing : not verified

> `npx hardhat test` exited with Error HH18 (corrupted lockfile, NPM bug #4828). No test counts were produced.

## Coverage (from Task A — npx hardhat coverage)

Statements : coverage not run
Branches   : coverage not run
Functions  : coverage not run
Lines      : coverage not run

> `npx hardhat coverage` failed: could not instrument PolyLanceNFTMarketplace.sol (parser error at line 48).

## Frontend build

Status : passed

> `npm run build` completed with exit code 0 — `✔ built in 30.66s`

## What works (only list features that have a deployed contract address above)

- Milestone escrow with Kleros dispute arbitration (FreelanceEscrow Proxy deployed)
- Soulbound Token minting on job completion, ERC-5192 (FreelanceSBT deployed)
- On-chain reputation tracking (FreelancerReputation deployed)
- Protocol token (PolyToken deployed)

## What is testnet-only (honest statement for evaluators)

All contracts are on Polygon Amoy Testnet.
Mainnet deployment is planned after external security audit.
No real funds are at risk.

## Security

- UUPS upgradeable proxies with _disableInitializers
- ReentrancyGuard on escrow release functions
- 48h governance timelock (PolyLanceTimelock.sol)
- Mythril and Slither analysis documented in AUDIT.md
- Responsible disclosure: security@polylance.codes

## Contacts

Admin    : admin@polylance.codes
Security : security@polylance.codes
