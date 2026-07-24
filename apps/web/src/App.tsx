import { useCallback, useState } from 'react'
import { useAppKit } from '@reown/appkit/react'
import { useAccount } from 'wagmi'
import { PoolCurve } from './components/PoolCurve'
import { SwapPanel } from './components/SwapPanel'
import { walletKitConfigured } from './config/wagmi'
import './styles/app.scss'

function AmmoraMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span />
      <span />
    </span>
  )
}

type AppContentProps = {
  address?: string
  isConnected: boolean
  onConnect: () => void
  walletReady: boolean
}

function AppContent({ address, isConnected, onConnect, walletReady }: AppContentProps) {
  const [curveProgress, setCurveProgress] = useState(0.32)
  const updateCurve = useCallback((progress: number) => setCurveProgress(progress), [])

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Ammora home">
          <AmmoraMark />
          <span>Ammora</span>
        </a>

        <nav aria-label="Primary navigation">
          <a className="is-active" href="#swap">Swap</a>
          <a href="#liquidity">Liquidity</a>
          <a href="#protocol">Protocol</a>
        </nav>

        <button
          className="wallet-button"
          type="button"
          onClick={onConnect}
          disabled={!walletReady}
        >
          <span className="network-pulse" aria-hidden="true" />
          {!walletReady
            ? 'Preview'
            : isConnected && address
              ? `${address.slice(0, 5)}…${address.slice(-4)}`
              : 'Connect'}
        </button>
      </header>

      <main id="top">
        <div className="network-strip" role="status">
          <span><span className="network-pulse" aria-hidden="true" />Base Sepolia preview</span>
          <span>Unaudited · Testnet assets only</span>
        </div>

        <section className="trade-layout" id="swap" aria-label="Swap preview">
          <SwapPanel
            onProgressChange={updateCurve}
            onConnect={onConnect}
            address={address}
            isConnected={isConnected}
            walletReady={walletReady}
          />
          <PoolCurve progress={curveProgress} />
        </section>

        <section className="protocol-strip" id="protocol" aria-label="Protocol principles">
          <p>Permissionless pairs</p>
          <p>Deterministic pricing</p>
          <p>Liquidity-owned fees</p>
          <p>Verifiable contracts</p>
        </section>
      </main>

      <footer>
        <span>Ammora protocol preview · 2026</span>
        <span>Built for Base Sepolia</span>
      </footer>
    </div>
  )
}

function WalletEnabledApp() {
  const { open } = useAppKit()
  const { address, isConnected } = useAccount()

  return (
    <AppContent
      address={address}
      isConnected={isConnected}
      onConnect={() => void open()}
      walletReady
    />
  )
}

export default function App() {
  return walletKitConfigured ? (
    <WalletEnabledApp />
  ) : (
    <AppContent isConnected={false} onConnect={() => undefined} walletReady={false} />
  )
}
