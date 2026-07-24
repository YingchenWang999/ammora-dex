import type { Address } from 'viem'

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const

export type AmmoraDeployment = {
  chainId: 84532
  factory: Address
  router: Address
}

export const baseSepoliaDeployment: AmmoraDeployment = {
  chainId: 84532,
  factory: (import.meta.env?.VITE_AMMORA_FACTORY_ADDRESS ?? ZERO_ADDRESS) as Address,
  router: (import.meta.env?.VITE_AMMORA_ROUTER_ADDRESS ?? ZERO_ADDRESS) as Address,
}

export const isDeploymentConfigured =
  baseSepoliaDeployment.factory !== ZERO_ADDRESS && baseSepoliaDeployment.router !== ZERO_ADDRESS
