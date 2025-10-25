import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
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

    // Get KYC status from user metadata
    const kycStatus = user.user_metadata?.kyc_status || 'not_started';
    const kycVerifiedAt = user.user_metadata?.kyc_verified_at;
    const kycInquiryId = user.user_metadata?.kyc_inquiry_id;

    // If status is pending, check with Persona for updates
    if (kycStatus === 'pending' && kycInquiryId) {
      const personaApiKey = process.env.PERSONA_API_KEY;
      
      if (personaApiKey) {
        try {
          const personaResponse = await fetch(
            `https://withpersona.com/api/v1/inquiries/${kycInquiryId}`,
            {
              headers: {
                'Authorization': `Bearer ${personaApiKey}`,
                'Persona-Version': '2023-01-05',
              },
            }
          );

          if (personaResponse.ok) {
            const personaData = await personaResponse.json();
            const inquiryStatus = personaData.data.attributes.status;
            
            // Map Persona status to our KYC status
            let newKycStatus = kycStatus;
            if (inquiryStatus === 'completed' || inquiryStatus === 'approved') {
              newKycStatus = 'verified';
            } else if (inquiryStatus === 'failed' || inquiryStatus === 'declined') {
              newKycStatus = 'rejected';
            }

            // Update user metadata if status changed
            if (newKycStatus !== kycStatus) {
              const updateData: Record<string, unknown> = {
                ...user.user_metadata,
                kyc_status: newKycStatus,
              };

              if (newKycStatus === 'verified') {
                updateData.kyc_verified_at = new Date().toISOString();
              }

              await supabaseAdmin.auth.admin.updateUserById(
                user.id,
                { user_metadata: updateData }
              );

              return NextResponse.json({
                status: newKycStatus,
                verifiedAt: newKycStatus === 'verified' ? updateData.kyc_verified_at : null,
              });
            }
          }
        } catch (error) {
          console.error('Error checking Persona status:', error);
          // Continue with cached status if Persona check fails
        }
      }
    }

    return NextResponse.json({
      status: kycStatus,
      verifiedAt: kycVerifiedAt || null,
    });
  } catch (error) {
    console.error('KYC status check error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check KYC status' },
      { status: 500 }
    );
  }
}

