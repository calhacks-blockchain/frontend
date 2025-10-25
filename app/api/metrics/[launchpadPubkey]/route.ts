import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import {
  getLaunchpadStateDecoder,
  LAUNCHPAD_STATE_DISCRIMINATOR,
  type LaunchpadState
} from '@/lib/solana/generated/accounts/launchpadState';
import { getPool, isDatabaseConfigured } from '@/lib/db';

const RPC_URL = process.env.RPC_URL || 'https://api.devnet.solana.com';
const connection = new Connection(RPC_URL, 'confirmed');

const LAMPORTS_PER_SOL = 1_000_000_000;

// Note: The current database schema doesn't track individual buyer/seller addresses,
// so holder counts are approximated using trade counts as proxies.

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
  const k = new BN(launchpadState.k.toString());
  const solRaisedRaw = new BN(launchpadState.solRaised.toString());
  const tokensSoldRaw = new BN(launchpadState.tokensSold.toString());
  
  return { 
    totalSupplyRaw, 
    tokensForSaleRaw, 
    virtualSolReserves,
    virtualTokenReserves,
    k,
    solRaisedRaw, 
    tokensSoldRaw 
  };
}

/**
 * Calculate current price using constant product AMM formula
 * Formula: price = virtual_sol_reserves / virtual_token_reserves
 * This gives us the price per atomic token unit in lamports
 * Then convert to price per full token in SOL
 */
function calculateCurrentPrice(virtualSolReserves: BN, virtualTokenReserves: BN): number {
  const TOKEN_DECIMALS = 6;
  const TOKEN_MULTIPLIER = new BN(10).pow(new BN(TOKEN_DECIMALS));
  
  // Prevent division by zero
  if (virtualTokenReserves.isZero()) {
    return 0;
  }
  
  // Step 1: Calculate price for 1 atomic token in lamports
  // price = sol_reserves / token_reserves
  // To maintain precision, multiply by TOKEN_MULTIPLIER first
  const priceAtomicLamports = virtualSolReserves.mul(TOKEN_MULTIPLIER).div(virtualTokenReserves);
  
  // Step 2: Convert to price for 1 FULL token in SOL
  const currentPriceFullTokenSol = parseFloat(priceAtomicLamports.toString()) / LAMPORTS_PER_SOL;
  
  return currentPriceFullTokenSol;
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

    console.log(`[LOG] Fetching all metrics for: ${launchpadPubkey}`);
    
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
      k,
      solRaisedRaw, 
      tokensSoldRaw 
    } = decodeLaunchpadState(accountInfo.data);

    // Calculate current price
    const currentPriceSol = calculateCurrentPrice(virtualSolReserves, virtualTokenReserves);
    
    // Convert raw values to decimal using string conversion for large numbers
    const totalSupply = parseFloat(totalSupplyRaw.toString());
    const tokensForSale = parseFloat(tokensForSaleRaw.toString());
    const solRaised = parseFloat(solRaisedRaw.toString()) / LAMPORTS_PER_SOL;
    const tokensSold = parseFloat(tokensSoldRaw.toString());
    
    // Calculate market cap
    const marketCapSol = currentPriceSol * totalSupply;
    const solPriceUsd = parseFloat(process.env.SOL_PRICE_USD || '100');
    const marketCapUsd = marketCapSol * solPriceUsd;
    
    // Calculate supply metrics
    const tokensRemaining = tokensForSale - tokensSold;
    const tokensRemainingPercentage = tokensForSale > 0 ? (tokensRemaining / tokensForSale) * 100 : 0;
    const circulatingSupply = tokensSold;
    const circulatingPercentage = totalSupply > 0 ? (circulatingSupply / totalSupply) * 100 : 0;

    // Initialize default values for database metrics
    let volume24h = 0;
    let volume7d = 0;
    let totalVolume = 0;
    let tradeCount24h = 0;
    let tradeCount7d = 0;
    let totalTrades = 0;
    let totalHolders = 0;
    let uniqueBuyers = 0;
    let uniqueSellers = 0;

    // Fetch database metrics if available
    if (isDatabaseConfigured()) {
      try {
        const pool = getPool();

        // Fetch all database metrics in parallel
        const [
          volume24hResult,
          volume7dResult,
          totalVolumeResult,
          holdersResult
        ] = await Promise.all([
          // 24h volume
          pool.query(`
            SELECT 
              SUM(volume * price) as volume24h,
              COUNT(*) as tradeCount24h
            FROM trades 
            WHERE launchpad_pubkey = $1 
            AND timestamp >= NOW() - INTERVAL '24 hours'
          `, [launchpadPubkey]),
          
          // 7d volume
          pool.query(`
            SELECT 
              SUM(volume * price) as volume7d,
              COUNT(*) as tradeCount7d
            FROM trades 
            WHERE launchpad_pubkey = $1 
            AND timestamp >= NOW() - INTERVAL '7 days'
          `, [launchpadPubkey]),
          
          // Total volume
          pool.query(`
            SELECT 
              SUM(volume * price) as totalVolume,
              COUNT(*) as totalTrades
            FROM trades 
            WHERE launchpad_pubkey = $1
          `, [launchpadPubkey]),
          
          // Trade type counts (since we don't track individual buyers/sellers)
          pool.query(`
            SELECT 
              COUNT(CASE WHEN type = 'BUY' THEN 1 END) as buyTrades,
              COUNT(CASE WHEN type = 'SELL' THEN 1 END) as sellTrades
            FROM trades 
            WHERE launchpad_pubkey = $1
          `, [launchpadPubkey])
        ]);

        volume24h = parseFloat(volume24hResult.rows[0]?.volume24h || '0');
        tradeCount24h = parseInt(volume24hResult.rows[0]?.tradeCount24h || '0');
        
        volume7d = parseFloat(volume7dResult.rows[0]?.volume7d || '0');
        tradeCount7d = parseInt(volume7dResult.rows[0]?.tradeCount7d || '0');
        
        totalVolume = parseFloat(totalVolumeResult.rows[0]?.totalVolume || '0');
        totalTrades = parseInt(totalVolumeResult.rows[0]?.totalTrades || '0');
        
        const buyTrades = parseInt(holdersResult.rows[0]?.buyTrades || '0');
        const sellTrades = parseInt(holdersResult.rows[0]?.sellTrades || '0');
        
        // Since we don't track individual buyers/sellers, we'll use trade counts as proxies
        totalHolders = buyTrades; // Approximate: number of buy trades
        uniqueBuyers = buyTrades;
        uniqueSellers = sellTrades;

      } catch (dbError) {
        console.error('Database query error:', dbError);
        // Continue with default values if database query fails
      }
    }

    const metrics = {
      // Price data
      currentPriceSol,
      currentPriceUsd: currentPriceSol * solPriceUsd,
      
      // Market cap
      marketCapSol,
      marketCapUsd,
      
      // Supply data
      totalSupply,
      tokensForSale,
      tokensSold,
      tokensRemaining,
      tokensRemainingPercentage,
      circulatingSupply,
      circulatingPercentage,
      
      // Volume data
      volume24h,
      volume7d,
      totalVolume,
      tradeCount24h,
      tradeCount7d,
      totalTrades,
      
      // Trade activity data (using trade counts as proxies since individual buyers/sellers aren't tracked)
      totalHolders: totalHolders, // Approximate: number of buy trades
      uniqueBuyers: uniqueBuyers, // Number of buy trades
      uniqueSellers: uniqueSellers, // Number of sell trades
      activeTraders: uniqueBuyers + uniqueSellers, // Total trade count
      
      // Additional metrics
      solRaised,
      solPriceUsd,
      avgTradeSize24h: tradeCount24h > 0 ? volume24h / tradeCount24h : 0,
      avgTradeSize7d: tradeCount7d > 0 ? volume7d / tradeCount7d : 0,
      avgTradeSizeTotal: totalTrades > 0 ? totalVolume / totalTrades : 0
    };

    console.log(`[LOG] All metrics for ${launchpadPubkey}:`, metrics);

    return NextResponse.json(metrics);

  } catch (e) {
    console.error('[FATAL] Failed to fetch metrics:', e);
    return NextResponse.json({ error: 'Failed to fetch metrics from the blockchain.' }, { status: 500 });
  }
}
