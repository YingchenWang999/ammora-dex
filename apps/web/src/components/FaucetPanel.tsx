import { demoTokens, isDeploymentConfigured } from '@ammora/contract-config'
import { formatUnits } from 'viem'
import type { AmmoraActions } from '../hooks/useAmmoraActions'
import type { AmmoraPoolState } from '../hooks/useAmmoraPool'
import { formatTokenAmount } from '../lib/amm'

type FaucetPanelProps = {
  actions: AmmoraActions
  isConnected: boolean
  onConnect: () => void
  pool: AmmoraPoolState
  walletReady: boolean
}

export function FaucetPanel({ actions, isConnected, onConnect, pool, walletReady }: FaucetPanelProps) {
  const balances = [pool.aEthBalance, pool.aUsdBalance]

  return (
    <aside className="faucet-panel" aria-labelledby="faucet-title">
      <div>
        <span className="eyebrow">Demo assets</span>
        <h2 id="faucet-title">Start with test tokens.</h2>
        <p>These tokens have no value and can be claimed once every 24 hours on Base Sepolia.</p>
      </div>
      <div className="faucet-actions">
        {demoTokens.map((token, index) => (
          <button
            key={token.symbol}
            type="button"
            disabled={actions.busy || !isDeploymentConfigured || !walletReady}
            onClick={() => isConnected ? actions.claim(index as 0 | 1) : onConnect()}
          >
            <span><i style={{ background: token.accent }} />Get {formatTokenAmount(Number(formatUnits(token.faucetAmount, 18)), 0)} {token.symbol}</span>
            <small>Wallet · {formatTokenAmount(Number(formatUnits(balances[index], 18)), 4)}</small>
          </button>
        ))}
      </div>
    </aside>
  )
}
