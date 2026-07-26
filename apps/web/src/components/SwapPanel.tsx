import { useEffect, useState } from 'react'
import { demoTokens, isDeploymentConfigured } from '@ammora/contract-config'
import { formatUnits, parseUnits } from 'viem'
import type { AmmoraActions } from '../hooks/useAmmoraActions'
import type { AmmoraPoolState } from '../hooks/useAmmoraPool'
import { applySlippage, formatTokenAmount, getAmountOut, getPriceImpact } from '../lib/amm'
import { useI18n } from '../i18n'
import { TransactionStatus } from './TransactionStatus'

type SwapPanelProps = {
  actions: AmmoraActions
  onProgressChange: (progress: number) => void
  onConnect: () => void
  pool: AmmoraPoolState
  isConnected: boolean
  walletReady: boolean
}

function parseAmount(value: string): bigint {
  try {
    return value && Number(value) > 0 ? parseUnits(value, 18) : 0n
  } catch {
    return 0n
  }
}

export function SwapPanel({
  actions,
  onProgressChange,
  onConnect,
  pool,
  isConnected,
  walletReady,
}: SwapPanelProps) {
  const { t } = useI18n()
  const [amount, setAmount] = useState('1')
  const [inputIndex, setInputIndex] = useState<0 | 1>(0)
  const [slippage, setSlippage] = useState('0.50')
  const inputToken = demoTokens[inputIndex]
  const outputToken = demoTokens[inputIndex === 0 ? 1 : 0]
  const amountIn = parseAmount(amount)
  const reserveIn = inputIndex === 0 ? pool.aEthReserve : pool.aUsdReserve
  const reserveOut = inputIndex === 0 ? pool.aUsdReserve : pool.aEthReserve
  const balanceIn = inputIndex === 0 ? pool.aEthBalance : pool.aUsdBalance
  const amountOut = getAmountOut(amountIn, reserveIn, reserveOut)
  const slippageBps = Math.round((Number(slippage) || 0) * 100)
  const amountOutMin = applySlippage(amountOut, slippageBps)
  const numericAmount = Number(amount)
  const numericReserve = Number(formatUnits(reserveIn, 18))
  const priceImpact = getPriceImpact(numericAmount, numericReserve)
  const curveProgress = Math.min(Math.max(numericAmount / Math.max(numericReserve * 0.12, 1), 0), 1)
  const insufficientBalance = amountIn > balanceIn

  useEffect(() => onProgressChange(curveProgress), [curveProgress, onProgressChange])

  const rate = (() => {
    if (amountIn === 0n || amountOut === 0n) return '—'
    return formatTokenAmount(Number(formatUnits(amountOut, 18)) / Number(formatUnits(amountIn, 18)), 5)
  })()

  const reverseDirection = () => {
    setInputIndex((current) => (current === 0 ? 1 : 0))
    if (amountOut > 0n) setAmount(formatTokenAmount(Number(formatUnits(amountOut, 18)), 6))
    actions.clearStatus()
  }

  const actionLabel = !walletReady
    ? t('swap.addProjectId')
    : !isConnected
      ? t('swap.connectWallet')
      : !isDeploymentConfigured
        ? t('swap.deploymentPending')
        : insufficientBalance
          ? t('swap.insufficient', { symbol: inputToken.symbol })
          : actions.busy
            ? t('swap.transactionProgress')
            : t('swap.action', { symbol: inputToken.symbol })

  const submit = () => {
    if (!isConnected) return onConnect()
    if (amountIn > 0n && amountOutMin > 0n) actions.swap(inputIndex, amountIn, amountOutMin)
  }

  return (
    <section className="swap-card" aria-labelledby="swap-title">
      <div className="swap-card__header">
        <div>
          <span className="eyebrow">{t('swap.eyebrow')}</span>
          <h1 id="swap-title">{t('swap.title')}</h1>
        </div>
        <label className="slippage-control">
          <span>{t('swap.slippage')}</span>
          <span className="slippage-control__input">
            <input
              aria-label={t('swap.slippageAria')}
              inputMode="decimal"
              value={slippage}
              onChange={(event) => setSlippage(event.target.value.replace(/[^0-9.]/g, ''))}
            />
            %
          </span>
        </label>
      </div>

      <div className="token-field token-field--input">
        <div className="token-field__label">
          <span>{t('swap.youPay')}</span>
          <span>{t('swap.balance', { amount: formatTokenAmount(Number(formatUnits(balanceIn, 18)), 4) })}</span>
        </div>
        <div className="token-field__control">
          <input
            aria-label={t('swap.amountPayAria', { symbol: inputToken.symbol })}
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ''))}
          />
          <button className="token-select" type="button" onClick={reverseDirection}>
            <span className="token-dot" style={{ backgroundColor: inputToken.accent }} />
            {inputToken.symbol}
            <span aria-hidden="true">⌄</span>
          </button>
        </div>
        <button
          className="balance-shortcut"
          type="button"
          onClick={() => setAmount(formatUnits(balanceIn, 18))}
          disabled={!isConnected || balanceIn === 0n}
        >
          {t('swap.useMax')}
        </button>
      </div>

      <button className="direction-button" type="button" onClick={reverseDirection} aria-label={t('swap.reverseAria')}>
        <span aria-hidden="true">↓</span>
      </button>

      <div className="token-field token-field--output">
        <div className="token-field__label">
          <span>{t('swap.youReceive')}</span>
          <span>{t('swap.liveQuote')}</span>
        </div>
        <div className="token-field__control">
          <output aria-label={t('swap.estimatedAria', { symbol: outputToken.symbol })}>
            {formatTokenAmount(Number(formatUnits(amountOut, 18)), 6)}
          </output>
          <button className="token-select" type="button" onClick={reverseDirection}>
            <span className="token-dot" style={{ backgroundColor: outputToken.accent }} />
            {outputToken.symbol}
            <span aria-hidden="true">⌄</span>
          </button>
        </div>
        <span className="token-field__fiat">{t('swap.minimumReceived', { amount: formatTokenAmount(Number(formatUnits(amountOutMin, 18)), 6) })}</span>
      </div>

      <dl className="trade-details">
        <div><dt>{t('swap.rate')}</dt><dd>1 {inputToken.symbol} = {rate} {outputToken.symbol}</dd></div>
        <div><dt>{t('swap.priceImpact')}</dt><dd className={priceImpact > 2 ? 'is-warning' : ''}>{formatTokenAmount(priceImpact, 2)}%</dd></div>
        <div><dt>{t('swap.lpFee')}</dt><dd>0.30%</dd></div>
      </dl>

      <TransactionStatus status={actions.status} />

      <button
        className="primary-action"
        type="button"
        onClick={submit}
        disabled={
          !walletReady ||
          actions.busy ||
          (isConnected && (!isDeploymentConfigured || amountIn === 0n || amountOut === 0n || insufficientBalance))
        }
      >
        {actionLabel}<span aria-hidden="true">↗</span>
      </button>
      <p className="wallet-caption">{t('swap.caption')}</p>
    </section>
  )
}
