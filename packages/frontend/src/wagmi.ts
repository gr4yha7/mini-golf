import { configureChains, createConfig } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
import { ENV } from './config/env'

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [sepolia],
  [publicProvider()]
)

export const config = createConfig({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({
      chains,
      options: {
        shimDisconnect: true,
      },
    }),
  ],
  publicClient,
  webSocketPublicClient
}) 