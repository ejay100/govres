/**
 * GOVRES — Database Connection
 * 
 * PostgreSQL connection pool using pg.
 * Configured via environment variables matching docker-compose.yml.
 */

import { Pool, QueryResult } from 'pg';
import { logger } from '../utils/logger';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'govres',
  user: process.env.DB_USER || 'govres_admin',
  password: process.env.DB_PASSWORD || 'govres_dev_password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
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
