import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { baseSepolia } from '@reown/appkit/networks'
import { createPublicClient, fallback, http } from 'viem'
import { baseSepolia as viemBaseSepolia } from 'viem/chains'

export const walletKitConfigured = Boolean(import.meta.env.VITE_REOWN_PROJECT_ID)
const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || 'ammora-local-preview'
const officialPublicRpc = 'https://sepolia.base.org'
const configuredRpc = import.meta.env.VITE_BASE_SEPOLIA_RPC_URL?.replace(/\/+$/, '')
const rpcUrls = [...new Set([
  configuredRpc && configuredRpc !== officialPublicRpc ? configuredRpc : undefined,
  'https://base-sepolia.drpc.org',
  officialPublicRpc,
].filter((url): url is string => Boolean(url)))]

function baseSepoliaTransport() {
  return fallback(rpcUrls.map((url) => http(url, {
    retryCount: 0,
    timeout: 10_000,
  })), { retryCount: 0 })
}

export const publicClient = createPublicClient({
  batch: { multicall: { wait: 16 } },
  chain: viemBaseSepolia,
  transport: baseSepoliaTransport(),
})

const metadata = {
  name: 'Ammora DEX',
  description: 'A testnet-first constant-product AMM on Base Sepolia.',
  url: typeof window === 'undefined' ? 'https://ammora.example' : window.location.origin,
  icons: [],
}

export const wagmiAdapter = new WagmiAdapter({
  networks: [baseSepolia],
  projectId,
  ssr: false,
  transports: {
    [baseSepolia.id]: baseSepoliaTransport(),
  },
})

let appKitPromise: ReturnType<typeof initializeAppKit> | undefined

async function initializeAppKit() {
  const { createAppKit } = await import('@reown/appkit/react')
  return createAppKit({
    adapters: [wagmiAdapter],
    networks: [baseSepolia],
    projectId,
    metadata,
    features: {
      analytics: false,
      email: false,
      socials: false,
    },
    themeMode: 'light',
    themeVariables: {
      '--w3m-accent': '#2c57ff',
      '--w3m-border-radius-master': '2px',
    },
  })
}

export async function openWalletKit(): Promise<void> {
  if (!walletKitConfigured) return
  appKitPromise ??= initializeAppKit()
  const appKit = await appKitPromise
  await appKit.open()
}

export const wagmiConfig = wagmiAdapter.wagmiConfig
