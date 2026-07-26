# Ammora DEX

[English](README.md) | [简体中文](README.zh-CN.md)

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
- Rate-limited aETH and aUSD test-token faucets
- Unit, fuzz and invariant-oriented Foundry tests
- Live swap, liquidity and portfolio state in the React interface

The first release deliberately excludes fee-on-transfer tokens, rebasing
tokens, flash swaps, multi-hop routing and mainnet deployment.

## Toolchain

- Solidity 0.8.36, Foundry 1.7 and OpenZeppelin Contracts 5.6
- React 18.3, TypeScript 5.9 and Vite 7
- Reown AppKit, Wagmi 3, Viem 2 and TanStack Query 5
- pnpm workspace, SCSS and GitHub Actions

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

The interface reads the deployment values from the repository-level
`.env.local`. The five contract addresses enable live pool reads; the Reown
project ID separately enables wallet connections and transactions.

## Base Sepolia deployment

Use a dedicated, funded Base Sepolia deployment wallet. The recommended route
is an encrypted Foundry keystore, so the private key never enters the project
or shell history.

```bash
cast wallet import ammora-deployer
export DEPLOYER_ADDRESS=$(cast wallet address --account ammora-deployer)
export BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
export BASESCAN_API_KEY=your_basescan_key
pnpm contract:deploy:base-sepolia -- --account ammora-deployer --sender "$DEPLOYER_ADDRESS"
```

`PRIVATE_KEY` remains an optional local-only fallback for automated testnet
deployments. Never paste it into chat, commit it, or prefix it with `VITE_`.

The deployment is broadcast sequentially and performs the full setup in one
run: factory, router, aETH, aUSD, pair creation and initial liquidity. Copy the
five logged addresses into `.env.local`, then run `pnpm check` again.

## Deployment model

The contracts will be deployed and verified on Base Sepolia. The static web
application will be deployed to Vercel. Contract addresses are provided through
environment variables and the shared `@ammora/contract-config` package, so no
application server or database is required.

## Status

The implementation is feature-complete for its portfolio testnet scope. Local
end-to-end validation covers deployment, faucet claims, swaps, adding liquidity
and removing liquidity. Public Base Sepolia and Vercel URLs are populated only
after the deployment credentials and external project configuration are ready.
