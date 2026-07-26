import { demoTokens, isDeploymentConfigured } from '@ammora/contract-config'
import { formatUnits } from 'viem'
import type { AmmoraActions } from '../hooks/useAmmoraActions'
import type { AmmoraPoolState } from '../hooks/useAmmoraPool'
import { formatTokenAmount } from '../lib/amm'
import { useI18n } from '../i18n'

type FaucetPanelProps = {
  actions: AmmoraActions
  isConnected: boolean
  onConnect: () => void
  pool: AmmoraPoolState
  walletReady: boolean
}

export function FaucetPanel({ actions, isConnected, onConnect, pool, walletReady }: FaucetPanelProps) {
  const { t } = useI18n()
  const balances = [pool.aEthBalance, pool.aUsdBalance]

  return (
    <aside className="faucet-panel" aria-labelledby="faucet-title">
      <div>
        <span className="eyebrow">{t('faucet.eyebrow')}</span>
        <h2 id="faucet-title">{t('faucet.title')}</h2>
        <p>{t('faucet.description')}</p>
      </div>
      <div className="faucet-actions">
        {demoTokens.map((token, index) => (
          <button
            key={token.symbol}
            type="button"
            disabled={actions.busy || !isDeploymentConfigured || !walletReady}
            onClick={() => isConnected ? actions.claim(index as 0 | 1) : onConnect()}
          >
            <span><i style={{ background: token.accent }} />{t('faucet.get', { amount: formatTokenAmount(Number(formatUnits(token.faucetAmount, 18)), 0), symbol: token.symbol })}</span>
            <small>{t('faucet.wallet', { amount: formatTokenAmount(Number(formatUnits(balances[index], 18)), 4) })}</small>
          </button>
        ))}
      </div>
    </aside>
  )
}
