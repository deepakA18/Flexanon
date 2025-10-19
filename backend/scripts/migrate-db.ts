import dotenv from 'dotenv';
import { query, closePool } from '../src/config/database';

dotenv.config();

async function migrateDatabase() {
  console.log('🔄 Migrating database to new schema...\n');

  try {
    // Drop old tables
    console.log('📦 Dropping old tables...');
    await query(`
      DROP TABLE IF EXISTS share_views CASCADE;
      DROP TABLE IF EXISTS share_tokens CASCADE;
      DROP TABLE IF EXISTS sessions CASCADE;
      DROP TABLE IF EXISTS wallet_nonces CASCADE;
    `);
    console.log('✅ Old tables dropped\n');

    // Create new schema
    console.log('📦 Creating new schema...');
    
    const createTables = `
      -- Share tokens table (off-chain data only)
      -- On-chain: merkle root, owner, version, revoked
      -- Off-chain: proofs, revealed data, token mapping
      CREATE TABLE IF NOT EXISTS share_tokens (
        token_id VARCHAR(8) PRIMARY KEY,
        owner_address VARCHAR(44) NOT NULL,       -- Solana wallet (base58)
        commitment_address VARCHAR(44) NOT NULL,  -- Solana PDA (base58)
        commitment_version INT NOT NULL,          -- Version at creation time
        revealed_leaves JSONB NOT NULL,           -- Which leaves to show
        proof_data JSONB NOT NULL,                -- Merkle proofs
        metadata JSONB,                           -- Off-chain only metadata
        revoked BOOLEAN DEFAULT FALSE,            -- Off-chain revocation
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Analytics (optional)
      CREATE TABLE IF NOT EXISTS share_views (
        id SERIAL PRIMARY KEY,
        token_id VARCHAR(8) NOT NULL,
        viewer_ip VARCHAR(45),
        user_agent TEXT,
        viewed_at TIMESTAMP DEFAULT NOW()
      );
    `;

    await query(createTables);
    console.log('✅ Tables created\n');

    // Create indexes
    console.log('📦 Creating indexes...');
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_owner_address ON share_tokens(owner_address);
      CREATE INDEX IF NOT EXISTS idx_commitment_address ON share_tokens(commitment_address);
      CREATE INDEX IF NOT EXISTS idx_created_at ON share_tokens(created_at);
      CREATE INDEX IF NOT EXISTS idx_token_id ON share_views(token_id);
      CREATE INDEX IF NOT EXISTS idx_viewed_at ON share_views(viewed_at);
    `;

    await query(createIndexes);
    console.log('✅ Indexes created\n');

    console.log('✅ Migration completed successfully!');
    console.log('\nNew schema:');
    console.log('  - share_tokens (updated with on-chain integration)');
    console.log('  - share_views (analytics)');
    console.log('\nRemoved tables:');
    console.log('  - sessions (no longer needed)');
    console.log('  - wallet_nonces (no longer needed)');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await closePool();
  }
}

migrateDatabase();
