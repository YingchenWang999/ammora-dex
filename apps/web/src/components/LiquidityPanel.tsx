import { useState } from 'react'
import { demoTokens, isDeploymentConfigured } from '@ammora/contract-config'
import { formatUnits, parseUnits } from 'viem'
import type { AmmoraActions } from '../hooks/useAmmoraActions'
import type { AmmoraPoolState } from '../hooks/useAmmoraPool'
import {
  applySlippage,
  formatTokenAmount,
  getOptimalLiquidityAmounts,
  sanitizeDecimalInput,
} from '../lib/amm'
import { useI18n } from '../i18n'
import { TransactionStatus } from './TransactionStatus'

type LiquidityPanelProps = {
  actions: AmmoraActions
  isConnected: boolean
  onConnect: () => void
  pool: AmmoraPoolState
  walletReady: boolean
}

function parseAmount(value: string): bigint {
  try {
    return value && Number(value) > 0 ? parseUnits(value, 18) : 0n
  } catch {
    return 0n
  }
}

export function LiquidityPanel({ actions, isConnected, onConnect, pool, walletReady }: LiquidityPanelProps) {
  const { t } = useI18n()
  const [mode, setMode] = useState<'add' | 'remove'>('add')
  const [aEthAmount, setAEthAmount] = useState('1')
  const [aUsdAmount, setAUsdAmount] = useState('2580')
  const [removePercent, setRemovePercent] = useState(50)
  const aEth = parseAmount(aEthAmount)
  const aUsd = parseAmount(aUsdAmount)
  const [aEthUsed, aUsdUsed] = getOptimalLiquidityAmounts(
    aEth,
    aUsd,
    pool.aEthReserve,
    pool.aUsdReserve,
  )
  const liquidity = (pool.lpBalance * BigInt(removePercent)) / 100n
  const estimatedAEth = pool.totalSupply > 0n ? (liquidity * pool.aEthReserve) / pool.totalSupply : 0n
  const estimatedAUsd = pool.totalSupply > 0n ? (liquidity * pool.aUsdReserve) / pool.totalSupply : 0n
  const poolShare = pool.totalSupply > 0n
    ? (Number(pool.lpBalance * 1_000_000n / pool.totalSupply) / 10_000).toFixed(4)
    : '0.0000'
  const canAdd = aEthUsed > 0n
    && aUsdUsed > 0n
    && aEthUsed <= pool.aEthBalance
    && aUsdUsed <= pool.aUsdBalance
  const canRemove = liquidity > 0n

  const ratio = (() => {
    if (pool.aEthReserve === 0n) return 0
    return Number(formatUnits(pool.aUsdReserve, 18)) / Number(formatUnits(pool.aEthReserve, 18))
  })()

  const updateAEth = (value: string) => {
    const clean = sanitizeDecimalInput(value)
    setAEthAmount(clean)
    if (ratio > 0 && clean) setAUsdAmount(formatTokenAmount(Number(clean) * ratio, 6))
  }

  const updateAUsd = (value: string) => {
    const clean = sanitizeDecimalInput(value)
    setAUsdAmount(clean)
    if (ratio > 0 && clean) setAEthAmount(formatTokenAmount(Number(clean) / ratio, 8))
  }

  const submit = () => {
    if (!isConnected) return onConnect()
    if (mode === 'add' && canAdd) {
      actions.addLiquidity(
        aEth,
        aUsd,
        applySlippage(aEthUsed, 50),
        applySlippage(aUsdUsed, 50),
      )
    } else if (mode === 'remove' && canRemove) {
      actions.removeLiquidity(liquidity, applySlippage(estimatedAEth, 50), applySlippage(estimatedAUsd, 50))
    }
  }

  const actionLabel = !walletReady
    ? t('swap.addProjectId')
    : !isConnected
      ? t('swap.connectWallet')
      : !isDeploymentConfigured
        ? t('swap.deploymentPending')
        : actions.busy
          ? t('swap.transactionProgress')
          : mode === 'add' ? t('liquidity.addAction') : t('liquidity.removeAction')

  return (
    <section className="swap-card liquidity-card" aria-labelledby="liquidity-title">
      <div className="swap-card__header">
        <div>
          <span className="eyebrow">{t('liquidity.eyebrow')}</span>
          <h1 id="liquidity-title">{t('liquidity.manageTitle')}</h1>
          <p>{t('liquidity.manageSubtitle')}</p>
        </div>
        <div className="mode-switch" aria-label={t('liquidity.operationAria')}>
          <button type="button" className={mode === 'add' ? 'is-active' : ''} onClick={() => setMode('add')}>{t('liquidity.add')}</button>
          <button type="button" className={mode === 'remove' ? 'is-active' : ''} onClick={() => setMode('remove')}>{t('liquidity.remove')}</button>
        </div>
      </div>

      {mode === 'add' ? (
        <div className="liquidity-inputs">
          <label className="liquidity-field">
            <span><span>{t('liquidity.deposit', { symbol: 'aETH' })}</span><small>{t('swap.balance', { amount: formatTokenAmount(Number(formatUnits(pool.aEthBalance, 18)), 4) })}</small></span>
            <span><input value={aEthAmount} inputMode="decimal" onChange={(event) => updateAEth(event.target.value)} /><b><i style={{ background: demoTokens[0].accent }} />aETH</b></span>
          </label>
          <div className="liquidity-plus" aria-hidden="true">+</div>
          <label className="liquidity-field">
            <span><span>{t('liquidity.deposit', { symbol: 'aUSD' })}</span><small>{t('swap.balance', { amount: formatTokenAmount(Number(formatUnits(pool.aUsdBalance, 18)), 4) })}</small></span>
            <span><input value={aUsdAmount} inputMode="decimal" onChange={(event) => updateAUsd(event.target.value)} /><b><i style={{ background: demoTokens[1].accent }} />aUSD</b></span>
          </label>
          <p className="liquidity-hint">{t('liquidity.ratioHint', { ratio: formatTokenAmount(ratio, 4) })}</p>
        </div>
      ) : (
        <div className="remove-position">
          <div className="position-summary">
            <span>{t('liquidity.poolShare')}</span>
            <strong>{poolShare}%</strong>
            <small>{formatTokenAmount(Number(formatUnits(pool.lpBalance, 18)), 6)} AMM-LP</small>
          </div>
          <input
            className="position-range"
            type="range"
            min="1"
            max="100"
            value={removePercent}
            onChange={(event) => setRemovePercent(Number(event.target.value))}
            aria-label={t('liquidity.removePercentAria')}
          />
          <div className="percentage-row">
            {[25, 50, 75, 100].map((percent) => (
              <button key={percent} type="button" className={removePercent === percent ? 'is-active' : ''} onClick={() => setRemovePercent(percent)}>{percent}%</button>
            ))}
          </div>
          <dl className="withdraw-preview">
            <div><dt>{t('liquidity.receive', { symbol: 'aETH' })}</dt><dd>{formatTokenAmount(Number(formatUnits(estimatedAEth, 18)), 6)}</dd></div>
            <div><dt>{t('liquidity.receive', { symbol: 'aUSD' })}</dt><dd>{formatTokenAmount(Number(formatUnits(estimatedAUsd, 18)), 6)}</dd></div>
          </dl>
        </div>
      )}

      <TransactionStatus status={actions.status} />
      <button
        className="primary-action"
        type="button"
        onClick={submit}
        disabled={!walletReady || actions.busy || (isConnected && (!isDeploymentConfigured || (mode === 'add' ? !canAdd : !canRemove)))}
      >
        {actionLabel}<span aria-hidden="true">↗</span>
      </button>
      <p className="wallet-caption">{t('liquidity.caption')}</p>
    </section>
  )
}
