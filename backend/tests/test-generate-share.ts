/**
 * Test script to generate a share link with real signature
 * 
 * This script simulates what the frontend will do:
 * 1. Create ownership message
 * 2. Sign with wallet (you'll need to do this manually)
 * 3. Call API
 */

import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

async function testShareGeneration() {
  console.log('🧪 Testing Share Link Generation\n');

  // For testing, generate a test keypair (in production, user signs with their wallet)
  const testWallet = Keypair.generate();
  const walletAddress = testWallet.publicKey.toString();
  
  console.log(`📝 Test Wallet: ${walletAddress}\n`);

  // 1. Create ownership message
  const timestamp = Date.now();
  const message = `FlexAnon Ownership Verification\n\nI am the owner of wallet: ${walletAddress}\n\nTimestamp: ${timestamp}\n\nThis signature proves I own this wallet and authorize share link generation.`;

  console.log('📝 Message to sign:');
  console.log(message);
  console.log('');

  // 2. Sign message
  const messageBytes = new TextEncoder().encode(message);
  const signatureBytes = nacl.sign.detached(messageBytes, testWallet.secretKey);
  const signature = bs58.encode(signatureBytes);

  console.log(`✍️  Signature: ${signature.slice(0, 20)}...\n`);

  // 3. Derive commitment PDA (you need to create this on-chain first!)
  console.log('⚠️  NOTE: You need to create a commitment on-chain first!');
  console.log('   Run: cd ../solana-programs && anchor test\n');
  
  // For this test, we'll use a dummy PDA
  const dummyCommitmentAddress = testWallet.publicKey.toString();

  // 4. Call API
  console.log('📡 Calling /api/share/generate...\n');

  try {
    const response = await axios.post(`${API_BASE}/share/generate`, {
      wallet_address: walletAddress,
      signature: signature,
      message: message,
      timestamp: timestamp,
      commitment_address: dummyCommitmentAddress,
      commitment_version: 1,
      chain: 'solana',
      reveal_preferences: {
        show_total_value: true,
        show_pnl: true,
        show_top_assets: true,
        top_assets_count: 3,
        show_wallet_address: false
      }
    });

    console.log('✅ SUCCESS!');
    console.log('Share URL:', response.data.share_url);
    console.log('Token ID:', response.data.token_id);
    console.log('\nFull response:', JSON.stringify(response.data, null, 2));

  } catch (error: any) {
    console.error('❌ ERROR:', error.response?.data || error.message);
    
    if (error.response?.data?.details) {
      console.error('Details:', error.response.data.details);
    }
  }
}

// For testing with a REAL mainnet wallet that has Zerion data
async function testWithRealWallet() {
  console.log('\n🧪 Testing with REAL mainnet wallet\n');

  // This wallet has actual Zerion data
  const walletAddress = 'CDSjb7bgX388TMZ7T2LPgEz6J6vbA9B5ugF8qLnRgk8N';
  
  console.log('⚠️  To test with a real wallet, you need to:');
  console.log('1. Connect your Phantom/Solflare wallet');
  console.log('2. Sign the ownership message');
  console.log('3. Use the signature in the API call\n');
  console.log('This must be done in the frontend with wallet-adapter!\n');
}

// Run test
console.log('═══════════════════════════════════════════════════════');
console.log('  FlexAnon - Share Link Generation Test');
console.log('═══════════════════════════════════════════════════════\n');

testShareGeneration().then(() => {
  testWithRealWallet();
});
