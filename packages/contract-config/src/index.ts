import type { Address } from 'viem'

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const

export type AmmoraDeployment = {
  chainId: 84532
  factory: Address
  router: Address
  pair: Address
  aEth: Address
  aUsd: Address
}

export const baseSepoliaDeployment: AmmoraDeployment = {
  chainId: 84532,
  factory: (import.meta.env?.VITE_AMMORA_FACTORY_ADDRESS ?? ZERO_ADDRESS) as Address,
  router: (import.meta.env?.VITE_AMMORA_ROUTER_ADDRESS ?? ZERO_ADDRESS) as Address,
  pair: (import.meta.env?.VITE_AMMORA_PAIR_ADDRESS ?? ZERO_ADDRESS) as Address,
  aEth: (import.meta.env?.VITE_AMMORA_AETH_ADDRESS ?? ZERO_ADDRESS) as Address,
  aUsd: (import.meta.env?.VITE_AMMORA_AUSD_ADDRESS ?? ZERO_ADDRESS) as Address,
}

export const isDeploymentConfigured =
  Object.values(baseSepoliaDeployment).every((value) =>
    typeof value === 'number' || value !== ZERO_ADDRESS,
  )

export const demoTokens = [
  {
    symbol: 'aETH',
    name: 'Ammora Test ETH',
    address: baseSepoliaDeployment.aEth,
    decimals: 18,
    accent: '#2c57ff',
    faucetAmount: 10n * 10n ** 18n,
  },
  {
    symbol: 'aUSD',
    name: 'Ammora Test USD',
    address: baseSepoliaDeployment.aUsd,
    decimals: 18,
    accent: '#53d8c9',
    faucetAmount: 10_000n * 10n ** 18n,
  },
] as const
