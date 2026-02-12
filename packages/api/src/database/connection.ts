/**
 * GOVRES — Database Connection
 * 
 * PostgreSQL connection pool using pg.
 * Configured via environment variables matching docker-compose.yml.
 */

import { Pool, QueryResult } from 'pg';
import { logger } from '../utils/logger';

// Neon PostgreSQL connection (cloud database)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
    'postgresql://neondb_owner:npg_IXZ3ogwN9zlE@ep-snowy-rain-aizvsxck-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  logger.error('Unexpected database pool error', { error: err.message });
});

pool.on('connect', () => {
  logger.debug('New database connection established');
});

/**
 * Execute a parameterized query
 */
export async function query(text: string, params?: any[]): Promise<QueryResult<any>> {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', { text: text.substring(0, 80), duration, rows: result.rowCount });
    return result;
  } catch (error: any) {
    logger.error('Query failed', { text: text.substring(0, 80), error: error.message });
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient() {
  const client = await pool.connect();
  return client;
}

/**
 * Test database connectivity
 */
export async function testConnection(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    logger.info('Database connection verified');
    return true;
  } catch (error: any) {
    logger.warn('Database connection failed', { error: error.message });
    return false;
  }
}

export { pool };
