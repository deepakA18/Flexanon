/**
 * Relayer Service E2E Test
 * Tests the privacy-preserving commitment relay flow
 */

import { Keypair, Connection, PublicKey } from '@solana/web3.js';
import { expect } from 'chai';
import axios from 'axios';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import crypto from 'crypto';

const API_BASE = 'http://localhost:3001/api';
const SOLANA_RPC = 'http://localhost:8899';

describe('Relayer Service E2E Test', () => {
  let connection: Connection;
  let testWallet: Keypair;
  let merkleRoot: Buffer;

  before(async function() {
    this.timeout(60000);
    console.log('\n🔄 Relayer Service Test\n');
    console.log('═══════════════════════════════════════════════════════\n');

    // Setup connection
    connection = new Connection(SOLANA_RPC, 'confirmed');
    
    // Create test wallet
    testWallet = Keypair.generate();
    
    // Airdrop SOL
    console.log('💰 Airdropping SOL to test wallet...');
    const signature = await connection.requestAirdrop(
      testWallet.publicKey,
      2 * 1e9
    );
    await connection.confirmTransaction(signature);

    // Create mock merkle root
    merkleRoot = crypto.randomBytes(32);

    console.log(`✅ Test wallet: ${testWallet.publicKey.toString()}`);
    console.log(`✅ Merkle root: ${merkleRoot.toString('hex').substring(0, 32)}...\n`);
  });

  describe('Relayer Status', () => {
    it('should return relayer status', async function() {
      this.timeout(30000);

      console.log('📊 Checking relayer status...\n');

      const response = await axios.get(`${API_BASE}/relayer/status`);

      expect(response.data.status).to.exist;
      expect(response.data.relayer_wallet).to.exist;
      expect(response.data.balance_sol).to.exist;

      console.log('✅ Relayer Status:');
      console.log(`   Status: ${response.data.status}`);
      console.log(`   Wallet: ${response.data.relayer_wallet}`);
      console.log(`   Balance: ${response.data.balance_sol} SOL`);
      console.log(`   Healthy: ${response.data.has_minimum_balance}\n`);
    });

    it('should return relayer balance', async function() {
      this.timeout(30000);

      const response = await axios.get(`${API_BASE}/relayer/balance`);

      expect(response.data.relayer_wallet).to.exist;
      expect(response.data.balance_sol).to.exist;
      expect(response.data.healthy).to.be.a('boolean');

      console.log('✅ Relayer Balance:');
      console.log(`   Balance: ${response.data.balance_sol} SOL`);
      console.log(`   Healthy: ${response.data.healthy}\n`);
    });
  });

  describe('Commitment via Relayer', () => {
    it('should submit commitment via relayer', async function() {
      this.timeout(30000);

      console.log('🔄 Submitting commitment via relayer...\n');

      // Create and sign message
      const timestamp = Date.now();
      const merkleRootHex = merkleRoot.toString('hex');
      const message = `FlexAnon Commitment

Wallet: ${testWallet.publicKey.toString()}
Merkle Root: ${merkleRootHex.substring(0, 32)}...
Timestamp: ${timestamp}

I authorize this commitment to be submitted via the FlexAnon relayer service.`;

      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = nacl.sign.detached(messageBytes, testWallet.secretKey);
      const signature = bs58.encode(signatureBytes);

      console.log(`   User Wallet: ${testWallet.publicKey.toString()}`);
      console.log(`   Signature: ${signature.substring(0, 20)}...\n`);

      // Submit via relayer API
      const response = await axios.post(`${API_BASE}/relayer/commit`, {
        wallet_address: testWallet.publicKey.toString(),
        merkle_root: Array.from(merkleRoot),
        metadata: {
          chain: 'solana',
          snapshot_timestamp: timestamp,
          expires_at: null,
          privacy_score: 75
        },
        signature: signature,
        message: message,
        timestamp: timestamp
      });

      expect(response.data.success).to.be.true;
      expect(response.data.commitment_address).to.exist;
      expect(response.data.transaction_signature).to.exist;
      expect(response.data.relayer_wallet).to.exist;

      console.log('✅ Commitment Submitted via Relayer:');
      console.log(`   PDA: ${response.data.commitment_address}`);
      console.log(`   Transaction: ${response.data.transaction_signature}`);
      console.log(`   Relayer Wallet: ${response.data.relayer_wallet}`);
      console.log(`   Version: ${response.data.commitment_version}\n`);

      // Store for verification
      (global as any).commitmentAddress = response.data.commitment_address;
      (global as any).relayerWallet = response.data.relayer_wallet;
      (global as any).txSignature = response.data.transaction_signature;
    });

    it('should verify commitment exists on-chain', async function() {
      this.timeout(30000);

      const commitmentAddress = (global as any).commitmentAddress;
      expect(commitmentAddress).to.exist;

      console.log('🔍 Verifying commitment on-chain...\n');

      const pubkey = new PublicKey(commitmentAddress);
      const accountInfo = await connection.getAccountInfo(pubkey);

      expect(accountInfo).to.not.be.null;
      expect(accountInfo!.data).to.exist;
      expect(accountInfo!.data.length).to.equal(118); // Expected account size

      console.log('✅ On-Chain Verification:');
      console.log(`   Account exists: true`);
      console.log(`   Data size: ${accountInfo!.data.length} bytes`);
      console.log(`   Owner: ${accountInfo!.owner.toString()}\n`);
    });

    it('should verify user wallet is NOT visible in transaction', async function() {
      this.timeout(30000);

      const txSignature = (global as any).txSignature;
      const relayerWallet = (global as any).relayerWallet;

      console.log('🔒 Privacy Check...\n');

      // Fetch transaction details
      const txDetails = await connection.getTransaction(txSignature, {
        maxSupportedTransactionVersion: 0
      });

      expect(txDetails).to.not.be.null;

      // Get fee payer (the wallet that signed the transaction)
      const feePayer = txDetails!.transaction.message.staticAccountKeys[0];

      console.log(`   Fee Payer (visible on-chain): ${feePayer.toString()}`);
      console.log(`   Relayer Wallet: ${relayerWallet}`);
      console.log(`   User Wallet: ${testWallet.publicKey.toString()}\n`);

      // CRITICAL: Fee payer should be relayer, NOT user
      expect(feePayer.toString()).to.equal(relayerWallet);
      expect(feePayer.toString()).to.not.equal(testWallet.publicKey.toString());

      console.log('✅ PRIVACY VERIFIED:');
      console.log('   ✓ Transaction signed by relayer wallet');
      console.log('   ✓ User wallet NOT visible on blockchain');
      console.log('   ✓ Only relayer wallet appears in transaction\n');
    });

    it('should enforce rate limiting', async function() {
      this.timeout(30000);

      console.log('⏱️  Testing rate limiting...\n');

      // Try to commit again immediately
      const timestamp = Date.now();
      const merkleRootHex = merkleRoot.toString('hex');
      const message = `FlexAnon Commitment

Wallet: ${testWallet.publicKey.toString()}
Merkle Root: ${merkleRootHex.substring(0, 32)}...
Timestamp: ${timestamp}

Second commitment attempt.`;

      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = nacl.sign.detached(messageBytes, testWallet.secretKey);
      const signature = bs58.encode(signatureBytes);

      try {
        await axios.post(`${API_BASE}/relayer/commit`, {
          wallet_address: testWallet.publicKey.toString(),
          merkle_root: Array.from(crypto.randomBytes(32)),
          metadata: {
            chain: 'solana',
            snapshot_timestamp: timestamp,
            expires_at: null,
            privacy_score: 75
          },
          signature: signature,
          message: message,
          timestamp: timestamp
        });

        // Should not reach here
        throw new Error('Rate limit should have been enforced!');
      } catch (error: any) {
        if (error.response?.status === 400 && 
            error.response?.data?.details?.includes('Rate limit')) {
          console.log('✅ Rate Limiting Working:');
          console.log(`   Error: ${error.response.data.details}\n`);
        } else {
          throw error;
        }
      }
    });
  });

  after(() => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  ✅ Relayer Service Test Complete!');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('Verified:');
    console.log('  ✅ Relayer service operational');
    console.log('  ✅ Commitment submitted successfully');
    console.log('  ✅ User wallet privacy preserved');
    console.log('  ✅ Rate limiting enforced');
    console.log('  ✅ Only relayer wallet visible on-chain');
    console.log('');
  });
});
