import { decodeEventLog, type Hex } from 'viem'
import { ammoraPairEventsAbi } from '../contracts/abis'

export const AMMORA_DEPLOYMENT_BLOCK = 44_638_802n
export const BASE_BLOCKS_PER_DAY = 43_200n
// Base's public RPC caps eth_getLogs at 2,000 blocks. Stay below that limit so
// analytics and wallet history work without requiring a paid archive endpoint.
export const LOG_BLOCK_CHUNK_SIZE = 1_900n
export const SWAP_FEE_BPS = 30n

const BPS = 10_000n
const APR_SCALE = 1_000_000n

export type BlockRange = { fromBlock: bigint; toBlock: bigint }

export type SwapAmounts = {
  amount0In: bigint
  amount1In: bigint
  amount0Out: bigint
  amount1Out: bigint
}

export type AmmoraAnalytics = {
  volumeAUsd: bigint
  feesAUsd: bigint
  aprPercent: number
  swapCount: number
}

export function createBlockRanges(fromBlock: bigint, toBlock: bigint, chunkSize = LOG_BLOCK_CHUNK_SIZE): BlockRange[] {
  if (toBlock < fromBlock || chunkSize <= 0n) return []

  const ranges: BlockRange[] = []
  for (let start = fromBlock; start <= toBlock; start += chunkSize) {
    ranges.push({ fromBlock: start, toBlock: start + chunkSize - 1n > toBlock ? toBlock : start + chunkSize - 1n })
  }
  return ranges
}

export function calculateAmmoraAnalytics(
  swaps: readonly SwapAmounts[],
  aUsdIsToken0: boolean,
  aUsdReserve: bigint,
): AmmoraAnalytics {
  const volumeAUsd = swaps.reduce((total, swap) => total + (aUsdIsToken0
    ? swap.amount0In + swap.amount0Out
    : swap.amount1In + swap.amount1Out), 0n)
  const feesAUsd = volumeAUsd * SWAP_FEE_BPS / BPS
  const tvlAUsd = aUsdReserve * 2n
  const aprPercent = tvlAUsd > 0n
    ? Number(feesAUsd * 365n * 100n * APR_SCALE / tvlAUsd) / Number(APR_SCALE)
    : 0

  return { volumeAUsd, feesAUsd, aprPercent, swapCount: swaps.length }
}

export function parseAmmoraPairLog(data: Hex, topics: readonly Hex[]) {
  return decodeEventLog({ abi: ammoraPairEventsAbi, data, topics: [...topics] as [Hex, ...Hex[]] })
}
