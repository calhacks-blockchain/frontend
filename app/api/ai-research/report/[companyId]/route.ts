import { NextRequest, NextResponse } from 'next/server';

const AI_AGENT_URL = process.env.AI_AGENT_URL || 'http://localhost:8001';

export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const { companyId } = params;

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Forward PDF request to Python AI agent service
    const response = await fetch(`${AI_AGENT_URL}/api/report/${companyId}`);

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Report not found. Please conduct research first.' },
          { status: 404 }
        );
      }
      throw new Error('Failed to fetch PDF report');
    }

    // Get the PDF blob
    const blob = await response.blob();

    // Return the PDF with proper headers
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${companyId}_report.pdf"`
      }
    });

  } catch (error) {
    console.error('Error fetching PDF report:', error);
    return NextResponse.json(
      { error: 'Failed to download report' },
      { status: 500 }
    );
  }
}

