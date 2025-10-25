import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

function verifySignature(
  message: string,
  signature: string,
  publicKey: string
): boolean {
  try {
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signature);
    const publicKeyBytes = bs58.decode(publicKey);

    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const { publicKey, signature, message, nonce } = await request.json();

    if (!publicKey || !signature || !message || !nonce) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const isValid = verifySignature(message, signature, publicKey);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    if (!message.includes(publicKey) || !message.includes(nonce)) {
      return NextResponse.json(
        { error: 'Invalid message content' },
        { status: 401 }
      );
    }

    const email = `${publicKey}@phantom.wallet`;
    const password = publicKey;
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: signInData } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInData?.session) {
      return NextResponse.json({
        success: true,
        session: signInData.session,
      });
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          wallet_address: publicKey,
          auth_method: 'phantom',
        },
      },
    });

    if (signUpError || !signUpData.session) {
      return NextResponse.json(
        { error: signUpError?.message || 'Failed to create account' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      session: signUpData.session,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Authentication failed' },
      { status: 500 }
    );
  }
}

