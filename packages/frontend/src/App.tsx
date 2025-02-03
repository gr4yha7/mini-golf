import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { hardhat, localhost } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { GameLobby } from './components/GameLobby';
import { GamePage } from './pages/GamePage';
import { ENV } from './config/env';
import { ErrorBoundary } from './components/ErrorBoundary';

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [ENV.ENVIRONMENT === 'development' ? hardhat : localhost],
  [publicProvider()]
);

const config = createConfig({
  autoConnect: true,
  publicClient,
  webSocketPublicClient,
});

export function App() {
  return (
    <WagmiConfig config={config}>
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<GameLobby />} />
            <Route path="/game/:gameId" element={<GamePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </WagmiConfig>
  );
} 