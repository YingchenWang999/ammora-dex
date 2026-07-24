const FEE_MULTIPLIER = 0.997

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
