/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GAME_CONTRACT_ADDRESS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 