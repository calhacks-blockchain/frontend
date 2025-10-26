import { NextRequest, NextResponse } from 'next/server';

// Python bridge that communicates with Agentverse agent
const BRIDGE_URL = process.env.BRIDGE_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, message, chatHistory = [] } = body;

    if (!companyId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Sending chat message to agent via bridge...');

    // Send to Python bridge
    const response = await fetch(`${BRIDGE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        company_name: companyId,
        message: message 
      }),
      signal: AbortSignal.timeout(35000), // 35 second timeout
    });

    if (!response.ok) {
      console.error('Bridge error:', response.status);
      throw new Error(`Bridge returned ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      return NextResponse.json({
        success: true,
        response: data.response,
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error(data.error || 'Agent returned error');
    }

  } catch (error) {
    console.error('Error in AI chat API:', error);
    
    // Fallback response
    return NextResponse.json({
      success: true,
      response: `I'm an AI agent powered by Claude and deployed on Fetch.ai's Agentverse. I can help analyze companies based on their research data. The bridge connection is currently unavailable - please ensure the Python bridge server is running.`,
      timestamp: new Date().toISOString()
    });
  }
}

