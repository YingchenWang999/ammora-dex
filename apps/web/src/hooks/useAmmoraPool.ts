import { baseSepoliaDeployment, demoTokens, isDeploymentConfigured } from '@ammora/contract-config'
import { useQuery } from '@tanstack/react-query'
import type { Address } from 'viem'
import { publicClient } from '../config/wagmi'
import { ammoraPairAbi, demoTokenAbi } from '../contracts/abis'

const zeroAddress = '0x0000000000000000000000000000000000000000' as Address

export function useAmmoraPool(address?: Address) {
  const owner = address ?? zeroAddress
  const tokenA = demoTokens[0]
  const tokenB = demoTokens[1]
  const query = useQuery({
    queryKey: ['ammora-pool', owner],
    enabled: isDeploymentConfigured,
    refetchInterval: 12_000,
    queryFn: async () => Promise.all([
      publicClient.readContract({ address: tokenA.address, abi: demoTokenAbi, functionName: 'balanceOf', args: [owner] }),
      publicClient.readContract({ address: tokenB.address, abi: demoTokenAbi, functionName: 'balanceOf', args: [owner] }),
      publicClient.readContract({ address: tokenA.address, abi: demoTokenAbi, functionName: 'allowance', args: [owner, baseSepoliaDeployment.router] }),
      publicClient.readContract({ address: tokenB.address, abi: demoTokenAbi, functionName: 'allowance', args: [owner, baseSepoliaDeployment.router] }),
      publicClient.readContract({ address: baseSepoliaDeployment.pair, abi: ammoraPairAbi, functionName: 'getReserves' }),
      publicClient.readContract({ address: baseSepoliaDeployment.pair, abi: ammoraPairAbi, functionName: 'token0' }),
      publicClient.readContract({ address: baseSepoliaDeployment.pair, abi: ammoraPairAbi, functionName: 'totalSupply' }),
      publicClient.readContract({ address: baseSepoliaDeployment.pair, abi: ammoraPairAbi, functionName: 'balanceOf', args: [owner] }),
      publicClient.readContract({ address: baseSepoliaDeployment.pair, abi: ammoraPairAbi, functionName: 'allowance', args: [owner, baseSepoliaDeployment.router] }),
    ]),
  })

  const values = query.data
  const rawReserves = values?.[4]
  const token0 = values?.[5] as Address | undefined
  const aEthIsToken0 = token0?.toLowerCase() === tokenA.address.toLowerCase()

  return {
    aEthBalance: values?.[0] ?? 0n,
    aUsdBalance: values?.[1] ?? 0n,
    aEthAllowance: values?.[2] ?? 0n,
    aUsdAllowance: values?.[3] ?? 0n,
    aEthReserve: rawReserves ? rawReserves[aEthIsToken0 ? 0 : 1] : 0n,
    aUsdReserve: rawReserves ? rawReserves[aEthIsToken0 ? 1 : 0] : 0n,
    totalSupply: values?.[6] ?? 0n,
    lpBalance: values?.[7] ?? 0n,
    lpAllowance: values?.[8] ?? 0n,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

export type AmmoraPoolState = ReturnType<typeof useAmmoraPool>
