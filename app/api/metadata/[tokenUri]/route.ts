import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || '';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tokenUri: string }> }
) {
  const { tokenUri } = await params;
  
  if (!tokenUri) {
    return NextResponse.json({ error: 'Token URI is required' }, { status: 400 });
  }

  // Check database configuration
  if (!DATABASE_URL) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 500 }
    );
  }

  let pool: Pool | null = null;
  
  try {
    pool = new Pool({ 
      connectionString: DATABASE_URL,
      connectionTimeoutMillis: 5000,
    });

    // Reconstruct the full token URI
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const fullTokenUri = `${baseUrl}/api/metadata/${tokenUri}`;

    // Fetch metadata from database
    const result = await pool.query(
      `SELECT name, symbol, description, image_path
       FROM token_metadata
       WHERE token_uri = $1`,
      [fullTokenUri]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Metadata not found' }, { status: 404 });
    }

    const metadata = result.rows[0];
    
    // Return standard token metadata format
    const metadataJson = {
      name: metadata.name,
      symbol: metadata.symbol,
      description: metadata.description,
      image: `${baseUrl}${metadata.image_path}`,
      attributes: [],
      properties: {
        files: [
          {
            uri: `${baseUrl}${metadata.image_path}`,
            type: 'image/png',
          },
        ],
        category: 'image',
      },
    };

    return NextResponse.json(metadataJson);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching metadata:', errorMessage);
    return NextResponse.json(
      { error: `Failed to fetch metadata: ${errorMessage}` },
      { status: 500 }
    );
  } finally {
    if (pool) {
      try {
        await pool.end();
      } catch (endError) {
        console.error('Error closing pool:', endError);
      }
    }
  }
}

