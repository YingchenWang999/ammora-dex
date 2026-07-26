import { baseSepoliaDeployment, isDeploymentConfigured } from '@ammora/contract-config'
import { formatUnits } from 'viem'
import type { AmmoraActions } from '../hooks/useAmmoraActions'
import type { AmmoraPoolState } from '../hooks/useAmmoraPool'
import { useI18n } from '../i18n'
import { formatTokenAmount } from '../lib/amm'
import { PoolCurve } from './PoolCurve'

type PoolProps = { pool: AmmoraPoolState }

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <article className="metric-card"><span>{label}</span><strong>{value}</strong><small>{note}</small></article>
}

export function MarketWorkspace({ pool, progress }: PoolProps & { progress: number }) {
  const { t } = useI18n()
  const aEth = Number(formatUnits(pool.aEthReserve, 18))
  const aUsd = Number(formatUnits(pool.aUsdReserve, 18))
  const spot = aEth > 0 ? aUsd / aEth : 0
  const tvl = aUsd > 0 ? aUsd * 2 : 0

  return (
    <section className="market-workspace" aria-label={t('dashboard.marketWorkspace')}>
      <div className="metric-grid">
        <Metric label={t('dashboard.tvl')} value={tvl ? `${formatTokenAmount(tvl, 0)} aUSD` : '—'} note={tvl ? t('dashboard.liveOnchain') : t('dashboard.afterDeployment')} />
        <Metric label={t('dashboard.volume')} value="—" note={t('dashboard.indexerRequired')} />
        <Metric label={t('dashboard.fees')} value="—" note={t('dashboard.indexerRequired')} />
        <Metric label={t('dashboard.apr')} value="—" note={t('dashboard.indexerRequired')} />
      </div>
      <PoolCurve
        invariant={aEth && aUsd ? formatTokenAmount(aEth * aUsd, 2) : t('pool.awaiting')}
        progress={progress}
        rate={spot ? formatTokenAmount(spot, 4) : '—'}
        reserves={`${formatTokenAmount(aEth, 2)} / ${formatTokenAmount(aUsd, 0)}`}
      />
    </section>
  )
}

export function PoolsDirectory({ pool, onManage }: PoolProps & { onManage: () => void }) {
  const { t } = useI18n()
  const aEth = Number(formatUnits(pool.aEthReserve, 18))
  const aUsd = Number(formatUnits(pool.aUsdReserve, 18))
  const share = pool.totalSupply > 0n
    ? (Number((pool.lpBalance * 1_000_000n) / pool.totalSupply) / 10_000).toFixed(4)
    : '0.0000'

  return (
    <section className="dashboard-card pools-directory" aria-labelledby="pools-title">
      <header className="section-heading">
        <div><span className="eyebrow">{t('pools.eyebrow')}</span><h1 id="pools-title">{t('pools.title')}</h1></div>
        <span className={`status-chip ${isDeploymentConfigured ? 'is-live' : ''}`}>{isDeploymentConfigured ? t('pools.active') : t('pools.pending')}</span>
      </header>
      <div className="pool-table" role="table" aria-label={t('pools.title')}>
        <div className="pool-table__head" role="row">
          <span>{t('pools.pool')}</span><span>{t('dashboard.tvl')}</span><span>{t('pools.reserves')}</span><span>{t('dashboard.apr')}</span><span>{t('pools.yourShare')}</span><span />
        </div>
        <div className="pool-table__row" role="row">
          <div className="pair-cell"><span className="pair-icons"><i /><i /></span><span><strong>aETH / aUSD</strong><small>Base Sepolia · 0.30%</small></span></div>
          <strong>{aUsd ? `${formatTokenAmount(aUsd * 2, 0)} aUSD` : '—'}</strong>
          <span className="reserve-cell"><strong>{formatTokenAmount(aEth, 2)} aETH</strong><small>{formatTokenAmount(aUsd, 0)} aUSD</small></span>
          <strong>—</strong>
          <strong>{share}%</strong>
          <button type="button" className="secondary-action" onClick={onManage}>{t('pools.manage')}</button>
        </div>
      </div>
      <div className="contract-links">
        <span>{t('pools.contracts')}</span>
        {isDeploymentConfigured ? (
          <>
            <a href={`https://sepolia.basescan.org/address/${baseSepoliaDeployment.pair}`} target="_blank" rel="noreferrer">{t('pools.pairContract')} ↗</a>
            <a href={`https://sepolia.basescan.org/address/${baseSepoliaDeployment.router}`} target="_blank" rel="noreferrer">{t('pools.routerContract')} ↗</a>
          </>
        ) : <small>{t('pools.addressesPending')}</small>}
      </div>
    </section>
  )
}

export function PortfolioPanel({ pool, isConnected, onConnect }: PoolProps & { isConnected: boolean; onConnect: () => void }) {
  const { t } = useI18n()
  const aEth = Number(formatUnits(pool.aEthBalance, 18))
  const aUsd = Number(formatUnits(pool.aUsdBalance, 18))
  const spot = pool.aEthReserve > 0n ? Number(pool.aUsdReserve) / Number(pool.aEthReserve) : 0
  const estimatedValue = aUsd + aEth * spot
  const share = pool.totalSupply > 0n ? Number((pool.lpBalance * 1_000_000n) / pool.totalSupply) / 10_000 : 0

  return (
    <section className="dashboard-card portfolio-panel" aria-labelledby="portfolio-title">
      <header className="section-heading">
        <div><span className="eyebrow">{t('portfolio.eyebrow')}</span><h1 id="portfolio-title">{t('portfolio.title')}</h1></div>
        {!isConnected && <button type="button" className="secondary-action" onClick={onConnect}>{t('swap.connectWallet')}</button>}
      </header>
      <div className="portfolio-value"><span>{t('portfolio.estimatedValue')}</span><strong>{isConnected && estimatedValue ? `${formatTokenAmount(estimatedValue, 2)} aUSD` : '—'}</strong><small>{t('portfolio.testnetValue')}</small></div>
      <div className="asset-list">
        <article><i className="asset-icon asset-icon--eth">E</i><span><strong>aETH</strong><small>Ammora Test ETH</small></span><strong>{formatTokenAmount(aEth, 4)}</strong></article>
        <article><i className="asset-icon asset-icon--usd">$</i><span><strong>aUSD</strong><small>Ammora Test USD</small></span><strong>{formatTokenAmount(aUsd, 2)}</strong></article>
        <article><i className="asset-icon asset-icon--lp">LP</i><span><strong>AMM-LP</strong><small>{t('portfolio.poolPosition')}</small></span><strong>{formatTokenAmount(Number(formatUnits(pool.lpBalance, 18)), 6)}</strong></article>
      </div>
      <div className="position-card"><span>{t('portfolio.poolShare')}</span><strong>{share.toFixed(4)}%</strong><small>aETH / aUSD</small></div>
    </section>
  )
}

export function ActivityPanel({ actions }: { actions: AmmoraActions }) {
  const { locale, t } = useI18n()
  const labels = {
    claim: t('activity.claim'),
    swap: t('activity.swap'),
    add: t('activity.add'),
    remove: t('activity.remove'),
  }

  return (
    <section className="dashboard-card activity-panel" aria-labelledby="activity-title">
      <header className="section-heading"><div><span className="eyebrow">{t('activity.eyebrow')}</span><h1 id="activity-title">{t('activity.title')}</h1></div><span className="status-chip">{t('activity.session')}</span></header>
      {actions.history.length ? (
        <div className="activity-list">
          {actions.history.map((item) => (
            <article key={item.id}>
              <span className="activity-signal">↗</span>
              <span><strong>{labels[item.kind]}</strong><small>{item.symbol ?? 'aETH / aUSD'}</small></span>
              <time dateTime={new Date(item.timestamp).toISOString()}>{new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(item.timestamp)}</time>
              <a href={`https://sepolia.basescan.org/tx/${item.hash}`} target="_blank" rel="noreferrer">BaseScan ↗</a>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state"><span>↗</span><h2>{t('activity.emptyTitle')}</h2><p>{t('activity.emptyDescription')}</p></div>
      )}
    </section>
  )
}
