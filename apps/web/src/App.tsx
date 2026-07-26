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
  const { address, isConnected } = useAccount()
  const pool = useAmmoraPool(address)
  const actions = useAmmoraActions(pool)
  const [curveProgress, setCurveProgress] = useState(0.32)
  const [view, setView] = useState<'swap' | 'liquidity'>('swap')
  const updateCurve = useCallback((progress: number) => setCurveProgress(progress), [])
  const aEthReserve = Number(formatUnits(pool.aEthReserve, 18))
  const aUsdReserve = Number(formatUnits(pool.aUsdReserve, 18))
  const invariant = (() => {
    if (!aEthReserve || !aUsdReserve) return 'Awaiting pool'
    const value = aEthReserve * aUsdReserve
    return value >= 1_000_000 ? `${formatTokenAmount(value / 1_000_000, 2)}M` : formatTokenAmount(value, 2)
  })()
  const reserveLabel = aEthReserve
    ? `${formatTokenAmount(aEthReserve, 2)} / ${formatTokenAmount(aUsdReserve, 0)}`
    : 'Not deployed'
  const networkState = !isDeploymentConfigured
    ? 'configuration pending'
    : pool.error
      ? 'RPC unavailable'
      : pool.isLoading
        ? 'syncing'
        : 'live'

  const changeView = (nextView: 'swap' | 'liquidity') => {
    setView(nextView)
    actions.clearStatus()
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Ammora home"><AmmoraMark /><span>Ammora</span></a>
        <nav aria-label="Primary navigation">
          <button className={view === 'swap' ? 'is-active' : ''} type="button" onClick={() => changeView('swap')}>Swap</button>
          <button className={view === 'liquidity' ? 'is-active' : ''} type="button" onClick={() => changeView('liquidity')}>Liquidity</button>
          <a href="#protocol">Protocol</a>
        </nav>
        <button className="wallet-button" type="button" onClick={onConnect} disabled={!walletReady}>
          <span className="network-pulse" aria-hidden="true" />
          {!walletReady ? 'Preview' : isConnected && address ? `${address.slice(0, 5)}…${address.slice(-4)}` : 'Connect'}
        </button>
      </header>

      <main id="top">
        <div className="network-strip" role="status">
          <span title={pool.error?.message}><span className="network-pulse" aria-hidden="true" />Base Sepolia · {networkState}</span>
          <span>Unaudited · Testnet assets only</span>
        </div>

        <section className="trade-layout" aria-label={view === 'swap' ? 'Token swap' : 'Liquidity management'}>
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

        <section className="protocol-strip" id="protocol" aria-label="Protocol principles">
          <p>Permissionless pairs</p><p>Deterministic pricing</p><p>Liquidity-owned fees</p><p>Verifiable contracts</p>
        </section>
      </main>

      <footer><span>Ammora protocol · 2026</span><span>Built for Base Sepolia</span></footer>
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
