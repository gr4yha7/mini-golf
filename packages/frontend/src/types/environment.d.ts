/// <reference types="vite/client" />

import { Hex } from 'viem';

interface ImportMetaEnv {
  readonly VITE_GAME_CONTRACT_ADDRESS: Hex;
  readonly VITE_CHAIN_ID: string;
  readonly VITE_RPC_URL: string;
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 