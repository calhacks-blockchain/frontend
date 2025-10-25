import type { PublicKey, Transaction } from '@solana/web3.js';
import bs58 from 'bs58';

export interface PhantomProvider {
  isPhantom?: boolean;
  isConnected: boolean;
  connect: () => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  signMessage: (message: Uint8Array, display?: string) => Promise<{ signature: Uint8Array }>;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  publicKey: PublicKey | null;
}

export interface PhantomWindow extends Window {
  phantom?: {
    solana?: PhantomProvider;
  };
}

export function isPhantomInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  const phantomWindow = window as PhantomWindow;
  return Boolean(phantomWindow.phantom?.solana?.isPhantom);
}

export function getPhantomProvider(): PhantomProvider | null {
  if (typeof window === 'undefined') return null;
  const phantomWindow = window as PhantomWindow;
  return phantomWindow.phantom?.solana || null;
}

export function generateNonce(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

export function createSignMessage(walletAddress: string, nonce: string): string {
  return `Sign this message to authenticate with peterpan.pro\n\nWallet: ${walletAddress}\nNonce: ${nonce}\nTimestamp: ${new Date().toISOString()}`;
}

export async function connectAndSignMessage(): Promise<{
  publicKey: string;
  signature: string;
  message: string;
  nonce: string;
}> {
  if (!isPhantomInstalled()) {
    throw new Error('Phantom wallet is not installed. Please install it from phantom.app');
  }

  const provider = getPhantomProvider();
  if (!provider) {
    throw new Error('Unable to access Phantom provider');
  }

  try {
    const { publicKey } = await provider.connect();
    const walletAddress = publicKey.toString();
    const nonce = generateNonce();
    const message = createSignMessage(walletAddress, nonce);
    const encodedMessage = new TextEncoder().encode(message);
    const { signature } = await provider.signMessage(encodedMessage, 'utf8');
    const signatureBase58 = bs58.encode(signature);

    return {
      publicKey: walletAddress,
      signature: signatureBase58,
      message,
      nonce,
    };
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 4001) {
      throw new Error('User rejected the connection request');
    }
    throw error;
  }
}

export async function disconnectPhantom(): Promise<void> {
  const provider = getPhantomProvider();
  if (provider) {
    await provider.disconnect();
  }
}

