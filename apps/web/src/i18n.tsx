import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Locale = 'en' | 'zh-CN'

const en = {
  'language.label': 'Language',
  'language.english': 'English',
  'language.chinese': 'Chinese',
  'meta.title': 'Ammora DEX · Liquidity in motion',
  'meta.description': 'Ammora is a testnet-first constant-product AMM built for Base Sepolia.',
  'brand.home': 'Ammora home',
  'nav.primary': 'Primary navigation',
  'nav.swap': 'Swap',
  'nav.liquidity': 'Liquidity',
  'nav.protocol': 'Protocol',
  'wallet.preview': 'Preview',
  'wallet.connect': 'Connect',
  'network.configurationPending': 'configuration pending',
  'network.rpcUnavailable': 'RPC unavailable',
  'network.syncing': 'syncing',
  'network.live': 'live',
  'network.unaudited': 'Unaudited · Testnet assets only',
  'layout.tokenSwap': 'Token swap',
  'layout.liquidityManagement': 'Liquidity management',
  'pool.awaiting': 'Awaiting pool',
  'pool.notDeployed': 'Not deployed',
  'protocol.aria': 'Protocol principles',
  'protocol.pairs': 'Permissionless pairs',
  'protocol.pricing': 'Deterministic pricing',
  'protocol.fees': 'Liquidity-owned fees',
  'protocol.contracts': 'Verifiable contracts',
  'footer.protocol': 'Ammora protocol · 2026',
  'footer.built': 'Built for Base Sepolia',
  'swap.eyebrow': 'Live trade',
  'swap.title': 'Move value, not trust.',
  'swap.slippage': 'Slippage',
  'swap.slippageAria': 'Slippage tolerance',
  'swap.youPay': 'You pay',
  'swap.balance': 'Balance · {amount}',
  'swap.amountPayAria': 'Amount of {symbol} to pay',
  'swap.useMax': 'Use max',
  'swap.reverseAria': 'Reverse swap direction',
  'swap.youReceive': 'You receive',
  'swap.liveQuote': 'Live pool quote',
  'swap.estimatedAria': 'Estimated {symbol} received',
  'swap.minimumReceived': 'Minimum received · {amount}',
  'swap.rate': 'Rate',
  'swap.priceImpact': 'Price impact',
  'swap.lpFee': 'LP fee',
  'swap.addProjectId': 'Add Reown project ID',
  'swap.connectWallet': 'Connect wallet',
  'swap.deploymentPending': 'Testnet deployment pending',
  'swap.insufficient': 'Insufficient {symbol}',
  'swap.transactionProgress': 'Transaction in progress…',
  'swap.action': 'Swap {symbol}',
  'swap.caption': 'Approvals and swaps are confirmed separately in your wallet.',
  'liquidity.eyebrow': 'LP position',
  'liquidity.title': 'Fund the curve.',
  'liquidity.operationAria': 'Liquidity operation',
  'liquidity.add': 'Add',
  'liquidity.remove': 'Remove',
  'liquidity.deposit': '{symbol} deposit',
  'liquidity.ratioHint': 'The current pool ratio is {ratio} aUSD per aETH. Unused tokens remain in your wallet.',
  'liquidity.poolShare': 'Your pool share',
  'liquidity.removePercentAria': 'Percentage of liquidity to remove',
  'liquidity.receive': 'Receive {symbol}',
  'liquidity.addAction': 'Add liquidity',
  'liquidity.removeAction': 'Remove liquidity',
  'liquidity.caption': 'A 0.50% minimum-amount guard is applied to liquidity transactions.',
  'faucet.eyebrow': 'Demo assets',
  'faucet.title': 'Start with test tokens.',
  'faucet.description': 'These tokens have no value and can be claimed once every 24 hours on Base Sepolia.',
  'faucet.get': 'Get {amount} {symbol}',
  'faucet.wallet': 'Wallet · {amount}',
  'curve.eyebrow': 'Live pool mechanics',
  'curve.title': 'Reserves move. The product holds.',
  'curve.aria': 'Constant-product reserve curve',
  'curve.description': 'The Ammora constant-product curve with a marker that responds to the entered swap amount.',
  'curve.aethReserve': 'aETH reserve',
  'curve.invariant': 'Invariant',
  'curve.lpFee': 'LP fee',
  'curve.reserves': 'Reserves',
  'transaction.view': 'View transaction ↗',
  'action.errorGeneric': 'The wallet could not complete this request.',
  'action.errorRejected': 'The request was rejected in the wallet.',
  'action.errorGas': 'Not enough Base Sepolia ETH to pay gas.',
  'action.connectFirst': 'Connect a wallet before continuing.',
  'action.rpcUnavailable': 'Base Sepolia RPC is not available.',
  'action.switching': 'Switching wallet to Base Sepolia…',
  'action.reverted': 'The transaction reverted on Base Sepolia.',
  'action.claimConfirm': 'Confirm {symbol} faucet request in your wallet…',
  'action.minting': 'Minting {symbol} on Base Sepolia…',
  'action.claimSuccess': '{symbol} test tokens received.',
  'action.approveToken': 'Approve {symbol} in your wallet…',
  'action.approvingToken': 'Approving {symbol}…',
  'action.swapConfirm': 'Confirm the swap in your wallet…',
  'action.swapping': 'Swapping on Base Sepolia…',
  'action.swapSuccess': 'Swap completed.',
  'action.addConfirm': 'Confirm liquidity deposit in your wallet…',
  'action.adding': 'Adding liquidity to Ammora…',
  'action.addSuccess': 'Liquidity added and LP tokens received.',
  'action.approveLp': 'Approve AMM-LP tokens in your wallet…',
  'action.approvingLp': 'Approving AMM-LP tokens…',
  'action.removeConfirm': 'Confirm liquidity withdrawal in your wallet…',
  'action.removing': 'Removing liquidity from Ammora…',
  'action.removeSuccess': 'Liquidity removed.',
} as const

export type TranslationKey = keyof typeof en
type TranslationValues = Record<string, string | number>

const zhCN: Record<TranslationKey, string> = {
  'language.label': '语言',
  'language.english': '英文',
  'language.chinese': '中文',
  'meta.title': 'Ammora DEX · 流动性随心而动',
  'meta.description': 'Ammora 是构建于 Base Sepolia 的测试网恒定乘积自动做市商。',
  'brand.home': 'Ammora 首页',
  'nav.primary': '主导航',
  'nav.swap': '兑换',
  'nav.liquidity': '流动性',
  'nav.protocol': '协议',
  'wallet.preview': '预览',
  'wallet.connect': '连接钱包',
  'network.configurationPending': '配置待完成',
  'network.rpcUnavailable': 'RPC 不可用',
  'network.syncing': '同步中',
  'network.live': '运行中',
  'network.unaudited': '未经审计 · 仅限测试网资产',
  'layout.tokenSwap': '代币兑换',
  'layout.liquidityManagement': '流动性管理',
  'pool.awaiting': '等待资金池',
  'pool.notDeployed': '尚未部署',
  'protocol.aria': '协议原则',
  'protocol.pairs': '无需许可的交易对',
  'protocol.pricing': '确定性定价',
  'protocol.fees': '手续费归流动性提供者',
  'protocol.contracts': '可验证合约',
  'footer.protocol': 'Ammora 协议 · 2026',
  'footer.built': '为 Base Sepolia 构建',
  'swap.eyebrow': '实时交易',
  'swap.title': '价值自由流动，无需信任。',
  'swap.slippage': '滑点',
  'swap.slippageAria': '滑点容差',
  'swap.youPay': '支付',
  'swap.balance': '余额 · {amount}',
  'swap.amountPayAria': '要支付的 {symbol} 数量',
  'swap.useMax': '最大值',
  'swap.reverseAria': '切换兑换方向',
  'swap.youReceive': '获得',
  'swap.liveQuote': '资金池实时报价',
  'swap.estimatedAria': '预计收到的 {symbol}',
  'swap.minimumReceived': '最少收到 · {amount}',
  'swap.rate': '汇率',
  'swap.priceImpact': '价格影响',
  'swap.lpFee': 'LP 手续费',
  'swap.addProjectId': '添加 Reown 项目 ID',
  'swap.connectWallet': '连接钱包',
  'swap.deploymentPending': '等待测试网部署',
  'swap.insufficient': '{symbol} 余额不足',
  'swap.transactionProgress': '交易处理中…',
  'swap.action': '兑换 {symbol}',
  'swap.caption': '授权和兑换需要分别在钱包中确认。',
  'liquidity.eyebrow': 'LP 仓位',
  'liquidity.title': '为曲线注入流动性。',
  'liquidity.operationAria': '流动性操作',
  'liquidity.add': '添加',
  'liquidity.remove': '移除',
  'liquidity.deposit': '存入 {symbol}',
  'liquidity.ratioHint': '当前资金池比例为每个 aETH 对应 {ratio} aUSD，未使用的代币会留在钱包中。',
  'liquidity.poolShare': '你的资金池份额',
  'liquidity.removePercentAria': '要移除的流动性百分比',
  'liquidity.receive': '获得 {symbol}',
  'liquidity.addAction': '添加流动性',
  'liquidity.removeAction': '移除流动性',
  'liquidity.caption': '流动性交易采用 0.50% 的最低数量保护。',
  'faucet.eyebrow': '演示资产',
  'faucet.title': '领取测试代币开始体验。',
  'faucet.description': '这些代币没有实际价值，可在 Base Sepolia 上每 24 小时领取一次。',
  'faucet.get': '领取 {amount} {symbol}',
  'faucet.wallet': '钱包 · {amount}',
  'curve.eyebrow': '资金池实时机制',
  'curve.title': '储备量变化，乘积保持不变。',
  'curve.aria': '恒定乘积储备曲线',
  'curve.description': 'Ammora 恒定乘积曲线，标记会根据输入的兑换数量变化。',
  'curve.aethReserve': 'aETH 储备',
  'curve.invariant': '恒定乘积',
  'curve.lpFee': 'LP 手续费',
  'curve.reserves': '储备量',
  'transaction.view': '查看交易 ↗',
  'action.errorGeneric': '钱包无法完成此请求。',
  'action.errorRejected': '钱包中的请求已被拒绝。',
  'action.errorGas': 'Base Sepolia ETH 不足，无法支付 Gas。',
  'action.connectFirst': '请先连接钱包。',
  'action.rpcUnavailable': 'Base Sepolia RPC 当前不可用。',
  'action.switching': '正在将钱包切换到 Base Sepolia…',
  'action.reverted': '交易已在 Base Sepolia 上回滚。',
  'action.claimConfirm': '请在钱包中确认领取 {symbol}…',
  'action.minting': '正在 Base Sepolia 上铸造 {symbol}…',
  'action.claimSuccess': '已收到 {symbol} 测试代币。',
  'action.approveToken': '请在钱包中授权 {symbol}…',
  'action.approvingToken': '正在授权 {symbol}…',
  'action.swapConfirm': '请在钱包中确认兑换…',
  'action.swapping': '正在 Base Sepolia 上兑换…',
  'action.swapSuccess': '兑换已完成。',
  'action.addConfirm': '请在钱包中确认添加流动性…',
  'action.adding': '正在向 Ammora 添加流动性…',
  'action.addSuccess': '已添加流动性并收到 LP 代币。',
  'action.approveLp': '请在钱包中授权 AMM-LP 代币…',
  'action.approvingLp': '正在授权 AMM-LP 代币…',
  'action.removeConfirm': '请在钱包中确认移除流动性…',
  'action.removing': '正在从 Ammora 移除流动性…',
  'action.removeSuccess': '流动性已移除。',
}

const messages: Record<Locale, Record<TranslationKey, string>> = { en, 'zh-CN': zhCN }
const STORAGE_KEY = 'ammora-locale'

// This colocated pure helper keeps the provider and its typed catalog in one module.
// eslint-disable-next-line react-refresh/only-export-components
export function translate(locale: Locale, key: TranslationKey, values: TranslationValues = {}): string {
  return Object.entries(values).reduce(
    (message, [name, value]) => message.replaceAll(`{${name}}`, String(value)),
    messages[locale][key],
  )
}

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (saved === 'en' || saved === 'zh-CN') return saved
  return window.navigator.language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en'
}

type I18nContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey, values?: TranslationValues) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(getInitialLocale)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, locale)
    document.documentElement.lang = locale
    document.title = translate(locale, 'meta.title')
    document.querySelector('meta[name="description"]')?.setAttribute('content', translate(locale, 'meta.description'))
  }, [locale])

  const value = useMemo<I18nContextValue>(() => ({
    locale,
    setLocale,
    t: (key, values) => translate(locale, key, values),
  }), [locale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used inside I18nProvider')
  return context
}
