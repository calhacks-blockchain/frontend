import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomBytes } from 'crypto';

const DATABASE_URL = process.env.DATABASE_URL || '';

function generateUUID(): string {
  return randomBytes(16).toString('hex');
}

export async function POST(request: NextRequest) {
  // Check database configuration
  if (!DATABASE_URL) {
    return NextResponse.json(
      { error: 'Database not configured. Please set DATABASE_URL environment variable.' },
      { status: 500 }
    );
  }

  let pool: Pool | null = null;
  
  try {
    pool = new Pool({ 
      connectionString: DATABASE_URL,
      connectionTimeoutMillis: 5000,
    });
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const symbol = formData.get('symbol') as string;
    const description = formData.get('description') as string;
    const image = formData.get('image') as File;

    if (!name || !symbol || !description || !image) {
      return NextResponse.json(
        { error: 'Missing required fields: name, symbol, description, image' },
        { status: 400 }
      );
    }

    // Generate unique token URI
    const tokenUriId = generateUUID();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const tokenUri = `${baseUrl}/api/metadata/${tokenUriId}`;

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }

    // Save image file
    const imageExtension = image.name.split('.').pop() || 'png';
    const imageFileName = `token_${Date.now()}_${generateUUID()}.${imageExtension}`;
    const imagePath = join(uploadsDir, imageFileName);
    
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(imagePath, buffer);

    // Store metadata in database
    const relativeImagePath = `/uploads/${imageFileName}`;
    
    await pool.query(`
      INSERT INTO token_metadata (token_uri, name, symbol, description, image_path)
      VALUES ($1, $2, $3, $4, $5)
    `, [tokenUri, name, symbol, description, relativeImagePath]);

    return NextResponse.json({
      tokenUri,
      message: 'Metadata uploaded successfully'
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error uploading metadata:', errorMessage);
    return NextResponse.json(
      { error: `Failed to upload metadata: ${errorMessage}` },
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

