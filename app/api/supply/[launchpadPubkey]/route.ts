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
  const tokensSoldRaw = new BN(launchpadState.tokensSold.toString());
  
  return { 
    totalSupplyRaw, 
    tokensForSaleRaw, 
    tokensSoldRaw 
  };
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

    console.log(`[LOG] Getting supply data for: ${launchpadPubkey}`);
    
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
      tokensSoldRaw 
    } = decodeLaunchpadState(accountInfo.data);

    // Convert raw values to decimal (6 decimals)
    const totalSupply = parseFloat(totalSupplyRaw.toString()) / 1e6;
    const tokensForSale = parseFloat(tokensForSaleRaw.toString()) / 1e6;
    const tokensSold = parseFloat(tokensSoldRaw.toString()) / 1e6;
    
    // Calculate remaining tokens
    const tokensRemaining = tokensForSale - tokensSold;
    const tokensRemainingPercentage = tokensForSale > 0 ? (tokensRemaining / tokensForSale) * 100 : 0;
    
    // Calculate circulating supply (tokens sold)
    const circulatingSupply = tokensSold;
    const circulatingPercentage = totalSupply > 0 ? (circulatingSupply / totalSupply) * 100 : 0;
    
    console.log(`[LOG] Supply data:`, {
      totalSupply,
      tokensForSale,
      tokensSold,
      tokensRemaining,
      tokensRemainingPercentage,
      circulatingSupply,
      circulatingPercentage
    });

    return NextResponse.json({ 
      totalSupply,
      tokensForSale,
      tokensSold,
      tokensRemaining,
      tokensRemainingPercentage,
      circulatingSupply,
      circulatingPercentage,
      // Debug values
      debug: {
        totalSupplyRaw: totalSupplyRaw.toString(),
        tokensForSaleRaw: tokensForSaleRaw.toString(),
        tokensSoldRaw: tokensSoldRaw.toString()
      }
    });

  } catch (e) {
    console.error('[FATAL] Failed to get supply data:', e);
    return NextResponse.json({ error: 'Failed to get supply data from the blockchain.' }, { status: 500 });
  }
}
