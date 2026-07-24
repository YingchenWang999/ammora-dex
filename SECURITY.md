# Security policy

Ammora DEX is an educational, testnet-first implementation. It has not been
professionally audited and must not be used with assets of value.

## Supported scope

Security reports should target the contracts and web application on the
default branch. Please do not test against third-party infrastructure or public
RPC endpoints.

## Reporting

Open a private GitHub security advisory when the repository supports it. Until
then, contact the maintainer through the email listed on their GitHub profile.
Do not publish an exploitable report before a fix is available.

## Design boundaries

- Base Sepolia only during the portfolio phase.
- No upgrade proxy or privileged liquidity withdrawal path.
- No flash-swap callback in the initial release.
- Fee-on-transfer and rebasing tokens are intentionally unsupported.
- Slippage bounds and transaction deadlines are enforced by the router.
