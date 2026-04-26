# Security Policy

## 🛡️ Responsible Disclosure
We take the security of PolyLance seriously. If you discover a vulnerability, please report it to us responsibly.

**DO NOT open a public GitHub issue for security vulnerabilities.**

### Reporting a Vulnerability
Please email [security@polylance.codes](mailto:security@polylance.codes) with the following details:
1. **Description:** Clear summary of the vulnerability.
2. **Impact:** What is the potential risk (e.g., fund theft, DoS).
3. **PoC:** Steps to reproduce or a sample exploit script.

### Audit Infrastructure
Detailed information about our security posture and previous audit findings can be found here:
- [Audit Summary](docs/security/AUDIT_SUMMARY.md)
- [Static Analysis Reports](docs/security/slither-report.md)

---

## 🛠️ Security Architecture
PolyLance follows best practices for smart contract security:
- **Checks-Effects-Interactions:** Enforced on all fund-moving functions.
- **Pull-over-Push Payments:** Users withdraw funds; the protocol does not push.
- **Role-Based Access Control:** Granular permissions via OpenZeppelin `AccessControl`.
