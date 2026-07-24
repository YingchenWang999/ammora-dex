import { describe, expect, it } from 'vitest'
import { formatTokenAmount, getPreviewAmountOut, getPriceImpact } from './amm'

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
})
