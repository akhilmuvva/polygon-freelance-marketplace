## Description

<!-- Explain the purpose of this PR. What problem does it solve or what feature does it add? Link to the related issue: "Closes #123" -->



## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Refactor (no functional change)
- [ ] Documentation update
- [ ] CI / tooling change
- [ ] Security fix

## Testing

<!-- Describe how you tested these changes. Include relevant test names or output. -->



## Checklist

- [ ] Tests pass locally (`cd contracts && npx hardhat test`)
- [ ] Contracts compile without warnings (`npx hardhat compile`)
- [ ] Frontend linting passes (`cd frontend && npm run lint`)
- [ ] Solhint passes (`cd contracts && npx solhint 'contracts/**/*.sol'`)
- [ ] `.env.example` updated if new environment variables were added
- [ ] `CHANGELOG.md` updated under `[Unreleased]`
- [ ] New public/external Solidity functions have `@notice` NatSpec documentation
- [ ] If an upgradeable contract's storage was changed, `__gap` array was adjusted
- [ ] No private keys, API keys, or secrets are included in this PR

## Contract Changes

<!-- If this PR modifies any smart contracts, answer these: -->

- **Storage layout changed:** Yes / No
- **New external calls added:** Yes / No (if yes, describe CEI pattern used)
- **Events added/modified:** Yes / No (list them)
- **Access control changes:** Yes / No

## Screenshots / Transaction Hashes

<!-- For frontend changes, add a screenshot. For contract changes, add a testnet tx hash. -->
