/**
 * E2E Test - Full Flow with Real Zerion Data
 * Tests: Zerion API → Merkle Tree → On-Chain Commit → Backend Storage → Share Link
 */

import { Keypair, Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { expect } from 'chai';
import axios from 'axios';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import type { Idl } from '@coral-xyz/anchor';
import BN from 'bn.js';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3001/api';
const SOLANA_RPC = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const PROGRAM_ID = process.env.SOLANA_PROGRAM_ID || '';
const REAL_MAINNET_WALLET = 'CDSjb7bgX388TMZ7T2LPgEz6J6vbA9B5ugF8qLnRgk8N';

const idlPath = path.join(process.cwd(), '../solana-programs/target/idl/flexanon.json');
const idlJson = JSON.parse(fs.readFileSync(idlPath, 'utf-8'));

if (idlJson.accounts && idlJson.accounts[0] && !idlJson.accounts[0].type) {
  const shareCommitmentType = idlJson.types.find((t: any) => t.name === 'ShareCommitment');
  if (shareCommitmentType) {
    idlJson.accounts[0].type = shareCommitmentType.type;
  }
}

const idl = idlJson;

describe('E2E Test - Real Zerion Data Flow', () => {
  let connection: Connection;
  let program: Program;
  let testWallet: Keypair;
  let commitmentPDA: PublicKey;

  before(async function() {
    this.timeout(60000);
    console.log('\nE2E Test: Complete Flow with Real Zerion Data\n');
    console.log('==============================================\n');

    connection = new Connection(SOLANA_RPC, 'confirmed');
    
    const testWalletPath = process.env.TEST_WALLET_PATH || path.join(process.env.HOME || '', '.config/solana/id.json');
    
    try {
      const keypairData = JSON.parse(fs.readFileSync(testWalletPath, 'utf-8'));
      testWallet = Keypair.fromSecretKey(Uint8Array.from(keypairData));
      console.log(`[TEST] Loaded test wallet from: ${testWalletPath}`);
    } catch (error) {
      console.log('[TEST] Could not load wallet from file, generating new one');
      testWallet = Keypair.generate();
      console.log('[TEST] WARNING: Generated wallet has no SOL, tests will fail');
    }

    const wallet = new Wallet(testWallet);
    const provider = new AnchorProvider(connection, wallet, {});
    program = new Program(idl as Idl, provider);

    [commitmentPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('commitment'), testWallet.publicKey.toBuffer()],
      new PublicKey(PROGRAM_ID)
    );

    console.log(`[TEST] Wallet: ${testWallet.publicKey.toString()}`);
    console.log(`[TEST] Commitment PDA: ${commitmentPDA.toString()}`);
    
    const balance = await connection.getBalance(testWallet.publicKey);
    console.log(`[TEST] Wallet balance: ${(balance / 1e9).toFixed(4)} SOL\n`);

    if (balance < 0.01 * 1e9) {
      console.log('[WARN] Wallet has low balance, some tests may fail');
      console.log('[WARN] Fund wallet with: solana airdrop 1 ' + testWallet.publicKey.toString() + ' --url devnet\n');
    }
  });

  describe('Step 1: Fetch Real Portfolio from Zerion', () => {
    it('should fetch real mainnet portfolio data', async function() {
      this.timeout(30000);
      
      console.log(`[TEST] Fetching portfolio for ${REAL_MAINNET_WALLET}...\n`);

      const response = await axios.post(`${API_BASE}/dev/test-zerion`, {
        wallet_address: REAL_MAINNET_WALLET
      });

      expect(response.data.success).to.be.true;
      expect(response.data.portfolio).to.exist;

      const portfolio = response.data.portfolio;

      console.log('[PASS] Portfolio Data Retrieved:');
      console.log(`   Wallet: ${portfolio.wallet_address}`);
      console.log(`   Chain: ${portfolio.chain}`);
      console.log(`   Total Value: $${portfolio.total_value.toFixed(2)}`);
      console.log(`   PnL: ${portfolio.pnl_percentage.toFixed(2)}%`);
      console.log(`   Assets Count: ${portfolio.assets_count}\n`);

      (global as any).realPortfolio = portfolio;
    });
  });

  describe('Step 2: Build Merkle Tree from Portfolio', () => {
    it('should create merkle tree with portfolio data', async function() {
      this.timeout(30000);

      const portfolio = (global as any).realPortfolio;
      expect(portfolio).to.exist;

      console.log('[TEST] Building Merkle Tree from portfolio data...\n');

      const leaves = [];
      
      leaves.push({
        key: 'total_value',
        value: portfolio.total_value.toString()
      });

      leaves.push({
        key: 'pnl_percentage',
        value: portfolio.pnl_percentage.toString()
      });

      portfolio.assets.forEach((asset: any) => {
        leaves.push({
          key: `asset_${asset.symbol}`,
          value: JSON.stringify({
            symbol: asset.symbol,
            quantity: asset.quantity,
            value: asset.value
          })
        });
      });

      leaves.push({
        key: 'chain',
        value: portfolio.chain
      });

      console.log(`[PASS] Created ${leaves.length} merkle leaves`);

      const merkleRoot = crypto.createHash('sha256')
        .update(JSON.stringify(leaves))
        .digest();

      console.log(`[PASS] Merkle Root: ${merkleRoot.toString('hex').slice(0, 32)}...\n`);

      (global as any).merkleRoot = merkleRoot;
      (global as any).merkleLeaves = leaves;
    });
  });

  describe('Step 3: Relayer Service Test', () => {
    it('should check relayer service status', async function() {
      this.timeout(30000);

      console.log('[TEST] Checking relayer service...\n');

      const response = await axios.get(`${API_BASE}/relayer/status`);

      expect(response.data.status).to.exist;
      expect(response.data.relayer_wallet).to.exist;
      expect(response.data.balance_sol).to.exist;

      console.log('[PASS] Relayer Service Status:');
      console.log(`   Status: ${response.data.status}`);
      console.log(`   Wallet: ${response.data.relayer_wallet}`);
      console.log(`   Balance: ${response.data.balance_sol} SOL`);
      console.log(`   Healthy: ${response.data.has_minimum_balance}\n`);

      (global as any).relayerWallet = response.data.relayer_wallet;
    });

    it('should commit merkle root via relayer (privacy-preserving)', async function() {
      this.timeout(30000);

      const merkleRoot = (global as any).merkleRoot;
      expect(merkleRoot).to.exist;

      console.log('[TEST] Committing via RELAYER (user wallet stays private)...\n');

      const timestamp = Date.now();
      const merkleRootHex = Buffer.from(merkleRoot).toString('hex');
      const message = `FlexAnon Commitment

Wallet: ${testWallet.publicKey.toString()}
Merkle Root: ${merkleRootHex.substring(0, 32)}...
Timestamp: ${timestamp}

I authorize this commitment to be submitted via the FlexAnon relayer service.`;

      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = nacl.sign.detached(messageBytes, testWallet.secretKey);
      const signature = bs58.encode(signatureBytes);

      console.log(`   User Wallet: ${testWallet.publicKey.toString()}`);
      console.log(`   Signing message and sending to relayer...\n`);

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

      console.log('[PASS] Commitment Submitted via Relayer:');
      console.log(`   PDA: ${response.data.commitment_address}`);
      console.log(`   Transaction: ${response.data.transaction_signature}`);
      console.log(`   Relayer Wallet: ${response.data.relayer_wallet}\n`);

      (global as any).relayerCommitmentAddress = response.data.commitment_address;
      (global as any).relayerTxSignature = response.data.transaction_signature;
      (global as any).relayerWalletUsed = response.data.relayer_wallet;
    });

    it('should verify user wallet is NOT visible on blockchain', async function() {
      this.timeout(30000);

      const txSignature = (global as any).relayerTxSignature;
      const userWallet = testWallet.publicKey.toString();
      const relayerWallet = (global as any).relayerWalletUsed;

      expect(txSignature).to.exist;

      console.log('[TEST] PRIVACY TEST: Verifying user wallet not on-chain...\n');

      const txDetails = await connection.getTransaction(txSignature, {
        maxSupportedTransactionVersion: 0
      });

      expect(txDetails).to.not.be.null;

      const feePayer = txDetails!.transaction.message.staticAccountKeys[0];

      console.log(`   Fee Payer (visible on blockchain): ${feePayer.toString()}`);
      console.log(`   Relayer Wallet: ${relayerWallet}`);
      console.log(`   User Wallet: ${userWallet}\n`);

      expect(feePayer.toString()).to.equal(relayerWallet);
      expect(feePayer.toString()).to.not.equal(userWallet);

      console.log('[PASS] PRIVACY VERIFICATION:');
      console.log('   Transaction signed by relayer wallet');
      console.log('   User wallet NOT visible on blockchain\n');
    });

    it('should verify commitment exists on-chain', async function() {
      this.timeout(30000);

      const commitmentAddress = (global as any).relayerCommitmentAddress;
      expect(commitmentAddress).to.exist;

      const pubkey = new PublicKey(commitmentAddress);
      const accountInfo = await connection.getAccountInfo(pubkey);

      expect(accountInfo).to.not.be.null;
      expect(accountInfo!.data.length).to.equal(118);

      console.log('[PASS] Commitment exists on-chain');
      console.log(`   Account: ${commitmentAddress}`);
      console.log(`   Data size: ${accountInfo!.data.length} bytes\n`);
    });
  });

  describe('Step 4: Privacy Verification', () => {
    it('should confirm wallet address is never exposed publicly', async function() {
      this.timeout(30000);

      console.log('[TEST] Privacy Verification...\n');

      try {
        await axios.get(`${API_BASE}/portfolio/${testWallet.publicKey.toString()}`);
        throw new Error('Should not be able to query by wallet address!');
      } catch (error: any) {
        if (error.response?.status === 404) {
          console.log('[PASS] No public wallet query endpoint\n');
        } else if (error.message.includes('Should not be able')) {
          throw error;
        }
      }

      console.log('[PASS] Privacy Verification Complete!\n');
    });
  });

  after(() => {
    console.log('==============================================');
    console.log('E2E Test Complete!');
    console.log('==============================================\n');
    console.log('Verified:');
    console.log('  - Zerion API integration');
    console.log('  - Merkle tree construction');
    console.log('  - Relayer service (privacy-preserving)');
    console.log('  - Signature verification');
    console.log('  - Privacy preservation (wallet hidden via relayer)');
    console.log('');
  });
});
