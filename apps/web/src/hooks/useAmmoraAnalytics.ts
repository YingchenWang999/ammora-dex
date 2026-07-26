import { baseSepoliaDeployment, isDeploymentConfigured } from '@ammora/contract-config'
import { useQuery } from '@tanstack/react-query'
import { publicClient } from '../config/wagmi'
import { ammoraSwapEvent } from '../contracts/abis'
import {
  AMMORA_DEPLOYMENT_BLOCK,
  BASE_BLOCKS_PER_DAY,
  calculateAmmoraAnalytics,
  createBlockRanges,
} from '../lib/analytics'

export function useAmmoraAnalytics(aUsdReserve: bigint) {
  const query = useQuery({
    queryKey: ['ammora-analytics', aUsdReserve.toString()],
    enabled: isDeploymentConfigured,
    staleTime: 15_000,
    refetchInterval: 30_000,
    retry: 2,
    queryFn: async () => {
      const latestBlock = await publicClient.getBlockNumber()
      const rollingStart = latestBlock > BASE_BLOCKS_PER_DAY ? latestBlock - BASE_BLOCKS_PER_DAY + 1n : 0n
      const fromBlock = rollingStart > AMMORA_DEPLOYMENT_BLOCK ? rollingStart : AMMORA_DEPLOYMENT_BLOCK
      const ranges = createBlockRanges(fromBlock, latestBlock)
      const swapGroups = await Promise.all(ranges.map((range) => publicClient.getLogs({
        address: baseSepoliaDeployment.pair,
        event: ammoraSwapEvent,
        ...range,
      })))
      const logs = swapGroups.flat()
      const aUsdIsToken0 = BigInt(baseSepoliaDeployment.aUsd) < BigInt(baseSepoliaDeployment.aEth)

      return {
        ...calculateAmmoraAnalytics(logs.map((log) => ({
          amount0In: log.args.amount0In ?? 0n,
          amount1In: log.args.amount1In ?? 0n,
          amount0Out: log.args.amount0Out ?? 0n,
          amount1Out: log.args.amount1Out ?? 0n,
        })), aUsdIsToken0, aUsdReserve),
        fromBlock,
        toBlock: latestBlock,
      }
    },
  })

  return {
    volumeAUsd: query.data?.volumeAUsd ?? 0n,
    feesAUsd: query.data?.feesAUsd ?? 0n,
    aprPercent: query.data?.aprPercent ?? 0,
    swapCount: query.data?.swapCount ?? 0,
    fromBlock: query.data?.fromBlock,
    toBlock: query.data?.toBlock,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

export type AmmoraAnalyticsState = ReturnType<typeof useAmmoraAnalytics>
