import { useCallback, useEffect, useMemo, useState } from 'react'
import { demoTokens } from '@ammora/contract-config'
import { formatUnits } from 'viem'
import { useI18n } from '../i18n'
import { formatTokenAmount } from '../lib/amm'

type TokenPickerProps = {
  balances: readonly [bigint, bigint]
  onClose: () => void
  onSelect: (index: 0 | 1) => void
  open: boolean
  selectedIndex: 0 | 1
}

export function TokenPicker({ balances, onClose, onSelect, open, selectedIndex }: TokenPickerProps) {
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const closePicker = useCallback(() => {
    setQuery('')
    onClose()
  }, [onClose])
  const filteredTokens = useMemo(() => demoTokens
    .map((token, index) => ({ token, index: index as 0 | 1 }))
    .filter(({ token }) => `${token.symbol} ${token.name}`.toLowerCase().includes(query.toLowerCase())), [query])

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closePicker()
    }
    if (open) window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [closePicker, open])

  if (!open) return null

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) closePicker()
    }}>
      <section className="token-picker" role="dialog" aria-modal="true" aria-labelledby="token-picker-title">
        <header>
          <div>
            <span className="eyebrow">{t('tokenPicker.eyebrow')}</span>
            <h2 id="token-picker-title">{t('tokenPicker.title')}</h2>
          </div>
          <button className="icon-button" type="button" onClick={closePicker} aria-label={t('common.close')}>×</button>
        </header>
        <label className="token-search">
          <span aria-hidden="true">⌕</span>
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('tokenPicker.search')}
            aria-label={t('tokenPicker.search')}
          />
        </label>
        <div className="token-list">
          {filteredTokens.map(({ token, index }) => (
            <button
              key={token.symbol}
              type="button"
              className={selectedIndex === index ? 'is-selected' : ''}
              onClick={() => { onSelect(index); closePicker() }}
            >
              <i style={{ background: token.accent }}>{token.symbol.slice(1, 2)}</i>
              <span><strong>{token.symbol}</strong><small>{token.name}</small></span>
              <span className="token-list__balance">
                <small>{t('tokenPicker.balance')}</small>
                <strong>{formatTokenAmount(Number(formatUnits(balances[index], 18)), 4)}</strong>
              </span>
            </button>
          ))}
        </div>
        <p className="token-picker__note">{t('tokenPicker.testnetOnly')}</p>
      </section>
    </div>
  )
}
