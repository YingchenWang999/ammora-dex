import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import '@fontsource-variable/space-grotesk'
import '@fontsource-variable/manrope'
import '@fontsource/ibm-plex-mono/500.css'
import { wagmiConfig } from './config/wagmi'
import App from './App'
import { I18nProvider } from './i18n'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <App />
        </I18nProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
)
