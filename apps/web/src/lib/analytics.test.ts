import { encodeAbiParameters, encodeEventTopics, parseAbiParameters } from 'viem'
import { describe, expect, it } from 'vitest'
import { ammoraSwapEvent } from '../contracts/abis'
import { calculateAmmoraAnalytics, createBlockRanges, LOG_BLOCK_CHUNK_SIZE, parseAmmoraPairLog } from './analytics'

const unit = 10n ** 18n

describe('Ammora onchain analytics', () => {
  it('calculates quote-token volume, 0.3% fees and annualized LP APR', () => {
    const analytics = calculateAmmoraAnalytics([
      { amount0In: 2_000n * unit, amount1In: 0n, amount0Out: 0n, amount1Out: 1n * unit },
      { amount0In: 0n, amount1In: 1n * unit, amount0Out: 1_900n * unit, amount1Out: 0n },
    ], true, 258_000n * unit)

    expect(analytics.volumeAUsd).toBe(3_900n * unit)
    expect(analytics.feesAUsd).toBe(11_700_000_000_000_000_000n)
    expect(analytics.aprPercent).toBeCloseTo(0.827616, 6)
    expect(analytics.swapCount).toBe(2)
  })

  it('uses token1 amounts when aUSD is token1 and handles an empty pool', () => {
    const analytics = calculateAmmoraAnalytics([
      { amount0In: 1n, amount1In: 50n * unit, amount0Out: 0n, amount1Out: 0n },
    ], false, 0n)

    expect(analytics.volumeAUsd).toBe(50n * unit)
    expect(analytics.feesAUsd).toBe(150_000_000_000_000_000n)
    expect(analytics.aprPercent).toBe(0)
  })

  it('creates inclusive RPC ranges without gaps or overlap', () => {
    expect(createBlockRanges(10n, 25n, 6n)).toEqual([
      { fromBlock: 10n, toBlock: 15n },
      { fromBlock: 16n, toBlock: 21n },
      { fromBlock: 22n, toBlock: 25n },
    ])
    expect(createBlockRanges(20n, 19n)).toEqual([])
    expect(LOG_BLOCK_CHUNK_SIZE).toBeLessThanOrEqual(2_000n)
  })

  it('decodes a raw Swap event log into typed amounts', () => {
    const sender = '0x1111111111111111111111111111111111111111'
    const recipient = '0x2222222222222222222222222222222222222222'
    const topics = encodeEventTopics({ abi: [ammoraSwapEvent], eventName: 'Swap', args: { sender, to: recipient } })
    const data = encodeAbiParameters(
      parseAbiParameters('uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out'),
      [100n, 0n, 0n, 40n],
    )
    const decoded = parseAmmoraPairLog(data, topics as unknown as `0x${string}`[])

    expect(decoded.eventName).toBe('Swap')
    expect(decoded.args).toMatchObject({ sender, to: recipient, amount0In: 100n, amount1Out: 40n })
  })
})
