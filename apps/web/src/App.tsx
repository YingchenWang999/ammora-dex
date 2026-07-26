import { useCallback, useState } from 'react'
import { isDeploymentConfigured } from '@ammora/contract-config'
import { useAccount } from 'wagmi'
import { FaucetPanel } from './components/FaucetPanel'
import { LiquidityPanel } from './components/LiquidityPanel'
import { ActivityPanel, MarketWorkspace, PoolsDirectory, PortfolioPanel } from './components/DashboardPanels'
import { SwapPanel } from './components/SwapPanel'
import { openWalletKit, walletKitConfigured } from './config/wagmi'
import { useAmmoraActions } from './hooks/useAmmoraActions'
import { useAmmoraActivity } from './hooks/useAmmoraActivity'
import { useAmmoraAnalytics } from './hooks/useAmmoraAnalytics'
import { useAmmoraPool } from './hooks/useAmmoraPool'
import { useI18n, type Locale } from './i18n'
import './styles/app.scss'

function AmmoraMark() {
  return <span className="brand-mark" aria-hidden="true"><span /><span /></span>
}

type View = 'trade' | 'pools' | 'portfolio' | 'activity'
type AmmoraExperienceProps = { onConnect: () => void; walletReady: boolean }

function AmmoraExperience({ onConnect, walletReady }: AmmoraExperienceProps) {
  const { locale, setLocale, t } = useI18n()
  const { address, isConnected } = useAccount()
  const pool = useAmmoraPool(address)
  const actions = useAmmoraActions(pool)
  const analytics = useAmmoraAnalytics(pool.aUsdReserve)
  const activity = useAmmoraActivity(address)
  const [curveProgress, setCurveProgress] = useState(0.32)
  const [view, setView] = useState<View>('trade')
  const [networkOpen, setNetworkOpen] = useState(false)
  const updateCurve = useCallback((progress: number) => setCurveProgress(progress), [])
  const networkState = !isDeploymentConfigured
    ? t('network.configurationPending')
    : pool.error ? t('network.rpcUnavailable') : pool.isLoading ? t('network.syncing') : t('network.live')

  const changeView = (nextView: View) => {
    setView(nextView)
    actions.clearStatus()
  }

  const manageLiquidity = () => {
    changeView('pools')
    requestAnimationFrame(() => document.getElementById('liquidity-manager')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label={t('brand.home')}><AmmoraMark /><span>Ammora</span><small>DEX</small></a>
        <nav aria-label={t('nav.primary')}>
          {(['trade', 'pools', 'portfolio', 'activity'] as View[]).map((item) => (
            <button key={item} className={view === item ? 'is-active' : ''} type="button" onClick={() => changeView(item)}>{t(`nav.${item}`)}</button>
          ))}
        </nav>
        <div className="header-actions">
          <div className="network-selector">
            <button type="button" onClick={() => setNetworkOpen((open) => !open)} aria-expanded={networkOpen}><span className="network-pulse" />Base Sepolia <span>⌄</span></button>
            {networkOpen && <div className="network-menu"><span>{t('network.supported')}</span><button type="button"><i className="network-pulse" />Base Sepolia <small>{t('network.active')}</small></button><p>{t('network.onlySupported')}</p></div>}
          </div>
          <div className="language-switch" role="group" aria-label={t('language.label')}>
            {(['en', 'zh-CN'] as Locale[]).map((option) => <button key={option} type="button" className={locale === option ? 'is-active' : ''} aria-pressed={locale === option} onClick={() => setLocale(option)}>{option === 'en' ? 'EN' : '中'}</button>)}
          </div>
          <button className="wallet-button" type="button" onClick={onConnect} disabled={!walletReady}>
            {!walletReady ? t('wallet.preview') : isConnected && address ? `${address.slice(0, 5)}…${address.slice(-4)}` : t('wallet.connect')}
          </button>
        </div>
      </header>

      <main id="top">
        <section className="market-rail" aria-label={t('dashboard.marketRail')}>
          <div><span className="network-pulse" /><small>{t('dashboard.network')}</small><strong>Base Sepolia</strong></div>
          <div><small>{t('dashboard.market')}</small><strong>aETH / aUSD</strong></div>
          <div><small>{t('dashboard.poolFee')}</small><strong>0.30%</strong></div>
          <div><small>{t('dashboard.status')}</small><strong title={pool.error?.message}>{networkState}</strong></div>
          <p>{t('network.unaudited')}</p>
        </section>

        {view === 'trade' && <>
          <section className="trading-dashboard" aria-label={t('layout.tokenSwap')}>
            <MarketWorkspace pool={pool} analytics={analytics} progress={curveProgress} />
            <SwapPanel actions={actions} onProgressChange={updateCurve} onConnect={onConnect} pool={pool} isConnected={isConnected} walletReady={walletReady} />
          </section>
          <section className="quick-start"><div><span className="eyebrow">{t('dashboard.quickStart')}</span><h2>{t('dashboard.needAssets')}</h2><p>{t('dashboard.needAssetsDescription')}</p></div><FaucetPanel actions={actions} isConnected={isConnected} onConnect={onConnect} pool={pool} walletReady={walletReady} /></section>
        </>}

        {view === 'pools' && <div className="page-stack">
          <PoolsDirectory pool={pool} analytics={analytics} onManage={manageLiquidity} />
          <div id="liquidity-manager"><LiquidityPanel actions={actions} isConnected={isConnected} onConnect={onConnect} pool={pool} walletReady={walletReady} /></div>
        </div>}

        {view === 'portfolio' && <div className="portfolio-grid"><PortfolioPanel pool={pool} isConnected={isConnected} onConnect={onConnect} /><FaucetPanel actions={actions} isConnected={isConnected} onConnect={onConnect} pool={pool} walletReady={walletReady} /></div>}
        {view === 'activity' && <ActivityPanel actions={actions} activity={activity} isConnected={isConnected} />}
      </main>

      <footer><span>{t('footer.protocol')}</span><span>{t('footer.built')}</span><span>{t('footer.openSource')}</span></footer>
    </div>
  )
}

function WalletEnabledApp() {
  return <AmmoraExperience onConnect={() => void openWalletKit()} walletReady />
}

export default function App() {
  return walletKitConfigured ? <WalletEnabledApp /> : <AmmoraExperience onConnect={() => undefined} walletReady={false} />
}
