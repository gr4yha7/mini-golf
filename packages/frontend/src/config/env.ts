import { z } from 'zod';

const EnvSchema = z.object({
  GAME_CONTRACT_ADDRESS: z.string().startsWith('0x'),
  CHAIN_ID: z.coerce.number(),
  RPC_URL: z.string().url(),
  ENVIRONMENT: z.enum(['development', 'production']).default('development'),
});

// Validate environment variables
const parsedEnv = EnvSchema.safeParse({
  GAME_CONTRACT_ADDRESS: import.meta.env.VITE_GAME_CONTRACT_ADDRESS,
  CHAIN_ID: import.meta.env.VITE_CHAIN_ID,
  RPC_URL: import.meta.env.VITE_RPC_URL,
  ENVIRONMENT: import.meta.env.VITE_ENVIRONMENT,
});

if (!parsedEnv.success) {
  throw new Error(`Environment validation failed: ${parsedEnv.error.message}`);
}

export const ENV = parsedEnv.data; 