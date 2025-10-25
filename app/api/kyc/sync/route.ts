import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      );
    }

    // Verify the user's session
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Get the inquiry ID from user metadata
    const inquiryId = user.user_metadata?.kyc_inquiry_id;
    if (!inquiryId) {
      return NextResponse.json(
        { error: 'No KYC inquiry found for this user' },
        { status: 400 }
      );
    }

    // Get Persona configuration
    const personaApiKey = process.env.PERSONA_API_KEY;
    if (!personaApiKey) {
      return NextResponse.json(
        { error: 'KYC service is not configured' },
        { status: 503 }
      );
    }

    // Fetch the inquiry status from Persona
    const personaResponse = await fetch(`https://withpersona.com/api/v1/inquiries/${inquiryId}`, {
      headers: {
        'Authorization': `Bearer ${personaApiKey}`,
        'Persona-Version': '2023-01-05',
      },
    });

    if (!personaResponse.ok) {
      const errorData = await personaResponse.json();
      console.error('Persona API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to fetch verification status from Persona' },
        { status: 500 }
      );
    }

    const inquiryData = await personaResponse.json();
    const inquiryStatus = inquiryData.data.attributes.status;

    // Map Persona status to our KYC status
    let kycStatus: string;
    let kycVerifiedAt: string | null = null;

    switch (inquiryStatus) {
      case 'completed':
      case 'approved':
        kycStatus = 'verified';
        kycVerifiedAt = new Date().toISOString();
        break;
      case 'failed':
      case 'declined':
        kycStatus = 'rejected';
        break;
      case 'pending':
        kycStatus = 'pending';
        break;
      case 'created':
      case 'started':
        kycStatus = 'in_progress';
        break;
      default:
        kycStatus = user.user_metadata?.kyc_status || 'in_progress';
    }

    // Update user metadata
    const updateData: any = {
      ...user.user_metadata,
      kyc_status: kycStatus,
    };

    if (kycVerifiedAt) {
      updateData.kyc_verified_at = kycVerifiedAt;
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: updateData,
      }
    );

    if (updateError) {
      console.error('Failed to update user metadata:', updateError);
      return NextResponse.json(
        { error: 'Failed to update user status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      status: kycStatus,
      personaStatus: inquiryStatus,
      verifiedAt: kycVerifiedAt,
    });
  } catch (error) {
    console.error('KYC sync error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync KYC status' },
      { status: 500 }
    );
  }
}
