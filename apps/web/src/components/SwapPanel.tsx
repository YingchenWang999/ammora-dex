import { useEffect, useState } from 'react'
import { isDeploymentConfigured } from '@ammora/contract-config'
import { formatTokenAmount, getPreviewAmountOut, getPriceImpact } from '../lib/amm'

type Token = {
  symbol: string
  name: string
  accent: string
}

const A_ETH: Token = { symbol: 'aETH', name: 'Ammora ETH', accent: '#2c57ff' }
const A_USD: Token = { symbol: 'aUSD', name: 'Ammora USD', accent: '#53d8c9' }

type SwapPanelProps = {
  onProgressChange: (progress: number) => void
  onConnect: () => void
  address?: string
  isConnected: boolean
  walletReady: boolean
}

export function SwapPanel({
  onProgressChange,
  onConnect,
  address,
  isConnected,
  walletReady,
}: SwapPanelProps) {
  const [amount, setAmount] = useState('1.25')
  const [inputToken, setInputToken] = useState(A_ETH)
  const [outputToken, setOutputToken] = useState(A_USD)
  const [slippage, setSlippage] = useState('0.50')

  const isEthInput = inputToken.symbol === 'aETH'
  const reserveIn = isEthInput ? 120 : 310_000
  const reserveOut = isEthInput ? 310_000 : 120
  const numericAmount = Number(amount)
  const amountOut = getPreviewAmountOut(numericAmount, reserveIn, reserveOut)
  const priceImpact = getPriceImpact(numericAmount, reserveIn)
  const curveProgress = Math.min(Math.max(numericAmount / (reserveIn * 0.12), 0), 1)

  useEffect(() => onProgressChange(curveProgress), [curveProgress, onProgressChange])

  const swapDirection = () => {
    setInputToken(outputToken)
    setOutputToken(inputToken)
    setAmount(amountOut ? formatTokenAmount(amountOut, 4) : '')
  }

  const actionLabel = !walletReady
    ? 'Add Reown project ID'
    : !isConnected
    ? 'Connect wallet'
    : !isDeploymentConfigured
      ? 'Testnet deployment pending'
      : 'Review swap'

  const handleAction = () => {
    if (walletReady && !isConnected) onConnect()
  }

  return (
    <section className="swap-card" aria-labelledby="swap-title">
      <div className="swap-card__header">
        <div>
          <span className="eyebrow">Trade</span>
          <h1 id="swap-title">Move value, not trust.</h1>
        </div>
        <label className="slippage-control">
          <span>Slippage</span>
          <span className="slippage-control__input">
            <input
              aria-label="Slippage tolerance"
              inputMode="decimal"
              value={slippage}
              onChange={(event) => setSlippage(event.target.value)}
            />
            %
          </span>
        </label>
      </div>

      <div className="token-field token-field--input">
        <div className="token-field__label">
          <span>You pay</span>
          <span>Preview balance · 8.42</span>
        </div>
        <div className="token-field__control">
          <input
            aria-label={`Amount of ${inputToken.symbol} to pay`}
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ''))}
          />
          <button className="token-select" type="button" aria-label={`Selected ${inputToken.name}`}>
            <span className="token-dot" style={{ backgroundColor: inputToken.accent }} />
            {inputToken.symbol}
            <span aria-hidden="true">⌄</span>
          </button>
        </div>
        <span className="token-field__fiat">≈ ${formatTokenAmount(numericAmount * 2_580, 2)}</span>
      </div>

      <button className="direction-button" type="button" onClick={swapDirection} aria-label="Reverse swap direction">
        <span aria-hidden="true">↓</span>
      </button>

      <div className="token-field token-field--output">
        <div className="token-field__label">
          <span>You receive</span>
          <span>Preview balance · 12,480</span>
        </div>
        <div className="token-field__control">
          <output aria-label={`Estimated ${outputToken.symbol} received`}>
            {formatTokenAmount(amountOut, 4)}
          </output>
          <button className="token-select" type="button" aria-label={`Selected ${outputToken.name}`}>
            <span className="token-dot" style={{ backgroundColor: outputToken.accent }} />
            {outputToken.symbol}
            <span aria-hidden="true">⌄</span>
          </button>
        </div>
        <span className="token-field__fiat">Preview quote · no transaction will be sent</span>
      </div>

      <dl className="trade-details">
        <div>
          <dt>Rate</dt>
          <dd>1 {inputToken.symbol} = {formatTokenAmount(amountOut / numericAmount || 0, 4)} {outputToken.symbol}</dd>
        </div>
        <div>
          <dt>Price impact</dt>
          <dd className={priceImpact > 2 ? 'is-warning' : ''}>{formatTokenAmount(priceImpact, 2)}%</dd>
        </div>
        <div>
          <dt>Minimum received</dt>
          <dd>{formatTokenAmount(amountOut * (1 - (Number(slippage) || 0) / 100), 4)} {outputToken.symbol}</dd>
        </div>
      </dl>

      <button
        className="primary-action"
        type="button"
        onClick={handleAction}
        disabled={!walletReady || (isConnected && !isDeploymentConfigured)}
      >
        {actionLabel}
        <span aria-hidden="true">↗</span>
      </button>

      <p className="wallet-caption">
        {!walletReady
          ? 'Set VITE_REOWN_PROJECT_ID to enable wallet connections'
          : isConnected && address
          ? `Connected · ${address.slice(0, 6)}…${address.slice(-4)}`
          : 'Base Sepolia · Wallet actions remain under your control'}
      </p>
    </section>
  )
}
