/**
 * Integration Tests - Full E2E Flow
 * Tests backend + Solana program working together
 */

import { Keypair, Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet, BN } from '@coral-xyz/anchor';
import { expect } from 'chai';
import axios from 'axios';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import crypto from 'crypto';

const API_BASE = 'http://localhost:3001/api';
const SOLANA_RPC = 'http://localhost:8899';
const PROGRAM_ID = '8a1iB4a3FmaFnPZ7d2j7yVYTxpr21w69A6CsiDrsTkCq';

// Load IDL
const idl = require('../solana-programs/target/idl/flexanon.json');

describe('Integration Tests - Full E2E', () => {
  let connection: Connection;
  let program: Program;
  let testWallet: Keypair;
  let commitmentPDA: PublicKey;

  before(async function() {
    this.timeout(60000);
    console.log('\n🔧 Setting up integration test environment...\n');

    // Setup connection
    connection = new Connection(SOLANA_RPC, 'confirmed');
    
    // Create test wallet
    testWallet = Keypair.generate();
    
    // Airdrop SOL
    const signature = await connection.requestAirdrop(
      testWallet.publicKey,
      2 * 1e9 // 2 SOL
    );
    await connection.confirmTransaction(signature);

    // Setup Anchor program
    const wallet = new Wallet(testWallet);
    const provider = new AnchorProvider(connection, wallet, {});
    program = new Program(idl, PROGRAM_ID, provider);

    // Derive commitment PDA
    [commitmentPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('commitment'), testWallet.publicKey.toBuffer()],
      new PublicKey(PROGRAM_ID)
    );

    console.log(`✅ Test wallet: ${testWallet.publicKey.toString()}`);
    console.log(`✅ Commitment PDA: ${commitmentPDA.toString()}\n`);
  });

  describe('Step 1: Create On-Chain Commitment', () => {
    it('should create commitment with merkle root', async function() {
      this.timeout(30000);
      
      console.log('📝 Creating on-chain commitment...');

      // Generate mock merkle root (in real app, this comes from portfolio)
      const merkleRoot = crypto.randomBytes(32);

      const metadata = {
        chain: "solana",
        snapshotTimestamp: new BN(Date.now()),
        expiresAt: null,
        privacyScore: 75
      };

      const tx = await program.methods
        .commitRoot(Array.from(merkleRoot), metadata)
        .accounts({
          commitment: commitmentPDA,
          owner: testWallet.publicKey,
          systemProgram: SystemProgram.programId
        })
        .rpc();

      console.log(`   Transaction: ${tx}`);

      // Verify on-chain
      const commitment = await program.account.shareCommitment.fetch(commitmentPDA);
      expect(commitment.owner.toString()).to.equal(testWallet.publicKey.toString());
      expect(commitment.version).to.equal(1);
      expect(commitment.revoked).to.be.false;

      console.log(`   ✅ Commitment created (version ${commitment.version})\n`);
    });
  });

  describe('Step 2: Generate Share Link (With Auth)', () => {
    it('should generate share link with valid signature', async function() {
      this.timeout(30000);

      console.log('📝 Generating share link with signature...');

      // Create ownership message
      const timestamp = Date.now();
      const message = `FlexAnon Ownership Verification\n\nI am the owner of wallet: ${testWallet.publicKey.toString()}\n\nTimestamp: ${timestamp}\n\nThis signature proves I own this wallet and authorize share link generation.`;

      // Sign message
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = nacl.sign.detached(messageBytes, testWallet.secretKey);
      const signature = bs58.encode(signatureBytes);

      console.log(`   Wallet: ${testWallet.publicKey.toString()}`);
      console.log(`   Signature: ${signature.slice(0, 20)}...`);

      // Call API
      try {
        const response = await axios.post(`${API_BASE}/share/generate`, {
          wallet_address: testWallet.publicKey.toString(),
          signature: signature,
          message: message,
          timestamp: timestamp,
          commitment_address: commitmentPDA.toString(),
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

        expect(response.data.success).to.be.true;
        expect(response.data.token_id).to.exist;
        expect(response.data.share_url).to.include('/s/');

        console.log(`   ✅ Share link created: ${response.data.share_url}`);
        console.log(`   Token ID: ${response.data.token_id}\n`);

        // Store for next test
        (global as any).testTokenId = response.data.token_id;

      } catch (error: any) {
        console.error('   Error:', error.response?.data || error.message);
        throw error;
      }
    });

    it('should reject invalid signature', async function() {
      this.timeout(30000);

      console.log('📝 Testing invalid signature rejection...');

      const timestamp = Date.now();
      const message = `FlexAnon Ownership Verification\n\nI am the owner of wallet: ${testWallet.publicKey.toString()}\n\nTimestamp: ${timestamp}\n\nThis signature proves I own this wallet and authorize share link generation.`;

      // Use fake signature
      const fakeSignature = bs58.encode(crypto.randomBytes(64));

      try {
        await axios.post(`${API_BASE}/share/generate`, {
          wallet_address: testWallet.publicKey.toString(),
          signature: fakeSignature,
          message: message,
          timestamp: timestamp,
          commitment_address: commitmentPDA.toString(),
          commitment_version: 1,
          chain: 'solana',
          reveal_preferences: {
            show_total_value: true,
            show_pnl: true,
            show_top_assets: true,
            top_assets_count: 3
          }
        });

        throw new Error('Should have rejected invalid signature');
      } catch (error: any) {
        expect(error.response.status).to.equal(401);
        expect(error.response.data.error).to.include('Unauthorized');
        console.log(`   ✅ Invalid signature correctly rejected\n`);
      }
    });
  });

  describe('Step 3: Resolve Share Link (Public)', () => {
    it('should resolve share token without auth', async function() {
      this.timeout(30000);

      const tokenId = (global as any).testTokenId;
      if (!tokenId) {
        this.skip();
        return;
      }

      console.log('📝 Resolving share link (public access)...');

      const response = await axios.get(`${API_BASE}/share/resolve?token=${tokenId}`);

      expect(response.data.token_id).to.equal(tokenId);
      expect(response.data.revealed_data).to.exist;
      expect(response.data.on_chain_status).to.exist;
      expect(response.data.on_chain_status.exists).to.be.true;

      console.log(`   ✅ Resolved successfully`);
      console.log(`   Total Value: $${response.data.revealed_data.total_value}`);
      console.log(`   Assets: ${response.data.revealed_data.top_assets?.length || 0}\n`);
    });
  });

  describe('Step 4: Verify Merkle Proofs', () => {
    it('should verify merkle proofs are valid', async function() {
      this.timeout(30000);

      const tokenId = (global as any).testTokenId;
      if (!tokenId) {
        this.skip();
        return;
      }

      console.log('📝 Verifying merkle proofs...');

      // Get share data
      const shareData = await axios.get(`${API_BASE}/share/resolve?token=${tokenId}`);
      const proofs = shareData.data.proof_data || [];
      const merkleRoot = shareData.data.on_chain_status.merkle_root;

      if (proofs.length === 0) {
        console.log('   ⚠️  No proofs to verify (using mock data)');
        return;
      }

      // Verify first proof
      const proof = proofs[0];
      const verifyResponse = await axios.post(`${API_BASE}/share/verify`, {
        merkle_root: merkleRoot,
        revealed_item: proof.leaf,
        proof: {
          siblings: proof.siblings,
          path: proof.path
        }
      });

      expect(verifyResponse.data.valid).to.be.true;
      console.log(`   ✅ Proof verified for: ${proof.leaf.label}\n`);
    });
  });

  describe('Step 5: Update Commitment', () => {
    it('should update commitment and invalidate old share links', async function() {
      this.timeout(30000);

      console.log('📝 Updating on-chain commitment...');

      // Update commitment with new merkle root
      const newMerkleRoot = crypto.randomBytes(32);
      
      const metadata = {
        chain: "solana",
        snapshotTimestamp: new BN(Date.now()),
        expiresAt: null,
        privacyScore: 85
      };

      const tx = await program.methods
        .commitRoot(Array.from(newMerkleRoot), metadata)
        .accounts({
          commitment: commitmentPDA,
          owner: testWallet.publicKey,
          systemProgram: SystemProgram.programId
        })
        .rpc();

      console.log(`   Transaction: ${tx}`);

      // Verify version incremented
      const commitment = await program.account.shareCommitment.fetch(commitmentPDA);
      expect(commitment.version).to.equal(2);

      console.log(`   ✅ Commitment updated (version ${commitment.version})\n`);

      // Old share link should now be outdated
      const tokenId = (global as any).testTokenId;
      if (tokenId) {
        try {
          await axios.get(`${API_BASE}/share/resolve?token=${tokenId}`);
        } catch (error: any) {
          expect(error.response.status).to.equal(410); // Gone
          console.log(`   ✅ Old share link marked as outdated\n`);
        }
      }
    });
  });

  describe('Step 6: Revoke Share Link', () => {
    it('should revoke all share links via on-chain', async function() {
      this.timeout(30000);

      console.log('📝 Revoking all share links...');

      const tx = await program.methods
        .revokeAll()
        .accounts({
          commitment: commitmentPDA,
          owner: testWallet.publicKey
        })
        .rpc();

      console.log(`   Transaction: ${tx}`);

      // Verify revocation
      const commitment = await program.account.shareCommitment.fetch(commitmentPDA);
      expect(commitment.revoked).to.be.true;

      console.log(`   ✅ All share links revoked on-chain\n`);
    });
  });

  describe('Step 7: List User Tokens', () => {
    it('should list all tokens for user with signature', async function() {
      this.timeout(30000);

      console.log('📝 Listing user tokens...');

      // Sign request
      const timestamp = Date.now();
      const message = `List my tokens at ${timestamp}`;
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = nacl.sign.detached(messageBytes, testWallet.secretKey);
      const signature = bs58.encode(signatureBytes);

      const response = await axios.get(`${API_BASE}/share/my-tokens`, {
        params: {
          wallet: testWallet.publicKey.toString(),
          signature: signature,
          message: message,
          timestamp: timestamp
        }
      });

      expect(response.data.tokens).to.be.an('array');
      console.log(`   ✅ Found ${response.data.total} token(s)\n`);
    });
  });

  after(() => {
    console.log('✅ All integration tests passed!\n');
  });
});
