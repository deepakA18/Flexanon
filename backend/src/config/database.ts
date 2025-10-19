import { Pool, PoolClient } from 'pg';

/**
 * PostgreSQL database connection
 * Can be used with local Postgres or Supabase
 */

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL not set in environment variables');
    }

    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected database error:', err);
    });
  }

  return pool;
}

/**
 * Execute a query
 */
export async function query(text: string, params?: any[]) {
  const pool = getPool();
  const start = Date.now();
  
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query', { text: text.substring(0, 100), duration, rows: res.rowCount });
    }
    
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient(): Promise<PoolClient> {
  const pool = getPool();
  return await pool.connect();
}

/**
 * Initialize database schema for on-chain commitment model
 */
export async function initDatabase() {
  console.log('Initializing database schema...');

  try {
    // Create tables
    const createTables = `
      -- Share tokens table (off-chain data only)
      CREATE TABLE IF NOT EXISTS share_tokens (
        token_id VARCHAR(8) PRIMARY KEY,
        owner_address VARCHAR(44) NOT NULL,
        commitment_address VARCHAR(44) NOT NULL,
        commitment_version INT NOT NULL,
        revealed_leaves JSONB NOT NULL,
        proof_data JSONB NOT NULL,
        metadata JSONB,
        revoked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Analytics
      CREATE TABLE IF NOT EXISTS share_views (
        id SERIAL PRIMARY KEY,
        token_id VARCHAR(8) NOT NULL,
        viewer_ip VARCHAR(45),
        user_agent TEXT,
        viewed_at TIMESTAMP DEFAULT NOW()
      );
    `;

    await query(createTables);

    // Create indexes
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_owner_address ON share_tokens(owner_address);
      CREATE INDEX IF NOT EXISTS idx_commitment_address ON share_tokens(commitment_address);
      CREATE INDEX IF NOT EXISTS idx_created_at ON share_tokens(created_at);
      CREATE INDEX IF NOT EXISTS idx_token_id_views ON share_views(token_id);
      CREATE INDEX IF NOT EXISTS idx_viewed_at ON share_views(viewed_at);
    `;

    await query(createIndexes);

    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Close the database pool
 */
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database pool closed');
  }
}

export default {
  getPool,
  query,
  getClient,
  initDatabase,
  closePool
};
