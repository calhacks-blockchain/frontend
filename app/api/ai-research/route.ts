import { NextRequest, NextResponse } from 'next/server';

// Python bridge that communicates with Agentverse agent
const BRIDGE_URL = process.env.BRIDGE_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { launchpadPubkey, company } = body;

    if (!launchpadPubkey || !company) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (typeof company !== 'object' || !company.name) {
      return NextResponse.json(
        { error: 'Invalid company object or missing company name' },
        { status: 400 }
      );
    }

    console.log('Sending research request to agent via bridge...');
    console.log('Company:', company.name);

    // Send to Python bridge
    const response = await fetch(`${BRIDGE_URL}/research`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ company }),
      signal: AbortSignal.timeout(65000), // 65 second timeout
    });

    if (!response.ok) {
      console.error('Bridge error:', response.status);
      throw new Error(`Bridge returned ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      return NextResponse.json({
        success: true,
        summary: data.summary,
        detailed_analysis: data.detailed_analysis,
        social_media_data: data.social_media_data || {},
        pdf_url: data.pdf_url || '',
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error(data.error || 'Agent returned error');
    }

  } catch (error) {
    console.error('Error in AI research API:', error);
    
    // Return a fallback response with proper error status
    return NextResponse.json({
      success: false,
      fallback: true,
      summary: `AI-powered research is being processed by our Fetch.ai agent (powered by Claude). The agent analyzes social media presence, team credentials, and market validation. Full analysis includes due diligence, risk assessment, and investment considerations.`,
      detailed_analysis: 'Our AI agent is conducting comprehensive research. This includes verifying social media presence, analyzing team backgrounds, evaluating market traction, and assessing overall legitimacy and investment potential.',
      social_media_data: {
        platforms_found: ['twitter', 'website', 'discord'],
        summary: 'Social media analysis in progress'
      },
      timestamp: new Date().toISOString(),
      note: 'Demo mode - Bridge connection issue. Check if Python bridge is running.'
    }, { status: 500 });
  }
}

