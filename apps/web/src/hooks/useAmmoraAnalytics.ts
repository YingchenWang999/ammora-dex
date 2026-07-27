import { baseSepoliaDeployment, isDeploymentConfigured } from '@ammora/contract-config'
import { useQuery } from '@tanstack/react-query'
import { publicClient } from '../config/wagmi'
import { ammoraSwapEvent } from '../contracts/abis'
import {
  AMMORA_DEPLOYMENT_BLOCK,
  BASE_BLOCKS_PER_DAY,
  calculateAmmoraAnalytics,
  createBlockRanges,
  mapWithConcurrency,
} from '../lib/analytics'

export function useAmmoraAnalytics(aUsdReserve: bigint) {
  const aUsdIsToken0 = BigInt(baseSepoliaDeployment.aUsd) < BigInt(baseSepoliaDeployment.aEth)
  const query = useQuery({
    queryKey: ['ammora-analytics'],
    enabled: isDeploymentConfigured,
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 1,
    queryFn: async () => {
      const latestBlock = await publicClient.getBlockNumber()
      const rollingStart = latestBlock > BASE_BLOCKS_PER_DAY ? latestBlock - BASE_BLOCKS_PER_DAY + 1n : 0n
      const fromBlock = rollingStart > AMMORA_DEPLOYMENT_BLOCK ? rollingStart : AMMORA_DEPLOYMENT_BLOCK
      const ranges = createBlockRanges(fromBlock, latestBlock)
      const swapGroups = await mapWithConcurrency(ranges, 2, (range) => publicClient.getLogs({
        address: baseSepoliaDeployment.pair,
        event: ammoraSwapEvent,
        ...range,
      }))
      const logs = swapGroups.flat()

      return {
        swaps: logs.map((log) => ({
          amount0In: log.args.amount0In ?? 0n,
          amount1In: log.args.amount1In ?? 0n,
          amount0Out: log.args.amount0Out ?? 0n,
          amount1Out: log.args.amount1Out ?? 0n,
        })),
        fromBlock,
        toBlock: latestBlock,
      }
    },
  })
  const analytics = calculateAmmoraAnalytics(query.data?.swaps ?? [], aUsdIsToken0, aUsdReserve)

  return {
    ...analytics,
    fromBlock: query.data?.fromBlock,
    toBlock: query.data?.toBlock,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

export type AmmoraAnalyticsState = ReturnType<typeof useAmmoraAnalytics>
