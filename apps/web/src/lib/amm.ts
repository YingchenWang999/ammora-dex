const FEE_MULTIPLIER = 0.997

export function getAmountOut(amountIn: bigint, reserveIn: bigint, reserveOut: bigint): bigint {
  if (amountIn <= 0n || reserveIn <= 0n || reserveOut <= 0n) return 0n
  const amountInWithFee = amountIn * 9_970n
  return (amountInWithFee * reserveOut) / (reserveIn * 10_000n + amountInWithFee)
}

export function applySlippage(amount: bigint, slippageBps: number): bigint {
  const safeBps = Math.min(Math.max(Math.round(slippageBps), 0), 5_000)
  return (amount * BigInt(10_000 - safeBps)) / 10_000n
}

export function getOptimalLiquidityAmounts(
  amountADesired: bigint,
  amountBDesired: bigint,
  reserveA: bigint,
  reserveB: bigint,
): readonly [bigint, bigint] {
  if (amountADesired <= 0n || amountBDesired <= 0n) return [0n, 0n]
  if (reserveA === 0n && reserveB === 0n) return [amountADesired, amountBDesired]
  if (reserveA <= 0n || reserveB <= 0n) return [0n, 0n]

  const amountBOptimal = (amountADesired * reserveB) / reserveA
  if (amountBOptimal <= amountBDesired) return [amountADesired, amountBOptimal]

  return [(amountBDesired * reserveA) / reserveB, amountBDesired]
}

export function sanitizeDecimalInput(value: string, maximumFractionDigits = 18): string {
  const digitsAndDots = value.replace(/[^0-9.]/g, '')
  const dotIndex = digitsAndDots.indexOf('.')
  if (dotIndex === -1) return digitsAndDots

  const whole = digitsAndDots.slice(0, dotIndex)
  const fraction = digitsAndDots
    .slice(dotIndex + 1)
    .replaceAll('.', '')
    .slice(0, maximumFractionDigits)
  return `${whole}.${fraction}`
}

export function getPreviewAmountOut(
  amountIn: number,
  reserveIn: number,
  reserveOut: number,
): number {
  if (!Number.isFinite(amountIn) || amountIn <= 0 || reserveIn <= 0 || reserveOut <= 0) {
    return 0
  }

  const amountInWithFee = amountIn * FEE_MULTIPLIER
  return (amountInWithFee * reserveOut) / (reserveIn + amountInWithFee)
}

export function getPriceImpact(amountIn: number, reserveIn: number): number {
  if (!Number.isFinite(amountIn) || amountIn <= 0 || reserveIn <= 0) return 0
  return (amountIn / (reserveIn + amountIn)) * 100
}

export function formatTokenAmount(value: number, maximumFractionDigits = 6): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits,
    useGrouping: false,
  }).format(value)
}
