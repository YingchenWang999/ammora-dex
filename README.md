# Ammora DEX

Ammora is a testnet-first constant-product automated market maker for Base
Sepolia. The repository is a portfolio implementation of the protocol, testing
and interface layers required to create pools, provide liquidity and exchange
ERC-20 assets.

> **Security notice:** Ammora has not been professionally audited. It is not
> intended for mainnet or assets of value.

## Repository layout

```text
ammora-dex/
├── apps/web/                 React, Vite, Reown AppKit, Wagmi and Viem
├── contracts/                Solidity contracts, Foundry tests and scripts
├── packages/contract-config/ Shared chain configuration and addresses
└── .github/workflows/        Build, test and security checks
```

## Protocol scope

- Uniswap V2-style `x * y = k` constant-product pools
- Permissionless pair creation
- LP shares for proportional pool ownership
- 0.30% swap fee retained by liquidity providers
- Exact-input, single-hop swaps in the initial router
- Slippage and deadline protection
- Unit, fuzz and invariant-oriented Foundry tests

The first release deliberately excludes fee-on-transfer tokens, rebasing
tokens, flash swaps, multi-hop routing and mainnet deployment.

## Toolchain

- Solidity 0.8.36, Foundry 1.7 and OpenZeppelin Contracts 5.6
- React 18.3, TypeScript 5.9 and Vite 7
- Reown AppKit, Wagmi 3, Viem 2 and TanStack Query 5
- pnpm workspace, SCSS Modules and GitHub Actions

## Local development

Prerequisites: Node.js 24 LTS, pnpm 11 and Foundry.

```bash
cp .env.example .env.local
pnpm install
pnpm check
pnpm dev
```

Run only the contracts:

```bash
pnpm contract:test
```

## Deployment model

The contracts will be deployed and verified on Base Sepolia. The static web
application will be deployed to Vercel. Contract addresses are provided through
environment variables and the shared `@ammora/contract-config` package.

## Status

This repository currently contains the initial protocol and application
framework. Testnet deployment addresses will be added after the contract review
and deployment gate are complete.
