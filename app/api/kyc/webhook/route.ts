import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase with service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Verify Persona webhook signature
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const digest = hmac.digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

export async function POST(request: Request) {
  try {
    const webhookSecret = process.env.PERSONA_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('Persona webhook secret not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 503 }
      );
    }

    // Get the raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('persona-signature') || '';

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature, webhookSecret)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const event = JSON.parse(body);
    
    // Handle different event types
    const eventType = event.data.type;
    const inquiryId = event.data.attributes['inquiry-id'];
    const referenceId = event.data.attributes['reference-id']; // This is our user ID
    const status = event.data.attributes.status;

    console.log('Received Persona webhook:', {
      eventType,
      inquiryId,
      referenceId,
      status,
    });

    if (!referenceId) {
      console.error('No reference ID in webhook');
      return NextResponse.json({ received: true });
    }

    // Map Persona status to our KYC status
    let kycStatus: 'pending' | 'verified' | 'rejected' = 'pending';
    
    if (status === 'completed' || status === 'approved') {
      kycStatus = 'verified';
    } else if (status === 'failed' || status === 'declined') {
      kycStatus = 'rejected';
    }

    // Update user metadata
    const updateData: Record<string, unknown> = {
      kyc_status: kycStatus,
      kyc_inquiry_id: inquiryId,
      kyc_last_updated: new Date().toISOString(),
    };

    if (kycStatus === 'verified') {
      updateData.kyc_verified_at = new Date().toISOString();
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      referenceId,
      {
        user_metadata: updateData,
      }
    );

    if (updateError) {
      console.error('Failed to update user KYC status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    console.log(`Successfully updated KYC status for user ${referenceId} to ${kycStatus}`);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

