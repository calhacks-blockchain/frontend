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
      console.warn('DATABASE_URL not configured, returning empty holders data');
      return NextResponse.json({ 
        totalHolders: 0,
        uniqueBuyers: 0,
        uniqueSellers: 0,
        topHolders: []
      });
    }

    let pool: Pool | null = null;
    
    try {
      pool = new Pool({ 
        connectionString: DATABASE_URL,
        connectionTimeoutMillis: 5000,
      });

      // Get total unique holders (buyers and sellers)
      const totalHoldersQuery = `
        SELECT COUNT(DISTINCT 
          CASE 
            WHEN type = 'BUY' THEN 
              (SELECT buyer FROM trades t2 WHERE t2.id = trades.id LIMIT 1)
            WHEN type = 'SELL' THEN 
              (SELECT seller FROM trades t2 WHERE t2.id = trades.id LIMIT 1)
          END
        ) as totalHolders
        FROM trades 
        WHERE launchpad_pubkey = $1
      `;

      // Get unique buyers count
      const uniqueBuyersQuery = `
        SELECT COUNT(DISTINCT 
          (SELECT buyer FROM trades t2 WHERE t2.id = trades.id LIMIT 1)
        ) as uniqueBuyers
        FROM trades 
        WHERE launchpad_pubkey = $1 AND type = 'BUY'
      `;

      // Get unique sellers count
      const uniqueSellersQuery = `
        SELECT COUNT(DISTINCT 
          (SELECT seller FROM trades t2 WHERE t2.id = trades.id LIMIT 1)
        ) as uniqueSellers
        FROM trades 
        WHERE launchpad_pubkey = $1 AND type = 'SELL'
      `;

      // Get top holders by volume (simplified - would need more complex logic for actual token balances)
      const topHoldersQuery = `
        SELECT 
          CASE 
            WHEN type = 'BUY' THEN 
              (SELECT buyer FROM trades t2 WHERE t2.id = trades.id LIMIT 1)
            WHEN type = 'SELL' THEN 
              (SELECT seller FROM trades t2 WHERE t2.id = trades.id LIMIT 1)
          END as wallet,
          SUM(volume * price) as totalVolume,
          COUNT(*) as tradeCount,
          SUM(CASE WHEN type = 'BUY' THEN volume ELSE 0 END) as totalBought,
          SUM(CASE WHEN type = 'SELL' THEN volume ELSE 0 END) as totalSold
        FROM trades 
        WHERE launchpad_pubkey = $1
        GROUP BY wallet
        ORDER BY totalVolume DESC
        LIMIT 10
      `;

      // Execute queries in parallel
      const [totalHoldersResult, uniqueBuyersResult, uniqueSellersResult, topHoldersResult] = await Promise.all([
        pool.query(totalHoldersQuery, [launchpadPubkey]),
        pool.query(uniqueBuyersQuery, [launchpadPubkey]),
        pool.query(uniqueSellersQuery, [launchpadPubkey]),
        pool.query(topHoldersQuery, [launchpadPubkey])
      ]);

      const totalHolders = parseInt(totalHoldersResult.rows[0]?.totalHolders || '0');
      const uniqueBuyers = parseInt(uniqueBuyersResult.rows[0]?.uniqueBuyers || '0');
      const uniqueSellers = parseInt(uniqueSellersResult.rows[0]?.uniqueSellers || '0');
      
      const topHolders = topHoldersResult.rows.map(row => ({
        wallet: row.wallet,
        totalVolume: parseFloat(row.totalvolume || '0'),
        tradeCount: parseInt(row.tradecount || '0'),
        totalBought: parseFloat(row.totalbought || '0'),
        totalSold: parseFloat(row.totalsold || '0'),
        netPosition: parseFloat(row.totalbought || '0') - parseFloat(row.totalsold || '0')
      }));

      console.log(`[LOG] Holders data for ${launchpadPubkey}:`, {
        totalHolders,
        uniqueBuyers,
        uniqueSellers,
        topHoldersCount: topHolders.length
      });

      return NextResponse.json({ 
        totalHolders,
        uniqueBuyers,
        uniqueSellers,
        topHolders,
        // Additional metrics
        activeTraders: uniqueBuyers + uniqueSellers,
        netBuyers: uniqueBuyers - uniqueSellers
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
    console.error('Error fetching holders data:', errorMessage);
    
    return NextResponse.json({ 
      error: 'Failed to fetch holders data',
      totalHolders: 0,
      uniqueBuyers: 0,
      uniqueSellers: 0,
      topHolders: []
    }, { status: 500 });
  }
}
