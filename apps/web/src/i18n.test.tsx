// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { I18nProvider, translate, useI18n } from './i18n'

function LanguageFixture() {
  const { locale, setLocale, t } = useI18n()
  return (
    <div>
      <span>{locale}</span>
      <span>{t('swap.connectWallet')}</span>
      <button type="button" onClick={() => setLocale('zh-CN')}>中文</button>
    </div>
  )
}

describe('Ammora internationalization', () => {
  beforeEach(() => window.localStorage.clear())
  afterEach(cleanup)

  it('translates interpolated interface copy', () => {
    expect(translate('en', 'swap.insufficient', { symbol: 'aETH' })).toBe('Insufficient aETH')
    expect(translate('zh-CN', 'swap.insufficient', { symbol: 'aETH' })).toBe('aETH 余额不足')
  })

  it('switches language, updates the document, and remembers the selection', () => {
    window.localStorage.setItem('ammora-locale', 'en')
    render(<I18nProvider><LanguageFixture /></I18nProvider>)

    expect(screen.getByText('Connect wallet')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '中文' }))

    expect(screen.getByText('连接钱包')).toBeTruthy()
    expect(document.documentElement.lang).toBe('zh-CN')
    expect(window.localStorage.getItem('ammora-locale')).toBe('zh-CN')
    expect(document.title).toBe('Ammora DEX · 流动性随心而动')
  })
})
