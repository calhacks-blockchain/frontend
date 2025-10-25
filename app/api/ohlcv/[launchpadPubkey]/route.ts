import { NextRequest, NextResponse } from 'next/server';
import { getPool, isDatabaseConfigured } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ launchpadPubkey: string }> }
) {
  const { launchpadPubkey } = await params;
  const { searchParams } = new URL(request.url);
  
  if (!launchpadPubkey) {
    return NextResponse.json({ error: 'Launchpad pubkey is required' }, { status: 400 });
  }

  // If no database URL, return empty data
  if (!isDatabaseConfigured()) {
    console.warn('DATABASE_URL not configured, returning empty OHLCV data');
    return NextResponse.json({ candles: [] });
  }

  try {
    const pool = getPool();

    // Get query parameters
    const interval = searchParams.get('interval') || '1h'; // 5m, 15m, 1h, 4h, 1d
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Convert interval to minutes
    const intervalMinutes: Record<string, number> = {
      '5m': 5,
      '15m': 15,
      '1h': 60,
      '4h': 240,
      '1d': 1440,
    };

    const minutes = intervalMinutes[interval] || 60;

    // Build the query
    let query = `
      SELECT 
        date_trunc('hour', timestamp) + 
        (floor(extract(minute from timestamp) / $2) * $2) * interval '1 minute' as time_bucket,
        MIN(price) as low,
        MAX(price) as high,
        (array_agg(price ORDER BY timestamp ASC))[1] as open,
        (array_agg(price ORDER BY timestamp DESC))[1] as close,
        SUM(volume) as volume,
        COUNT(CASE WHEN type = 'BUY' THEN 1 END) as buy_count,
        COUNT(CASE WHEN type = 'SELL' THEN 1 END) as sell_count
      FROM trades
      WHERE launchpad_pubkey = $1
    `;

    const params: any[] = [launchpadPubkey, minutes];
    let paramIndex = 3;

    if (from) {
      query += ` AND timestamp >= $${paramIndex}`;
      params.push(new Date(from));
      paramIndex++;
    }

    if (to) {
      query += ` AND timestamp <= $${paramIndex}`;
      params.push(new Date(to));
      paramIndex++;
    }

    query += `
      GROUP BY time_bucket
      ORDER BY time_bucket ASC
    `;

    const result = await pool.query(query, params);

    const candles = result.rows.map(row => ({
      time: new Date(row.time_bucket).toISOString(), // ISO string format
      open: parseFloat(row.open),
      high: parseFloat(row.high),
      low: parseFloat(row.low),
      close: parseFloat(row.close),
      volume: parseFloat(row.volume),
      buyCount: parseInt(row.buy_count) || 0,
      sellCount: parseInt(row.sell_count) || 0,
    }));

    return NextResponse.json({ candles });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching OHLCV data:', errorMessage);
    
    // Return empty data instead of error
    return NextResponse.json({ 
      candles: [],
      warning: 'OHLCV data unavailable'
    });
  }
}

