# Mythril Symbolic Execution Report

**Date:** April 26, 2026  
**Tool Version:** Mythril v0.24.x

## Summary
The following findings were generated using the ConsenSys Mythril symbolic execution engine.

### [M-03] transfer() in governance royalties breaks smart contract wallets (High)
- **Contract:** `QuadraticGovernance.sol`
- **SWC ID:** 134
- **Finding:** Use of `.transfer()` for royalty distribution is capped at 2300 gas.
- **Recommendation:** Use `.call{value: amount}("")` with a reentrancy guard.

### [M-02] Kleros ruling 0 freezes funds in Disputed state permanently (Medium)
- **Contract:** `FreelanceEscrow.sol`
- **Finding:** If the arbitrator refuses to rule, the contract enters a deadlocked state where `Disputed` cannot transition back to `Ongoing` or `Resolved`.
- **Recommendation:** Implement a fallback ruling logic for `ruling == 0`.

### [M-01] Fee rounding dust accumulation on micro-payments (Medium)
- **Finding:** Division before multiplication in fee calculations leads to significant dust accumulation for small job amounts.
- **Recommendation:** Reorder operations to `(amount * feeBps) / 10000`.

### [M-04] Rating integer truncation via floor division (Low)
- **Contract:** `FreelancerReputation.sol`
- **Finding:** Average rating is computed as an integer, losing precision for decimal ratings.
- **Recommendation:** Scale ratings by `1e18` for on-chain math.
