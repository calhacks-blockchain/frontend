import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCoinFormSchema } from '@/lib/create-coin/validation';
import type { SaveCampaignRequest } from '@/types/campaign';

export async function POST(request: NextRequest) {
  try {
    const body: SaveCampaignRequest = await request.json();
    
    // Validate the request body
    const validationResult = createCoinFormSchema.safeParse(body.formData);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid form data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const {
      launchpadPubkey,
      mintPubkey,
      tokenVaultPubkey,
      authorityPubkey,
      tokenUri,
      deploymentSignature,
      totalSupply,
      tokensForSale,
      initialPriceLamportsPerToken,
    } = body;

    // Validate required deployment data
    if (!launchpadPubkey || !mintPubkey || !tokenVaultPubkey || !authorityPubkey || !tokenUri) {
      return NextResponse.json(
        { error: 'Missing required deployment data' },
        { status: 400 }
      );
    }

    const formData = validationResult.data;
    const supabase = await createClient();

    // Prepare campaign data for database
    const campaignData = {
      launchpad_pubkey: launchpadPubkey,
      mint_pubkey: mintPubkey,
      token_vault_pubkey: tokenVaultPubkey,
      authority_pubkey: authorityPubkey,
      token_uri: tokenUri,
      
      // Basic Info
      name: formData.basicInfo.name,
      symbol: formData.basicInfo.ticker,
      tagline: formData.basicInfo.tagline,
      logo_url: formData.basicInfo.logo,
      cover_image_url: formData.basicInfo.coverImage || null,
      
      // The Pitch
      elevator_pitch: formData.pitch.elevatorPitch,
      problem: formData.pitch.problem,
      solution: formData.pitch.solution,
      why_now: formData.pitch.whyNow,
      
      // Team
      team_members: formData.team.team,
      
      // Traction & Roadmap
      traction_metrics: formData.tractionRoadmap.traction || [],
      roadmap_items: formData.tractionRoadmap.roadmap,
      
      // Tokenomics
      fundraising_goal: formData.tokenomics.goal,
      equity_offered: formData.tokenomics.equityOffered,
      founder_allocation: formData.tokenomics.founderAllocation,
      token_distribution: formData.tokenomics.tokenDistribution,
      use_of_funds: formData.tokenomics.useOfFunds,
      
      // Social & Media
      website_url: formData.socialMedia.website || null,
      twitter_url: formData.socialMedia.twitter || null,
      discord_url: formData.socialMedia.discord || null,
      telegram_url: formData.socialMedia.telegram || null,
      slider_images: formData.socialMedia.sliderImages,
      tweet_ids: formData.socialMedia.tweetIds || [],
      
      // Deployment Info
      total_supply: totalSupply,
      tokens_for_sale: tokensForSale,
      initial_price_lamports_per_token: initialPriceLamportsPerToken,
      
      // Fundraising Parameters
      initial_valuation_sol: parseFloat(formData.basicInfo.valuation || '1'),
      percentage_for_sale: parseFloat(formData.basicInfo.percentageForSale || '20'),
      target_raise_sol: parseFloat(formData.basicInfo.targetRaise || '200'),
      
      // Status
      status: 'active',
      deployment_signature: deploymentSignature || null,
    };

    // Insert campaign data into database
    const { data, error } = await supabase
      .from('token_campaigns')
      .insert([campaignData])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to save campaign data', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      campaignId: data.id,
      message: 'Campaign data saved successfully',
    });

  } catch (error) {
    console.error('Save campaign error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
