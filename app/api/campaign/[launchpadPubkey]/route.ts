import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ launchpadPubkey: string }> }
) {
  try {
    const { launchpadPubkey } = await params;

    if (!launchpadPubkey) {
      return NextResponse.json(
        { error: 'Launchpad public key is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch campaign data from database
    const { data, error } = await supabase
      .from('token_campaigns')
      .select('*')
      .eq('launchpad_pubkey', launchpadPubkey)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No campaign found
        return NextResponse.json(
          { error: 'Campaign not found' },
          { status: 404 }
        );
      }
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch campaign data' },
        { status: 500 }
      );
    }

    // Return the campaign data
    return NextResponse.json(data);

  } catch (error) {
    console.error('Campaign fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
