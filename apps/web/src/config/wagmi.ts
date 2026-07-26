import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { baseSepolia } from '@reown/appkit/networks'
import { createPublicClient, http } from 'viem'
import { baseSepolia as viemBaseSepolia } from 'viem/chains'

export const walletKitConfigured = Boolean(import.meta.env.VITE_REOWN_PROJECT_ID)
const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || 'ammora-local-preview'
const rpcUrl = import.meta.env.VITE_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'

export const publicClient = createPublicClient({
  chain: viemBaseSepolia,
  transport: http(rpcUrl),
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
    [baseSepolia.id]: http(rpcUrl),
  },
})

if (walletKitConfigured) {
  createAppKit({
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

export const wagmiConfig = wagmiAdapter.wagmiConfig
