import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import {
  getLaunchpadStateDecoder,
  LAUNCHPAD_STATE_DISCRIMINATOR
} from '@/lib/solana/generated/accounts/launchpadState';

const RPC_URL = process.env.RPC_URL || 'https://api.devnet.solana.com';
const connection = new Connection(RPC_URL, 'confirmed');

/**
 * Extracts status string from various decoder formats
 */
function extractStatus(status: any): string {
  if (typeof status === 'number') {
    if (status === 0) return 'Funding';
    if (status === 1) return 'Transition';
    if (status === 2) return 'Safe';
  } else if (typeof status === 'object' && status !== null) {
    const keys = Object.keys(status);
    if (keys.length > 0) {
      return keys[0].charAt(0).toUpperCase() + keys[0].slice(1).toLowerCase();
    }
    if ('__kind' in status) {
      const kind = (status as any).__kind;
      return kind.charAt(0).toUpperCase() + kind.slice(1).toLowerCase();
    }
  } else if (typeof status === 'string') {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }
  throw new Error('Unknown status format');
}

/**
 * Decodes the status from the launchpad state account
 */
function decodeLaunchpadStatus(data: Buffer): string {
  // Check if this is a launchpad state account by checking discriminator
  const discriminator = data.slice(0, 8);
  const expectedDiscriminator = new Uint8Array(LAUNCHPAD_STATE_DISCRIMINATOR);
  
  if (!discriminator.equals(expectedDiscriminator)) {
    throw new Error('Invalid launchpad account discriminator');
  }
  
  // Use the generated decoder to parse the account data
  const decoder = getLaunchpadStateDecoder();
  const launchpadState = decoder.decode(data);
  
  console.log('[DEBUG] Status object:', launchpadState.status);
  
  return extractStatus(launchpadState.status);
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

    console.log(`[LOG] Fetching status for: ${launchpadPubkey}`);
    
    // Fetch the launchpad account data
    const accountInfo = await connection.getAccountInfo(new PublicKey(launchpadPubkey));
    
    if (!accountInfo) {
      console.error(`[LOG] Account not found: ${launchpadPubkey}`);
      return NextResponse.json({ error: 'Launchpad account not found on-chain.' }, { status: 404 });
    }

    // Decode the status
    const status = decodeLaunchpadStatus(accountInfo.data);

    console.log(`[LOG] Successfully decoded status: ${status}`);

    // Return the status
    return NextResponse.json({
      launchpadPubkey,
      status,
    });

  } catch (e) {
    console.error('[FATAL] Failed to fetch status:', e);
    
    // Handle specific errors
    if (e instanceof Error && e.message.includes('Invalid launchpad account discriminator')) {
      return NextResponse.json({ error: 'This is not a valid launchpad account.' }, { status: 400 });
    }
    if (e instanceof Error && e.message.includes('Enum discriminator out of range')) {
      return NextResponse.json({ 
        error: 'This launchpad was created with an old contract version. Please create a new launchpad.' 
      }, { status: 400 });
    }
    if (e instanceof Error && e.message.includes('Invalid public key')) {
      return NextResponse.json({ error: 'Invalid launchpad public key format.' }, { status: 400 });
    }

    return NextResponse.json({ 
      error: 'Failed to fetch status from the blockchain.',
      details: e instanceof Error ? e.message : 'Unknown error'
    }, { status: 500 });
  }
}