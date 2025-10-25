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

    // Check if user already has verified KYC
    const kycStatus = user.user_metadata?.kyc_status;
    if (kycStatus === 'verified') {
      return NextResponse.json(
        { error: 'User is already verified' },
        { status: 400 }
      );
    }

    // Get Persona configuration from environment
    const personaApiKey = process.env.PERSONA_API_KEY;
    const personaTemplateId = process.env.PERSONA_TEMPLATE_ID;
    const personaEnvironment = process.env.PERSONA_ENVIRONMENT || 'sandbox';

    if (!personaApiKey || !personaTemplateId) {
      return NextResponse.json(
        { error: 'KYC service is not configured. Please contact support.' },
        { status: 503 }
      );
    }

    // Create an inquiry with Persona
    const personaResponse = await fetch('https://withpersona.com/api/v1/inquiries', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${personaApiKey}`,
        'Content-Type': 'application/json',
        'Persona-Version': '2023-01-05',
      },
      body: JSON.stringify({
        data: {
          type: 'inquiry',
          attributes: {
            // Support both inquiry-template-id (itmpl_) and verification-template-id (vtmpl_)
            ...(personaTemplateId.startsWith('itmpl_')
              ? { 'inquiry-template-id': personaTemplateId }
              : { 'verification-template-id': personaTemplateId }
            ),
            'reference-id': user.id,
            'redirect-uri': `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/kyc/complete`,
          },
        },
      }),
    });

    if (!personaResponse.ok) {
      const errorData = await personaResponse.json();
      console.error('Persona API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to initialize verification' },
        { status: 500 }
      );
    }

    const personaData = await personaResponse.json();
    if (!personaData?.data?.id) {
      console.error('Invalid Persona response structure:', personaData);
      return NextResponse.json(
        { error: 'Failed to initialize verification' },
        { status: 500 }
      );
    }
    const inquiryId = personaData.data.id;
    // Update user metadata with in_progress KYC status (not pending yet - that happens when they complete it)
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          ...user.user_metadata,
          kyc_status: 'in_progress',
          kyc_inquiry_id: inquiryId,
          kyc_started_at: new Date().toISOString(),
        },
      }
    );

    if (updateError) {
      console.error('Failed to update user metadata:', updateError);
    }

    return NextResponse.json({
      success: true,
      inquiryId,
      templateId: personaTemplateId,
      environment: personaEnvironment,
    });
  } catch (error) {
    console.error('KYC initialization error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to initialize KYC' },
      { status: 500 }
    );
  }
}

