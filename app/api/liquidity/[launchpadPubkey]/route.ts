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

    // If no database URL, return empty data
    if (!DATABASE_URL) {
      console.warn('DATABASE_URL not configured, returning empty liquidity data');
      return NextResponse.json({ 
        volume24h: 0,
        volume7d: 0,
        totalVolume: 0,
        tradeCount24h: 0,
        tradeCount7d: 0,
        totalTrades: 0
      });
    }

    let pool: Pool | null = null;
    
    try {
      pool = new Pool({ 
        connectionString: DATABASE_URL,
        connectionTimeoutMillis: 5000,
      });

      // Calculate 24h volume and trade count
      const volume24hQuery = `
        SELECT 
          SUM(volume * price) as volume24h,
          COUNT(*) as tradeCount24h
        FROM trades 
        WHERE launchpad_pubkey = $1 
        AND timestamp >= NOW() - INTERVAL '24 hours'
      `;

      // Calculate 7d volume and trade count
      const volume7dQuery = `
        SELECT 
          SUM(volume * price) as volume7d,
          COUNT(*) as tradeCount7d
        FROM trades 
        WHERE launchpad_pubkey = $1 
        AND timestamp >= NOW() - INTERVAL '7 days'
      `;

      // Calculate total volume and trade count
      const totalVolumeQuery = `
        SELECT 
          SUM(volume * price) as totalVolume,
          COUNT(*) as totalTrades
        FROM trades 
        WHERE launchpad_pubkey = $1
      `;

      // Execute all queries in parallel
      const [volume24hResult, volume7dResult, totalVolumeResult] = await Promise.all([
        pool.query(volume24hQuery, [launchpadPubkey]),
        pool.query(volume7dQuery, [launchpadPubkey]),
        pool.query(totalVolumeQuery, [launchpadPubkey])
      ]);

      const volume24h = parseFloat(volume24hResult.rows[0]?.volume24h || '0');
      const tradeCount24h = parseInt(volume24hResult.rows[0]?.tradeCount24h || '0');
      
      const volume7d = parseFloat(volume7dResult.rows[0]?.volume7d || '0');
      const tradeCount7d = parseInt(volume7dResult.rows[0]?.tradeCount7d || '0');
      
      const totalVolume = parseFloat(totalVolumeResult.rows[0]?.totalVolume || '0');
      const totalTrades = parseInt(totalVolumeResult.rows[0]?.totalTrades || '0');

      console.log(`[LOG] Liquidity data for ${launchpadPubkey}:`, {
        volume24h,
        volume7d,
        totalVolume,
        tradeCount24h,
        tradeCount7d,
        totalTrades
      });

      return NextResponse.json({ 
        volume24h,
        volume7d,
        totalVolume,
        tradeCount24h,
        tradeCount7d,
        totalTrades,
        // Additional metrics
        avgTradeSize24h: tradeCount24h > 0 ? volume24h / tradeCount24h : 0,
        avgTradeSize7d: tradeCount7d > 0 ? volume7d / tradeCount7d : 0,
        avgTradeSizeTotal: totalTrades > 0 ? totalVolume / totalTrades : 0
      });

    } finally {
      if (pool) {
        try {
          await pool.end();
        } catch (endError) {
          console.error('Error closing pool:', endError);
        }
      }
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching liquidity data:', errorMessage);
    
    return NextResponse.json({ 
      error: 'Failed to fetch liquidity data',
      volume24h: 0,
      volume7d: 0,
      totalVolume: 0,
      tradeCount24h: 0,
      tradeCount7d: 0,
      totalTrades: 0
    }, { status: 500 });
  }
}
