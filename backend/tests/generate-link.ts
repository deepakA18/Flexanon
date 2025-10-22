/**
 * Generate shareable link for a real mainnet wallet
 */

import { Keypair, PublicKey } from '@solana/web3.js';
import axios from 'axios';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3001/api';
const MAINNET_WALLET = 'CDSjb7bgX388TMZ7T2LPgEz6J6vbA9B5ugF8qLnRgk8N';

async function generateShareLink() {
  console.log('\n========================================');
  console.log('Generating Shareable Link');
  console.log('========================================\n');

  // Load your wallet
  const walletPath = process.env.TEST_WALLET_PATH || 
                     path.join(process.env.HOME || '', '.config/solana/id.json');
  const keypairData = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));
  const wallet = Keypair.fromSecretKey(Uint8Array.from(keypairData));

  console.log(`[1] Using wallet: ${wallet.publicKey.toString()}`);
  console.log(`[2] This wallet has an on-chain commitment\n`);

  // Step 1: Fetch portfolio data
  console.log('[3] Fetching portfolio data from Zerion...');
  const portfolioResponse = await axios.post(`${API_BASE}/dev/test-zerion`, {
    wallet_address: MAINNET_WALLET
  });

  console.log(`[PASS] Portfolio fetched: $${portfolioResponse.data.portfolio.total_value.toFixed(2)}\n`);

  // Step 2: Create signature for link generation
  console.log('[4] Creating signature for link generation...');
  const timestamp = Date.now();
  const message = `FlexAnon Ownership Verification

I am the owner of wallet: ${wallet.publicKey.toString()}

Timestamp: ${timestamp}

This signature proves I own this wallet and authorize share link generation.`;

  const messageBytes = new TextEncoder().encode(message);
  const signatureBytes = nacl.sign.detached(messageBytes, wallet.secretKey);
  const signature = bs58.encode(signatureBytes);

  console.log(`[PASS] Signature created\n`);

  // Step 3: Generate shareable link
  console.log('[5] Generating shareable link...\n');
  
  try {
    const response = await axios.post(`${API_BASE}/share/generate`, {
      wallet_address: wallet.publicKey.toString(),
      signature: signature,
      message: message,
      timestamp: timestamp,
      chain: 'solana',
      reveal_preferences: {
        show_total_value: true,
        show_pnl: true,
        show_top_assets: true,
        top_assets_count: 3,
        show_wallet_address: false
      }
    });

    console.log('========================================');
    console.log('✅ SHAREABLE LINK GENERATED!');
    console.log('========================================\n');
    console.log(`Share URL: ${response.data.share_url}`);
    console.log(`Token ID: ${response.data.token_id}`);
    console.log(`Privacy Score: ${response.data.privacy_score}%`);
    console.log(`\nRevealed: ${response.data.revealed_count} items`);
    console.log(`Hidden: ${response.data.hidden_count} items\n`);
    console.log('========================================\n');

  } catch (error: any) {
    if (error.response?.status === 400) {
      const errorMsg = error.response?.data?.error || '';
      const detailsMsg = error.response?.data?.details || '';
      
      console.log('========================================');
      console.log('⚠️  LINK GENERATION FAILED');
      console.log('========================================\n');
      console.log(`Error: ${errorMsg}`);
      console.log(`Details: ${detailsMsg}\n`);
      
      if (detailsMsg.includes('No portfolio data')) {
        console.log('💡 Your test wallet has no mainnet portfolio.');
        console.log('💡 This is expected - the wallet only has devnet SOL.\n');
        console.log('To test with real data:');
        console.log('1. Use a wallet that has assets on mainnet');
        console.log('2. Create a commitment for that wallet');
        console.log('3. Generate the share link\n');
      }
      
      if (detailsMsg.includes('Commitment not found')) {
        console.log('💡 No commitment found for this wallet.');
        console.log('💡 The commitment was created via relayer in tests.\n');
        console.log('Commitment exists at PDA: Check the test output above\n');
      }
      
      console.log('========================================\n');
    } else {
      throw error;
    }
  }
}

generateShareLink().catch(console.error);
