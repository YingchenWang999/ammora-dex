import { baseSepoliaDeployment, isDeploymentConfigured } from '@ammora/contract-config'
import { formatUnits } from 'viem'
import type { AmmoraActions } from '../hooks/useAmmoraActions'
import type { AmmoraActivityState } from '../hooks/useAmmoraActivity'
import type { AmmoraAnalyticsState } from '../hooks/useAmmoraAnalytics'
import type { AmmoraPoolState } from '../hooks/useAmmoraPool'
import { useI18n } from '../i18n'
import { mergeActivityItems } from '../lib/activity'
import { formatTokenAmount } from '../lib/amm'
import { PoolCurve } from './PoolCurve'

type PoolProps = { pool: AmmoraPoolState }
type AnalyticsProps = { analytics: AmmoraAnalyticsState }

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <article className="metric-card"><span>{label}</span><strong>{value}</strong><small>{note}</small></article>
}

export function MarketWorkspace({ pool, analytics, progress }: PoolProps & AnalyticsProps & { progress: number }) {
  const { t } = useI18n()
  const aEth = Number(formatUnits(pool.aEthReserve, 18))
  const aUsd = Number(formatUnits(pool.aUsdReserve, 18))
  const spot = aEth > 0 ? aUsd / aEth : 0
  const tvl = aUsd > 0 ? aUsd * 2 : 0
  const analyticsNote = analytics.isLoading
    ? t('dashboard.analyticsLoading')
    : analytics.error ? t('dashboard.analyticsError')
      : analytics.swapCount ? t('dashboard.analyticsLive') : t('dashboard.noSwaps')
  const volume = Number(formatUnits(analytics.volumeAUsd, 18))
  const fees = Number(formatUnits(analytics.feesAUsd, 18))

  return (
    <section className="market-workspace" aria-label={t('dashboard.marketWorkspace')}>
      <div className="metric-grid">
        <Metric label={t('dashboard.tvl')} value={tvl ? `${formatTokenAmount(tvl, 0)} aUSD` : '—'} note={tvl ? t('dashboard.liveOnchain') : t('dashboard.afterDeployment')} />
        <Metric label={t('dashboard.volume')} value={analytics.isLoading || analytics.error ? '—' : `${formatTokenAmount(volume, 2)} aUSD`} note={analyticsNote} />
        <Metric label={t('dashboard.fees')} value={analytics.isLoading || analytics.error ? '—' : `${formatTokenAmount(fees, 2)} aUSD`} note={analyticsNote} />
        <Metric label={t('dashboard.apr')} value={analytics.isLoading || analytics.error ? '—' : `${analytics.aprPercent.toFixed(2)}%`} note={analytics.swapCount ? t('dashboard.aprEstimated') : analyticsNote} />
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

export function PoolsDirectory({ pool, analytics, onManage }: PoolProps & AnalyticsProps & { onManage: () => void }) {
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
          <span role="columnheader">{t('pools.pool')}</span><span role="columnheader">{t('dashboard.tvl')}</span><span role="columnheader">{t('pools.reserves')}</span><span role="columnheader">{t('dashboard.apr')}</span><span role="columnheader">{t('pools.yourShare')}</span><span role="columnheader" aria-label={t('pools.manage')} />
        </div>
        <div className="pool-table__row" role="row">
          <div className="pair-cell" role="cell" data-label={t('pools.pool')}><span className="pair-icons"><i /><i /></span><span><strong>aETH / aUSD</strong><small>Base Sepolia · 0.30%</small></span></div>
          <strong role="cell" data-label={t('dashboard.tvl')}>{aUsd ? `${formatTokenAmount(aUsd * 2, 0)} aUSD` : '—'}</strong>
          <span className="reserve-cell" role="cell" data-label={t('pools.reserves')}><strong>{formatTokenAmount(aEth, 2)} aETH</strong><small>{formatTokenAmount(aUsd, 0)} aUSD</small></span>
          <strong role="cell" data-label={t('dashboard.apr')} title={analytics.error?.message}>{analytics.isLoading || analytics.error ? '—' : `${analytics.aprPercent.toFixed(2)}%`}</strong>
          <strong role="cell" data-label={t('pools.yourShare')}>{share}%</strong>
          <span role="cell" className="pool-table__action"><button type="button" className="secondary-action" onClick={onManage}>{t('pools.manage')}</button></span>
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

export function ActivityPanel({ actions, activity, isConnected }: { actions: AmmoraActions; activity: AmmoraActivityState; isConnected: boolean }) {
  const { locale, t } = useI18n()
  const items = mergeActivityItems(activity.items, actions.history)
  const labels = {
    claim: t('activity.claim'),
    swap: t('activity.swap'),
    add: t('activity.add'),
    remove: t('activity.remove'),
  }

  return (
    <section className="dashboard-card activity-panel" aria-labelledby="activity-title">
      <header className="section-heading"><div><span className="eyebrow">{t('activity.eyebrow')}</span><h1 id="activity-title">{t('activity.title')}</h1></div><span className="status-chip">{t('activity.onchain')}</span></header>
      {items.length ? (
        <div className="activity-list">
          {items.map((item) => (
            <article key={item.id}>
              <span className="activity-signal">↗</span>
              <span><strong>{labels[item.kind]}</strong><small>{item.symbol ?? 'aETH / aUSD'}</small></span>
              <time dateTime={new Date(item.timestamp).toISOString()}>{new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(item.timestamp)}</time>
              <a href={`https://sepolia.basescan.org/tx/${item.hash}`} target="_blank" rel="noreferrer">BaseScan ↗</a>
            </article>
          ))}
        </div>
      ) : <ActivityEmptyState isConnected={isConnected} loading={activity.isLoading} error={activity.error} />}
    </section>
  )
}

function ActivityEmptyState({ isConnected, loading, error }: { isConnected: boolean; loading: boolean; error: Error | null }) {
  const { t } = useI18n()
  const title = !isConnected ? t('activity.connectTitle') : loading ? t('activity.loadingTitle') : error ? t('activity.errorTitle') : t('activity.emptyTitle')
  const description = !isConnected ? t('activity.connectDescription') : loading ? t('activity.loadingDescription') : error ? t('activity.errorDescription') : t('activity.emptyDescription')
  return <div className="empty-state" title={error?.message}><span>↗</span><h2>{title}</h2><p>{description}</p></div>
}
