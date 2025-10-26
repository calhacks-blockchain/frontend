import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import {
  getLaunchpadStateDecoder,
  LAUNCHPAD_STATE_DISCRIMINATOR,
  type LaunchpadState
} from '@/lib/solana/generated/accounts/launchpadState';

const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID || 'DNRBFcPUmzVbxcStwSrvettxNYxCfrBUEj4hksd9aKRq';
const LAMPORTS_PER_SOL = 1_000_000_000;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ launchpadPubkey: string }> }
) {
  try {
    const { launchpadPubkey } = await params;
    
    if (!launchpadPubkey) {
      return NextResponse.json({ error: 'Launchpad pubkey is required' }, { status: 400 });
    }

    // Connect to Solana blockchain
    const connection = new Connection(RPC_URL, 'confirmed');
    
    // Fetch account data from blockchain
    const accountInfo = await connection.getAccountInfo(new PublicKey(launchpadPubkey));
    
    if (!accountInfo) {
      return NextResponse.json({ error: 'Launchpad account not found' }, { status: 404 });
    }

    // Verify it's owned by our program
    if (accountInfo.owner.toString() !== PROGRAM_ID) {
      return NextResponse.json({ error: 'Invalid launchpad account' }, { status: 400 });
    }

    const data = accountInfo.data;
    
    // Check if this is a launchpad state account by checking discriminator
    const discriminator = data.slice(0, 8);
    const expectedDiscriminator = new Uint8Array(LAUNCHPAD_STATE_DISCRIMINATOR);
    
    if (!discriminator.equals(expectedDiscriminator)) {
      return NextResponse.json({ error: 'Invalid launchpad account discriminator' }, { status: 400 });
    }
    
    // Use the generated decoder to parse the account data
    const decoder = getLaunchpadStateDecoder();
    const launchpadState = decoder.decode(data);

    // Convert lamports to SOL for solRaised and solRaiseTarget
    const solRaisedSol = Number(launchpadState.solRaised) / LAMPORTS_PER_SOL;
    const solRaiseTargetSol = Number(launchpadState.solRaiseTarget) / LAMPORTS_PER_SOL;

    const launchpadData = {
      authority: launchpadState.authority,
      platformAuthority: launchpadState.platformAuthority,
      raiseTokenName: launchpadState.raiseTokenName,
      raiseTokenSymbol: launchpadState.raiseTokenSymbol,
      uri: launchpadState.uri,
      totalSupply: launchpadState.totalSupply.toString(),
      tokensForSale: launchpadState.tokensForSale.toString(),
      solRaiseTarget: solRaiseTargetSol, // Converted to SOL
      solRaiseTargetLamports: launchpadState.solRaiseTarget.toString(), // Keep lamports version
      virtualSolReserves: launchpadState.virtualSolReserves.toString(),
      virtualTokenReserves: launchpadState.virtualTokenReserves.toString(),
      k: launchpadState.k.toString(),
      solRaised: solRaisedSol, // Converted to SOL
      solRaisedLamports: launchpadState.solRaised.toString(), // Keep lamports version
      tokensSold: launchpadState.tokensSold.toString(),
      status: launchpadState.status,
      mint: launchpadState.mint,
      tokenVault: launchpadState.tokenVault,
    };

    console.log(launchpadData);
    
    return NextResponse.json(launchpadData);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching launchpad data from blockchain:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to fetch launchpad data from blockchain' }, 
      { status: 500 }
    );
  }
}

