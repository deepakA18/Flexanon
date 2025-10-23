/**
 * Reset Database - Fresh Start
 * Run: npm run reset-db
 */

import dotenv from 'dotenv';
import { query } from '../src/config/database';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables FIRST
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function resetDatabase() {
  try {
    console.log('🗑️  Dropping all tables...');

    // Drop tables in correct order (reverse of dependencies)
    await query('DROP TABLE IF EXISTS share_views CASCADE');
    await query('DROP TABLE IF EXISTS share_tokens CASCADE');
    await query('DROP TABLE IF EXISTS commitments CASCADE');
    await query('DROP TABLE IF EXISTS subscriptions CASCADE');

    console.log('✅ All tables dropped');

    console.log('📝 Running migrations...');

    // Run migrations in order
    const migrations = [
      '001_initial_schema.sql',
      '002_share_tokens.sql',
      '003_share_views.sql',
      '004_subscriptions.sql'
    ];

    for (const migration of migrations) {
      const filePath = path.join(__dirname, '../migrations', migration);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Skipping ${migration} (file not found)`);
        continue;
      }

      const sql = fs.readFileSync(filePath, 'utf8');
      await query(sql);
      console.log(`✅ Applied ${migration}`);
    }

    console.log('');
    console.log('🎉 Database reset complete!');
    console.log('');

    // Show tables
    const result = await query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    console.log('📋 Current tables:');
    result.rows.forEach(row => {
      console.log(`   - ${row.tablename}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
}

resetDatabase();
