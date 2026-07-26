import { useCallback, useState } from 'react'
import { useAppKit } from '@reown/appkit/react'
import { isDeploymentConfigured } from '@ammora/contract-config'
import { useAccount } from 'wagmi'
import { formatUnits } from 'viem'
import { FaucetPanel } from './components/FaucetPanel'
import { LiquidityPanel } from './components/LiquidityPanel'
import { PoolCurve } from './components/PoolCurve'
import { SwapPanel } from './components/SwapPanel'
import { walletKitConfigured } from './config/wagmi'
import { useAmmoraActions } from './hooks/useAmmoraActions'
import { useAmmoraPool } from './hooks/useAmmoraPool'
import { useI18n, type Locale } from './i18n'
import { formatTokenAmount } from './lib/amm'
import './styles/app.scss'

function AmmoraMark() {
  return <span className="brand-mark" aria-hidden="true"><span /><span /></span>
}

type AmmoraExperienceProps = {
  onConnect: () => void
  walletReady: boolean
}

function AmmoraExperience({ onConnect, walletReady }: AmmoraExperienceProps) {
  const { locale, setLocale, t } = useI18n()
  const { address, isConnected } = useAccount()
  const pool = useAmmoraPool(address)
  const actions = useAmmoraActions(pool)
  const [curveProgress, setCurveProgress] = useState(0.32)
  const [view, setView] = useState<'swap' | 'liquidity'>('swap')
  const updateCurve = useCallback((progress: number) => setCurveProgress(progress), [])
  const aEthReserve = Number(formatUnits(pool.aEthReserve, 18))
  const aUsdReserve = Number(formatUnits(pool.aUsdReserve, 18))
  const invariant = (() => {
    if (!aEthReserve || !aUsdReserve) return t('pool.awaiting')
    const value = aEthReserve * aUsdReserve
    return value >= 1_000_000 ? `${formatTokenAmount(value / 1_000_000, 2)}M` : formatTokenAmount(value, 2)
  })()
  const reserveLabel = aEthReserve
    ? `${formatTokenAmount(aEthReserve, 2)} / ${formatTokenAmount(aUsdReserve, 0)}`
    : t('pool.notDeployed')
  const networkState = !isDeploymentConfigured
    ? t('network.configurationPending')
    : pool.error
      ? t('network.rpcUnavailable')
      : pool.isLoading
        ? t('network.syncing')
        : t('network.live')

  const changeView = (nextView: 'swap' | 'liquidity') => {
    setView(nextView)
    actions.clearStatus()
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label={t('brand.home')}><AmmoraMark /><span>Ammora</span></a>
        <nav aria-label={t('nav.primary')}>
          <button className={view === 'swap' ? 'is-active' : ''} type="button" onClick={() => changeView('swap')}>{t('nav.swap')}</button>
          <button className={view === 'liquidity' ? 'is-active' : ''} type="button" onClick={() => changeView('liquidity')}>{t('nav.liquidity')}</button>
          <a href="#protocol">{t('nav.protocol')}</a>
        </nav>
        <div className="header-actions">
          <div className="language-switch" role="group" aria-label={t('language.label')}>
            {(['en', 'zh-CN'] as Locale[]).map((option) => (
              <button
                key={option}
                type="button"
                className={locale === option ? 'is-active' : ''}
                aria-pressed={locale === option}
                onClick={() => setLocale(option)}
              >
                {option === 'en' ? 'EN' : '中文'}
              </button>
            ))}
          </div>
          <button className="wallet-button" type="button" onClick={onConnect} disabled={!walletReady}>
            <span className="network-pulse" aria-hidden="true" />
            {!walletReady ? t('wallet.preview') : isConnected && address ? `${address.slice(0, 5)}…${address.slice(-4)}` : t('wallet.connect')}
          </button>
        </div>
      </header>

      <main id="top">
        <div className="network-strip" role="status">
          <span title={pool.error?.message}><span className="network-pulse" aria-hidden="true" />Base Sepolia · {networkState}</span>
          <span>{t('network.unaudited')}</span>
        </div>

        <section className="trade-layout" aria-label={view === 'swap' ? t('layout.tokenSwap') : t('layout.liquidityManagement')}>
          {view === 'swap' ? (
            <SwapPanel
              actions={actions}
              onProgressChange={updateCurve}
              onConnect={onConnect}
              pool={pool}
              isConnected={isConnected}
              walletReady={walletReady}
            />
          ) : (
            <LiquidityPanel
              actions={actions}
              isConnected={isConnected}
              onConnect={onConnect}
              pool={pool}
              walletReady={walletReady}
            />
          )}
          <PoolCurve progress={curveProgress} invariant={invariant} reserves={reserveLabel} />
        </section>

        <FaucetPanel actions={actions} isConnected={isConnected} onConnect={onConnect} pool={pool} walletReady={walletReady} />

        <section className="protocol-strip" id="protocol" aria-label={t('protocol.aria')}>
          <p>{t('protocol.pairs')}</p><p>{t('protocol.pricing')}</p><p>{t('protocol.fees')}</p><p>{t('protocol.contracts')}</p>
        </section>
      </main>

      <footer><span>{t('footer.protocol')}</span><span>{t('footer.built')}</span></footer>
    </div>
  )
}

function WalletEnabledApp() {
  const { open } = useAppKit()
  return <AmmoraExperience onConnect={() => void open()} walletReady />
}

export default function App() {
  return walletKitConfigured
    ? <WalletEnabledApp />
    : <AmmoraExperience onConnect={() => undefined} walletReady={false} />
}
