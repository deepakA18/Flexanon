#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🔐 Generating security keys for Flexanon...\n');

const jwtSecret = crypto.randomBytes(32).toString('hex');
const encryptionKey = crypto.randomBytes(32).toString('hex');

console.log('✅ Generated JWT_SECRET:', jwtSecret);
console.log('✅ Generated ENCRYPTION_KEY:', encryptionKey);
console.log('');

// Read current .env
const envPath = path.join(__dirname, '..', '.env');
let envContent = fs.readFileSync(envPath, 'utf8');

// Replace placeholders
envContent = envContent.replace(
  'JWT_SECRET=your_random_jwt_secret_32_chars_min_change_this',
  `JWT_SECRET=${jwtSecret}`
);
envContent = envContent.replace(
  'ENCRYPTION_KEY=your_32_byte_encryption_key_change_this',
  `ENCRYPTION_KEY=${encryptionKey}`
);

// Write back
fs.writeFileSync(envPath, envContent);

console.log('✅ Updated .env file with new keys');
console.log('');
console.log('📝 Next steps:');
console.log('1. Go to https://supabase.com and create a project');
console.log('2. Get your database connection string from Settings > Database');
console.log('3. Update DATABASE_URL in .env with your Supabase connection string');
console.log('4. Get Zerion API key: https://zerion-io.typeform.com/to/QI3GRa7t');
console.log('5. Update ZERION_API_KEY in .env');
console.log('');
console.log('Then run: pnpm run dev');
