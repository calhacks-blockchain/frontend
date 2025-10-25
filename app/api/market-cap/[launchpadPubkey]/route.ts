import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import {
  getLaunchpadStateDecoder,
  LAUNCHPAD_STATE_DISCRIMINATOR
} from '@/lib/solana/generated/accounts/launchpadState';

const RPC_URL = process.env.RPC_URL || 'https://api.devnet.solana.com';
const connection = new Connection(RPC_URL, 'confirmed');

const LAMPORTS_PER_SOL = 1_000_000_000;

/**
 * Decodes the buffer from the launchpad state account using the generated client
 */
function decodeLaunchpadState(data: Buffer) {
  // Check if this is a launchpad state account by checking discriminator
  const discriminator = data.slice(0, 8);
  const expectedDiscriminator = new Uint8Array(LAUNCHPAD_STATE_DISCRIMINATOR);
  
  if (!discriminator.equals(expectedDiscriminator)) {
    throw new Error('Invalid launchpad account discriminator');
  }
  
  // Use the generated decoder to parse the account data
  const decoder = getLaunchpadStateDecoder();
  const launchpadState = decoder.decode(data);
  
  // Convert the values to BN for calculations
  const totalSupplyRaw = new BN(launchpadState.totalSupply.toString());
  const tokensForSaleRaw = new BN(launchpadState.tokensForSale.toString());
  const virtualSolReserves = new BN(launchpadState.virtualSolReserves.toString());
  const virtualTokenReserves = new BN(launchpadState.virtualTokenReserves.toString());
  const solRaisedRaw = new BN(launchpadState.solRaised.toString());
  const tokensSoldRaw = new BN(launchpadState.tokensSold.toString());
  
  return { 
    totalSupplyRaw, 
    tokensForSaleRaw, 
    virtualSolReserves,
    virtualTokenReserves,
    solRaisedRaw, 
    tokensSoldRaw 
  };
}

/**
 * Calculate current price using constant product AMM formula (x * y = k)
 * Formula: price = virtual_sol_reserves / virtual_token_reserves
 */
function calculateCurrentPrice(virtualSolReserves: BN, virtualTokenReserves: BN): number {
  const TOKEN_DECIMALS = 6;
  const TOKEN_MULTIPLIER = new BN(10).pow(new BN(TOKEN_DECIMALS));
  
  // Prevent division by zero
  if (virtualTokenReserves.isZero()) {
    return 0;
  }
  
  // Step 1: Calculate price for 1 atomic token in lamports, then scale to full token
  // price = sol_reserves / token_reserves
  const priceAtomicLamports = virtualSolReserves.mul(TOKEN_MULTIPLIER).div(virtualTokenReserves);
  
  // Step 2: Convert to price for 1 FULL token in SOL
  return parseFloat(priceAtomicLamports.toString()) / LAMPORTS_PER_SOL;
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

    console.log(`[LOG] Calculating market cap for: ${launchpadPubkey}`);
    
    // Fetch the launchpad account data
    const accountInfo = await connection.getAccountInfo(new PublicKey(launchpadPubkey));
    
    if (!accountInfo) {
      console.error(`[LOG] Account not found: ${launchpadPubkey}`);
      return NextResponse.json({ error: 'Launchpad account not found on-chain.' }, { status: 404 });
    }

    // Decode the state
    const { 
      totalSupplyRaw, 
      tokensForSaleRaw, 
      virtualSolReserves,
      virtualTokenReserves,
      solRaisedRaw, 
      tokensSoldRaw 
    } = decodeLaunchpadState(accountInfo.data);

    // Calculate current price
    const currentPriceSol = calculateCurrentPrice(virtualSolReserves, virtualTokenReserves);
    
    // Convert raw values to decimal
    const totalSupply = parseFloat(totalSupplyRaw.toString()) / 1e6; // Convert from atomic units (6 decimals)
    const tokensForSale = parseFloat(tokensForSaleRaw.toString()) / 1e6;
    const solRaised = parseFloat(solRaisedRaw.toString()) / LAMPORTS_PER_SOL;
    const tokensSold = parseFloat(tokensSoldRaw.toString()) / 1e6;
    
    // Calculate market cap (current price * total supply)
    const marketCapSol = currentPriceSol * totalSupply;
    
    // Calculate market cap in USD (assuming SOL price from environment or default)
    const solPriceUsd = parseFloat(process.env.SOL_PRICE_USD || '100'); // Default fallback
    const marketCapUsd = marketCapSol * solPriceUsd;
    
    console.log(`[LOG] Market cap calculation:`, {
      currentPriceSol,
      totalSupply,
      marketCapSol,
      marketCapUsd,
      solPriceUsd
    });

    return NextResponse.json({ 
      marketCapSol,
      marketCapUsd,
      currentPriceSol,
      totalSupply,
      tokensForSale,
      solRaised,
      tokensSold,
      solPriceUsd,
      // Debug values
      debug: {
        totalSupplyRaw: totalSupplyRaw.toString(),
        tokensForSaleRaw: tokensForSaleRaw.toString(),
        virtualSolReserves: virtualSolReserves.toString(),
        virtualTokenReserves: virtualTokenReserves.toString(),
        solRaisedRaw: solRaisedRaw.toString(),
        tokensSoldRaw: tokensSoldRaw.toString()
      }
    });

  } catch (e) {
    console.error('[FATAL] Failed to calculate market cap:', e);
    return NextResponse.json({ error: 'Failed to calculate market cap from the blockchain.' }, { status: 500 });
  }
}
