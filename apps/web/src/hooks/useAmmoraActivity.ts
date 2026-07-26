import { baseSepoliaDeployment, isDeploymentConfigured } from '@ammora/contract-config'
import { useQuery } from '@tanstack/react-query'
import type { Address, Hash } from 'viem'
import { publicClient } from '../config/wagmi'
import { ammoraBurnEvent, ammoraMintEvent, ammoraSwapEvent, erc20TransferEvent } from '../contracts/abis'
import type { ActivityItem } from '../lib/activity'
import { AMMORA_DEPLOYMENT_BLOCK, createBlockRanges } from '../lib/analytics'

const zeroAddress = '0x0000000000000000000000000000000000000000' as Address

type PendingActivity = Omit<ActivityItem, 'timestamp'> & { blockNumber: bigint }

export function useAmmoraActivity(address?: Address) {
  const query = useQuery({
    queryKey: ['ammora-activity', address],
    enabled: isDeploymentConfigured && Boolean(address),
    staleTime: 15_000,
    refetchInterval: 30_000,
    retry: 2,
    queryFn: async (): Promise<ActivityItem[]> => {
      if (!address) return []
      const latestBlock = await publicClient.getBlockNumber()
      const ranges = createBlockRanges(AMMORA_DEPLOYMENT_BLOCK, latestBlock)

      const [swapGroups, mintGroups, burnGroups, aEthClaimGroups, aUsdClaimGroups] = await Promise.all([
        Promise.all(ranges.map((range) => publicClient.getLogs({ address: baseSepoliaDeployment.pair, event: ammoraSwapEvent, args: { to: address }, ...range }))),
        Promise.all(ranges.map((range) => publicClient.getLogs({ address: baseSepoliaDeployment.pair, event: ammoraMintEvent, args: { to: address }, ...range }))),
        Promise.all(ranges.map((range) => publicClient.getLogs({ address: baseSepoliaDeployment.pair, event: ammoraBurnEvent, args: { to: address }, ...range }))),
        Promise.all(ranges.map((range) => publicClient.getLogs({ address: baseSepoliaDeployment.aEth, event: erc20TransferEvent, args: { from: zeroAddress, to: address }, ...range }))),
        Promise.all(ranges.map((range) => publicClient.getLogs({ address: baseSepoliaDeployment.aUsd, event: erc20TransferEvent, args: { from: zeroAddress, to: address }, ...range }))),
      ])
      const aUsdIsToken0 = BigInt(baseSepoliaDeployment.aUsd) < BigInt(baseSepoliaDeployment.aEth)
      const pending: PendingActivity[] = []

      swapGroups.flat().forEach((log) => {
        if (!log.transactionHash || log.blockNumber === null) return
        const aUsdIn = (aUsdIsToken0 ? log.args.amount0In : log.args.amount1In) ?? 0n
        pending.push({
          id: `${log.transactionHash}-${log.logIndex}`,
          kind: 'swap',
          symbol: aUsdIn > 0n ? 'aUSD → aETH' : 'aETH → aUSD',
          hash: log.transactionHash,
          blockNumber: log.blockNumber,
        })
      })
      mintGroups.flat().forEach((log) => appendPoolActivity(pending, log.transactionHash, log.blockNumber, log.logIndex, 'add'))
      burnGroups.flat().forEach((log) => appendPoolActivity(pending, log.transactionHash, log.blockNumber, log.logIndex, 'remove'))
      aEthClaimGroups.flat().forEach((log) => appendClaimActivity(pending, log.transactionHash, log.blockNumber, log.logIndex, 'aETH'))
      aUsdClaimGroups.flat().forEach((log) => appendClaimActivity(pending, log.transactionHash, log.blockNumber, log.logIndex, 'aUSD'))

      const blockNumbers = [...new Set(pending.map((item) => item.blockNumber))]
      const blocks = await Promise.all(blockNumbers.map((blockNumber) => publicClient.getBlock({ blockNumber })))
      const timestamps = new Map(blocks.map((block) => [block.number, Number(block.timestamp) * 1_000]))

      return pending.map(({ blockNumber, ...item }) => ({
        ...item,
        timestamp: timestamps.get(blockNumber) ?? Date.now(),
      })).sort((a, b) => b.timestamp - a.timestamp).slice(0, 50)
    },
  })

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

function appendPoolActivity(
  target: PendingActivity[],
  hash: Hash | null,
  blockNumber: bigint | null,
  logIndex: number | null,
  kind: 'add' | 'remove',
) {
  if (!hash || blockNumber === null) return
  target.push({ id: `${hash}-${logIndex}`, kind, symbol: 'aETH + aUSD', hash, blockNumber })
}

function appendClaimActivity(
  target: PendingActivity[],
  hash: Hash | null,
  blockNumber: bigint | null,
  logIndex: number | null,
  symbol: 'aETH' | 'aUSD',
) {
  if (!hash || blockNumber === null) return
  target.push({ id: `${hash}-${logIndex}`, kind: 'claim', symbol, hash, blockNumber })
}

export type AmmoraActivityState = ReturnType<typeof useAmmoraActivity>
