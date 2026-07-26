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
- Professional DEX dashboard with pool metrics, searchable token picker,
  transaction settings, route preview and wallet activity with BaseScan links
- Dedicated Pools, Portfolio and Activity workspaces with responsive layouts
- English and Simplified Chinese interface with a persistent language selector
- Automatic fallback across multiple Base Sepolia RPC endpoints

The dashboard reads Pair `Swap`, `Mint` and `Burn` events directly from the
Base Sepolia deployment block (`44638802`). It calculates real rolling 24-hour
volume, 0.30% fees and an annualized LP APR estimate in the browser. Wallet
activity is also reconstructed from Pair and faucet token events. No server,
database or third-party indexing service is required.

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
pnpm contract:deploy:base-sepolia --account ammora-deployer --sender "$DEPLOYER_ADDRESS"
```

The deployment command loads `BASE_SEPOLIA_RPC_URL` and `BASESCAN_API_KEY` from
the ignored root `.env.local` file, validates the required values, and passes the
BaseScan key explicitly to Foundry's Etherscan verifier. Shell environment values
take precedence when supplied.

`PRIVATE_KEY` remains an optional local-only fallback for automated testnet
deployments. Never paste it into chat, commit it, or prefix it with `VITE_`.

The deployment is broadcast sequentially and performs the full setup in one
run: factory, router, aETH, aUSD, pair creation and initial liquidity. Copy the
five logged addresses into `.env.local`, then run `pnpm check` again.

## Deployment model

The contracts are deployed and verified on Base Sepolia. The static web
application is deployed to Vercel. Contract addresses are provided through
environment variables and the shared `@ammora/contract-config` package, so no
application server or database is required.

## Status

The implementation is feature-complete for its portfolio testnet scope. Local
end-to-end validation covers deployment, faucet claims, swaps, adding liquidity
and removing liquidity. The Base Sepolia deployment is live and its source is
verified on BaseScan:

- Factory: [`0xF152...c52c`](https://sepolia.basescan.org/address/0xF152af7227C16C3D0C06a52d0DAD088B743Fc52c#code)
- Router: [`0xE3a1...E3E`](https://sepolia.basescan.org/address/0xE3a139469EBCE01E733718Be6faEA5b050CfdE3E#code)
- Pair: [`0x22a9...Ed44`](https://sepolia.basescan.org/address/0x22a9b9bEa81Ff0D23a2844A82AFEd5732c18Ed44#code)
- aETH: [`0xc144...AD33`](https://sepolia.basescan.org/address/0xc14423d1075815938d088738E824C9FcdC98AD33#code)
- aUSD: [`0x3202...0FD3`](https://sepolia.basescan.org/address/0x32029b9294D0ce36Ef1c3398dED7Bb28F04C0FD3#code)
- Web app: [ammora-dex.vercel.app](https://ammora-dex.vercel.app)
