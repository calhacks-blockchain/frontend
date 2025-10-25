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
    const interval = searchParams.get('interval') || '1m'; // 15s, 1m, 5m, 15m, 1h, 4h, 1d
    const fromQuery = searchParams.get('from');
    const toQuery = searchParams.get('to');

    // Convert interval to seconds
    const bucketMap: Record<string, number> = {
      '15s': 15,
      '1m': 60,
      '5m': 300,
      '15m': 900,
      '1h': 3600,
      '4h': 14400,
      '1d': 86400,
    };
    const bucket = bucketMap[interval] || 60;

    // Simple query: only create candles where trades actually exist
    const sql = `
      SELECT
        to_timestamp(floor(extract(epoch from timestamp) / $2) * $2) as time_bucket,
        (array_agg(price ORDER BY timestamp ASC))[1] as open,
        MAX(price) as high,
        MIN(price) as low,
        (array_agg(price ORDER BY timestamp DESC))[1] as close,
        SUM(volume) as volume,
        COUNT(*) as trade_count,
        COUNT(CASE WHEN type = 'BUY' THEN 1 END) as buy_count,
        COUNT(CASE WHEN type = 'SELL' THEN 1 END) as sell_count
      FROM trades
      WHERE launchpad_pubkey = $1
      ${fromQuery ? `AND timestamp >= $3` : ''}
      ${toQuery ? `AND timestamp <= $${fromQuery ? '4' : '3'}` : ''}
      GROUP BY time_bucket
      ORDER BY time_bucket ASC;
    `;

    const params: any[] = [launchpadPubkey, bucket];
    if (fromQuery) params.push(new Date(parseInt(fromQuery, 10)));
    if (toQuery) params.push(new Date(parseInt(toQuery, 10)));

    const result = await pool.query(sql, params);

    const candles = result.rows.map(row => ({
      time: new Date(row.time_bucket).toISOString(),
      open: parseFloat(row.open),
      high: parseFloat(row.high),
      low: parseFloat(row.low),
      close: parseFloat(row.close),
      volume: parseFloat(row.volume),
      tradeCount: parseInt(row.trade_count, 10),
      buyCount: parseInt(row.buy_count) || 0,
      sellCount: parseInt(row.sell_count) || 0,
    }));

    console.log(`Returning ${candles.length} candles for ${launchpadPubkey} with ${interval} interval`);
    
    if (candles.length > 0) {
      console.log('Sample candle data:', JSON.stringify(candles.slice(0, 3), null, 2));
    }

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

