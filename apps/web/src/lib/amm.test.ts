import { describe, expect, it } from 'vitest'
import { isAmmoraDeploymentConfigured } from '@ammora/contract-config'
import {
  applySlippage,
  formatTokenAmount,
  getAmountOut,
  getOptimalLiquidityAmounts,
  getPreviewAmountOut,
  getPriceImpact,
  sanitizeDecimalInput,
} from './amm'

describe('AMM preview math', () => {
  it('applies the 0.30% fee to the constant-product quote', () => {
    expect(getPreviewAmountOut(1, 120, 310_000)).toBeCloseTo(2554.36, 2)
  })

  it('returns zero for invalid input', () => {
    expect(getPreviewAmountOut(0, 120, 310_000)).toBe(0)
    expect(getPreviewAmountOut(Number.NaN, 120, 310_000)).toBe(0)
  })

  it('reports increasing price impact', () => {
    expect(getPriceImpact(10, 100)).toBeGreaterThan(getPriceImpact(1, 100))
  })

  it('formats token values without grouping separators', () => {
    expect(formatTokenAmount(1234.56789, 2)).toBe('1234.57')
  })

  it('quotes the contract fee formula with integer arithmetic', () => {
    expect(getAmountOut(10n, 100n, 100n)).toBe(9n)
    expect(getAmountOut(0n, 100n, 100n)).toBe(0n)
  })

  it('applies basis-point slippage safely', () => {
    expect(applySlippage(10_000n, 50)).toBe(9_950n)
    expect(applySlippage(10_000n, -10)).toBe(10_000n)
    expect(applySlippage(10_000n, 9_999)).toBe(5_000n)
  })

  it('selects amounts at the existing pool ratio', () => {
    expect(getOptimalLiquidityAmounts(10n, 100n, 10n, 20n)).toEqual([10n, 20n])
    expect(getOptimalLiquidityAmounts(100n, 10n, 20n, 10n)).toEqual([20n, 10n])
    expect(getOptimalLiquidityAmounts(10n, 20n, 0n, 0n)).toEqual([10n, 20n])
  })

  it('normalizes decimal input without creating invalid multiple-dot values', () => {
    expect(sanitizeDecimalInput('1..23abc')).toBe('1.23')
    expect(sanitizeDecimalInput('.123456', 4)).toBe('.1234')
  })

  it('rejects incomplete, malformed, and duplicate deployment addresses', () => {
    const valid = {
      chainId: 84532 as const,
      factory: '0x0000000000000000000000000000000000000001',
      router: '0x0000000000000000000000000000000000000002',
      pair: '0x0000000000000000000000000000000000000003',
      aEth: '0x0000000000000000000000000000000000000004',
      aUsd: '0x0000000000000000000000000000000000000005',
    }
    expect(isAmmoraDeploymentConfigured(valid)).toBe(true)
    expect(isAmmoraDeploymentConfigured({ ...valid, router: valid.factory })).toBe(false)
    expect(isAmmoraDeploymentConfigured({ ...valid, pair: 'not-an-address' })).toBe(false)
  })
})
