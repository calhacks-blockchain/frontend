import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction, SystemProgram } from '@solana/web3.js';
import { getPhantomProvider } from '@/lib/phantom/auth';

const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';

export interface TransactionInstructionData {
  programId: string;
  keys: Array<{
    pubkey: string;
    isSigner: boolean;
    isWritable: boolean;
  }>;
  data: string; // base64 encoded
}

/**
 * Convert API instruction format to Solana TransactionInstruction
 */
export function createInstructionFromData(instructionData: TransactionInstructionData): TransactionInstruction {
  return new TransactionInstruction({
    programId: new PublicKey(instructionData.programId),
    keys: instructionData.keys.map(key => ({
      pubkey: new PublicKey(key.pubkey),
      isSigner: key.isSigner,
      isWritable: key.isWritable,
    })),
    data: Buffer.from(instructionData.data, 'base64'),
  });
}

/**
 * Build and send a transaction with Phantom wallet
 */
export async function buildAndSendTransaction(
  instructions: TransactionInstruction[],
  signers: Keypair[] = []
): Promise<string> {
  const provider = getPhantomProvider();
  if (!provider || !provider.isConnected) {
    throw new Error('Phantom wallet not connected');
  }

  const connection = new Connection(RPC_URL, 'confirmed');
  const transaction = new Transaction();

  // Add all instructions to transaction
  instructions.forEach(ix => transaction.add(ix));

  // Get recent blockhash
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  transaction.feePayer = provider.publicKey;

  // Sign with any additional signers (e.g., new account keypairs)
  if (signers.length > 0) {
    transaction.partialSign(...signers);
  }

  // Sign with Phantom
  const signed = await provider.signTransaction(transaction);

  // Send transaction
  const signature = await connection.sendRawTransaction(signed.serialize());

  // Wait for confirmation
  await connection.confirmTransaction({
    signature,
    blockhash,
    lastValidBlockHeight,
  });

  return signature;
}

/**
 * Send a transaction that's already been signed
 */
export async function sendSignedTransaction(signedTransaction: Transaction): Promise<string> {
  const connection = new Connection(RPC_URL, 'confirmed');
  const signature = await connection.sendRawTransaction(signedTransaction.serialize());
  
  // Wait for confirmation
  const latestBlockhash = await connection.getLatestBlockhash();
  await connection.confirmTransaction({
    signature,
    ...latestBlockhash,
  });

  return signature;
}

/**
 * Generate a new keypair for accounts
 */
export function generateKeypair(): Keypair {
  return Keypair.generate();
}

/**
 * Get SOL balance for an address
 */
export async function getBalance(address: string): Promise<number> {
  const connection = new Connection(RPC_URL, 'confirmed');
  const balance = await connection.getBalance(new PublicKey(address));
  return balance / 1e9; // Convert lamports to SOL
}

