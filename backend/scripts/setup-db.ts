import dotenv from 'dotenv';
import { initDatabase, closePool } from '../src/config/database';

dotenv.config();

async function setupDatabase() {
  console.log('🔧 Setting up Flexanon database...\n');

  try {
    await initDatabase();
    console.log('\n✅ Database setup completed successfully!');
    console.log('\nYou can now run: npm run dev');
  } catch (error) {
    console.error('\n❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

setupDatabase();
