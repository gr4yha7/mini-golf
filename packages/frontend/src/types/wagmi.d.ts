import { WatchContractEventCallback as BaseWatchContractEventCallback } from '@wagmi/core';

declare module 'wagmi' {
  export type WatchContractEventCallback<
    TAbi extends readonly unknown[] = readonly unknown[],
    TEventName extends string = string
  > = BaseWatchContractEventCallback<TAbi, TEventName>;
} 