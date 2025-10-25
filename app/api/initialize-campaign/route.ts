import { NextResponse } from 'next/server';

// This is the URL of your backend server
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Received request to initialize campaign:", body);
    
    // Forward the request to the backend
    const response = await fetch(`${BACKEND_URL}/api/initialize-campaign/build`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'Failed to initialize campaign' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in initialize-campaign route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

