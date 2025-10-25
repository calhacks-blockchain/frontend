import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || '';

// Singleton pool instance
let pool: Pool | null = null;

/**
 * Get or create a singleton database pool
 * This ensures we reuse connections across requests instead of creating new pools
 */
export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: DATABASE_URL,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 10000, // Timeout after 10 seconds if unable to connect
      allowExitOnIdle: false, // Don't exit when all clients are idle
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  return pool;
}

/**
 * Check if database is configured
 */
export function isDatabaseConfigured(): boolean {
  return DATABASE_URL.length > 0;
}

