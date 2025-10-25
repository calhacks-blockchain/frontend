import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import {
  getLaunchpadStateDecoder,
  LAUNCHPAD_STATE_DISCRIMINATOR,
  type LaunchpadState
} from '@/lib/solana/generated/accounts/launchpadState';

const RPC_URL = process.env.RPC_URL || 'https://api.devnet.solana.com';
const connection = new Connection(RPC_URL, 'confirmed');

const LAMPORTS_PER_SOL = 1_000_000_000;
const LAMPORTS_PER_SOL_BN = new BN(LAMPORTS_PER_SOL);

// Token decimals - VERIFY THIS MATCHES YOUR RUST CODE!
// Most SPL tokens use 9 decimals
const TOKEN_DECIMALS = 6; 
const TOKEN_MULTIPLIER = new BN(10).pow(new BN(TOKEN_DECIMALS)); // 10^9 = 1,000,000,000

/**
 * Decodes the buffer from the launchpad state account.
 */
function decodeLaunchpadState(data: Buffer) {
  const discriminator = data.slice(0, 8);
  const expectedDiscriminator = new Uint8Array(LAUNCHPAD_STATE_DISCRIMINATOR);
  
  if (!discriminator.equals(expectedDiscriminator)) {
    throw new Error('Invalid launchpad account discriminator');
  }
  
  const decoder = getLaunchpadStateDecoder();
  const launchpadState = decoder.decode(data);
  
  // These are the raw u128 and u64 values from the chain
  const virtualSolReserves = new BN(launchpadState.virtualSolReserves.toString());
  const virtualTokenReserves = new BN(launchpadState.virtualTokenReserves.toString());
  const k = new BN(launchpadState.k.toString());
  
  return { virtualSolReserves, virtualTokenReserves, k };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ launchpadPubkey: string }> }
) {
  const { launchpadPubkey } = await params;
  
  try {
    if (!launchpadPubkey) {
      return NextResponse.json({ error: 'launchpadPubkey is required' }, { status: 400 });
    }

    console.log(`[LOG] Starting price check for: ${launchpadPubkey}`);
    
    const accountInfo = await connection.getAccountInfo(new PublicKey(launchpadPubkey));
    
    if (!accountInfo) {
      console.error(`[LOG] Account not found: ${launchpadPubkey}`);
      return NextResponse.json({ error: 'Launchpad account not found on-chain.' }, { status: 404 });
    }
    console.log(`[LOG] Fetched account data (size: ${accountInfo.data.length} bytes)`);

    const { 
        virtualSolReserves, 
        virtualTokenReserves, 
        k 
    } = decodeLaunchpadState(accountInfo.data);

    console.log(`[LOG] --- Decoded State (Constant Product AMM) ---`);
    console.log(`[LOG] virtualSolReserves (lamports):  ${virtualSolReserves.toString()}`);
    console.log(`[LOG] virtualTokenReserves (atomic):  ${virtualTokenReserves.toString()}`);
    console.log(`[LOG] k (constant product):           ${k.toString()}`);
    console.log(`[LOG] --- Constants ---`);
    console.log(`[LOG] TOKEN_MULTIPLIER (10^${TOKEN_DECIMALS}): ${TOKEN_MULTIPLIER.toString()}`);
    console.log(`[LOG] LAMPORTS_PER_SOL (10^9):         ${LAMPORTS_PER_SOL}`);

    // Prevent division by zero
    if (virtualTokenReserves.isZero()) {
      return NextResponse.json({ 
        error: 'Cannot calculate price - no token reserves',
        currentPriceSol: 0
      }, { status: 400 });
    }

    // Calculate current price using constant product formula
    // Formula: price = virtual_sol_reserves / virtual_token_reserves
    // Step 1: Calculate price for 1 atomic token in lamports, then scale to full token
    const priceAtomicLamports = virtualSolReserves.mul(TOKEN_MULTIPLIER).div(virtualTokenReserves);

    console.log(`[LOG] --- Calculation ---`);
    console.log(`[LOG] currentPrice (lamports/full token): ${priceAtomicLamports.toString()}`);
    
    // Step 2: Convert lamports to SOL
    const currentPriceSol = parseFloat(priceAtomicLamports.toString()) / LAMPORTS_PER_SOL;

    console.log(`[LOG] currentPrice (SOL/full):     ${currentPriceSol}`);
    console.log(`[LOG] Returning live price for ${launchpadPubkey}: ${currentPriceSol} SOL`);

    return NextResponse.json({ 
      currentPriceSol,
      currentPriceLamports: priceAtomicLamports.toString(),
      debug: {
        amm: {
          virtualSolReserves: virtualSolReserves.toString(),
          virtualTokenReserves: virtualTokenReserves.toString(),
          k: k.toString(),
          priceAtomicLamports: priceAtomicLamports.toString()
        },
        constants: {
          tokenDecimals: TOKEN_DECIMALS,
          tokenMultiplier: TOKEN_MULTIPLIER.toString(),
          lamportsPerSol: LAMPORTS_PER_SOL
        }
      }
    });

  } catch (e) {
    console.error('[FATAL] Failed to fetch live price:', e);
    if (e instanceof Error && e.message.includes('Invalid launchpad account discriminator')) {
      return NextResponse.json({ error: 'Not a valid launchpad state account.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to fetch live price from the blockchain.' }, { status: 500 });
  }
}