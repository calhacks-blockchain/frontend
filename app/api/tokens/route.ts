import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import {
  getLaunchpadStateDecoder,
  LAUNCHPAD_STATE_DISCRIMINATOR,
  type LaunchpadState
} from '@/lib/solana/generated/accounts/launchpadState';

const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID || 'DNRBFcPUmzVbxcStwSrvettxNYxCfrBUEj4hksd9aKRq';

// Helper function to fetch metadata from URI
async function fetchMetadata(uri: string) {
  try {
    if (!uri) return null;
    
    // Extract the token URI ID from the full URI
    const uriParts = uri.split('/');
    const tokenUriId = uriParts[uriParts.length - 1];
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/metadata/${tokenUriId}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching metadata:', error);
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    // Connect to Solana blockchain
    const connection = new Connection(RPC_URL, 'confirmed');
    
    // Get all program accounts (all launchpads created by our program)
    const accounts = await connection.getProgramAccounts(new PublicKey(PROGRAM_ID), {
      filters: [
        // Filter by account size if needed
        // { dataSize: EXPECTED_SIZE }
      ],
    });

    const tokens = [];

    for (const account of accounts) {
      try {
        const data = account.account.data;
        
        // Skip if data is too small
        if (data.length < 100) continue;
        
        // Check if this is a launchpad state account by checking discriminator
        const discriminator = data.slice(0, 8);
        const expectedDiscriminator = new Uint8Array(LAUNCHPAD_STATE_DISCRIMINATOR);
        
        if (!discriminator.equals(expectedDiscriminator)) {
          continue; // Skip non-launchpad accounts
        }
        
        // Use the generated decoder to parse the account data
        const decoder = getLaunchpadStateDecoder();
        const launchpadState = decoder.decode(data);
        
        // Fetch metadata for this token
        const metadata = await fetchMetadata(launchpadState.uri);

        // Calculate current price from virtual reserves
        const virtualSolReserves = BigInt(launchpadState.virtualSolReserves.toString());
        const virtualTokenReserves = BigInt(launchpadState.virtualTokenReserves.toString());
        const currentPrice = virtualTokenReserves > BigInt(0)
          ? Number(virtualSolReserves * BigInt(1000000) / virtualTokenReserves) / 1e9 // Price per full token in SOL
          : 0;

        tokens.push({
          pubkey: account.pubkey.toString(),
          name: launchpadState.raiseTokenName,
          symbol: launchpadState.raiseTokenSymbol,
          uri: launchpadState.uri,
          image: metadata?.image || '/bitcoin-btc-logo.svg', // Provide a default fallback
          description: metadata?.description || null,
          totalSupply: launchpadState.totalSupply.toString(),
          tokensForSale: launchpadState.tokensForSale.toString(),
          solRaised: launchpadState.solRaised.toString(),
          tokensSold: launchpadState.tokensSold.toString(),
          solRaiseTarget: launchpadState.solRaiseTarget.toString(),
          virtualSolReserves: launchpadState.virtualSolReserves.toString(),
          virtualTokenReserves: launchpadState.virtualTokenReserves.toString(),
          k: launchpadState.k.toString(),
          status: launchpadState.status,
          mint: launchpadState.mint,
          tokenVault: launchpadState.tokenVault,
          currentPrice,
          volume: 0,
          totalVolume: Number(launchpadState.solRaised) / 1e9, // Convert lamports to SOL
          tradeCount: 0,
        });
      } catch (parseError) {
        console.error('Error parsing account:', parseError);
        // Skip malformed accounts
        continue;
      }
    }

    return NextResponse.json({ tokens });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching tokens from blockchain:', {
      message: errorMessage,
      error,
    });
    
    // Return empty array to allow frontend to use mock data
    return NextResponse.json({ 
      tokens: [],
      warning: 'Failed to fetch from blockchain'
    });
  }
}

