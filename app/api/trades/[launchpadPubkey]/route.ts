import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || '';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ launchpadPubkey: string }> }
) {
  const { launchpadPubkey } = await params;
  
  try {
    if (!launchpadPubkey) {
      return NextResponse.json({ error: 'launchpadPubkey is required' }, { status: 400 });
    }

    console.log(`[LOG] Fetching trades for: ${launchpadPubkey}`);
    
    if (!DATABASE_URL) {
      console.warn('[WARN] No DATABASE_URL provided, returning empty trades');
      return NextResponse.json([]);
    }

    let pool: Pool | null = null;
    
    try {
      pool = new Pool({ 
        connectionString: DATABASE_URL,
        connectionTimeoutMillis: 5000,
      });

      // Fetch trades ordered by timestamp (newest first)
      const result = await pool.query(`
        SELECT 
          id,
          timestamp,
          price,
          volume,
          type
        FROM trades 
        WHERE launchpad_pubkey = $1
        ORDER BY timestamp DESC
        LIMIT 100
      `, [launchpadPubkey]);

      const trades = result.rows.map(row => ({
        id: row.id.toString(),
        timestamp: new Date(row.timestamp), // Convert to Date object
        price: parseFloat(row.price),
        volume: parseFloat(row.volume),
        type: row.type.toLowerCase(), // Convert 'BUY'/'SELL' to 'buy'/'sell'
        // Calculate derived fields for compatibility with existing UI
        amount: parseFloat(row.volume),
        total: parseFloat(row.price) * parseFloat(row.volume),
        wallet: 'Unknown', // We don't track individual wallets in current schema
        marketCap: null // We don't calculate market cap at time of trade
      }));

      console.log(`[LOG] Found ${trades.length} trades for ${launchpadPubkey}`);

      return NextResponse.json(trades);

    } finally {
      if (pool) {
        try {
          await pool.end();
        } catch (endError) {
          console.error('Error closing pool:', endError);
        }
      }
    }

  } catch (e) {
    console.error('[FATAL] Failed to fetch trades:', e);
    return NextResponse.json({ error: 'Failed to fetch trades from database.' }, { status: 500 });
  }
}
