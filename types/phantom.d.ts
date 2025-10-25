import type { PublicKey, Transaction } from '@solana/web3.js';

export interface PhantomProvider {
  isPhantom?: boolean;
  isConnected: boolean;
  connect: () => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  signMessage: (
    message: Uint8Array,
    display?: string
  ) => Promise<{ signature: Uint8Array }>;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  publicKey: PublicKey | null;
}

declare global {
  interface Window {
    phantom?: {
      solana?: PhantomProvider;
    };
  }
}

export {};

