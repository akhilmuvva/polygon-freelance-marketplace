# Contributing to PolyLance

Thank you for your interest in contributing to PolyLance. This document covers everything you need to get a working development environment, our branching and PR conventions, and the code quality standards we enforce.

---

## Prerequisites

| Tool | Minimum Version | Notes |
|---|---|---|
| Node.js | 18.x LTS | Use `.nvmrc` — run `nvm use` |
| npm | 9.x | Comes with Node 18 |
| Hardhat | Installed via `npm install` in `contracts/` | |
| MetaMask | Latest | Required for frontend dev |
| Git | 2.x | |

Optional but recommended:
- **Solhint** — Solidity linter: `npm install -g solhint`
- **Slither** — Static analyzer: `pip3 install slither-analyzer`

---

## Local Setup

```bash
# 1. Fork and clone
git clone https://github.com/<your-username>/polygon-freelance-marketplace.git
cd polygon-freelance-marketplace

# 2. Install root dependencies
npm install

# 3. Install contract dependencies
cd contracts && npm install && cd ..

# 4. Install frontend dependencies
cd frontend && npm install && cd ..

# 5. Configure environment
cp contracts/.env.example contracts/.env
cp frontend/.env.example frontend/.env
# Edit both .env files with your own keys (see comments inside)

# 6. Compile contracts
cd contracts && npx hardhat compile

# 7. Start the frontend dev server
cd frontend && npm run dev
```

---

## Running Tests

```bash
# Unit tests (Hardhat)
cd contracts && npx hardhat test

# With gas report
REPORT_GAS=true npx hardhat test

# Solidity linting
cd contracts && npx solhint 'contracts/**/*.sol'

# Frontend linting
cd frontend && npm run lint
```

All PRs must pass the full test suite and linting checks. The CI pipeline enforces this automatically.

---

## Branch Naming Convention

| Prefix | When to use | Example |
|---|---|---|
| `feat/` | New feature | `feat/streaming-escrow` |
| `fix/` | Bug fix | `fix/sovereign-withdraw-accounting` |
| `docs/` | Documentation only | `docs/update-architecture` |
| `test/` | Adding or fixing tests | `test/escrow-dispute-coverage` |
| `refactor/` | Code restructuring | `refactor/yield-manager-interface` |
| `chore/` | Build, CI, dependency updates | `chore/upgrade-oz-5.1` |

Branch names should be lowercase, hyphen-separated, and descriptive. Avoid `patch-1`, `fix`, or `update`.

---

## Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]
[optional footer]
```

**Examples:**
```
feat(escrow): add streaming payment support via StreamingEscrow.sol
fix(governance): handle Kleros ruling 0 to prevent fund freeze
docs(readme): add architecture mermaid diagram
test(escrow): add coverage for sovereignWithdraw double-accounting bug
```

---

## Pull Request Checklist

Before marking a PR as ready for review, verify:

- [ ] `cd contracts && npx hardhat test` passes with no failures
- [ ] `cd contracts && npx solhint 'contracts/**/*.sol'` returns no errors
- [ ] `cd frontend && npm run lint` passes
- [ ] New Solidity functions have NatSpec `@notice` / `@param` / `@return` documentation
- [ ] If modifying storage layout in an upgradeable contract, `__gap` array is updated
- [ ] If adding a new contract, it is added to the **Deployed Contracts** table in README (or marked as undeployed)
- [ ] CHANGELOG.md is updated under `[Unreleased]`
- [ ] PR description explains **why** the change is needed, not just what it does

---

## Code Style

### Solidity
- Compiler version: `^0.8.20` (pinned in `hardhat.config.js`)
- Use **custom errors** instead of `require(false, "string")` — reduces gas and bytecode size
- Follow Checks-Effects-Interactions (CEI) for all functions with external calls
- All public/external functions must have NatSpec `@notice` and `@dev` comments
- State variables: `public` unless there is a specific reason for `private`/`internal`
- Run `solhint` with the project's `.solhint.json` before pushing

### JavaScript / React
- ESLint + Prettier enforced (`npm run lint` in frontend)
- Prefer `async/await` over `.then()` chains
- Use `ethers.js` v6 API (not v5 — `utils.parseEther` is now `ethers.parseEther`)
- No `console.log` in production-committed code (use the service logger pattern)

---

## Reporting Issues

- **Security vulnerabilities:** Email [security@polylance.codes](mailto:security@polylance.codes) — do **not** open a public issue.
- **Bugs:** [Open a GitHub issue](https://github.com/akhilmuvva/polygon-freelance-marketplace/issues) with reproduction steps and expected vs. actual behavior.
- **Feature requests:** Open an issue with the `enhancement` label and describe the use case before implementing.

---

## License

By contributing, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
