/**
 * Relayer API Routes
 * 
 * Endpoints for users to submit commitments via the relayer service.
 * Preserves user privacy by using relayer's wallet for on-chain transactions.
 */

import { Router, Request, Response } from 'express';
import { getRelayerService, RelayCommitRequest } from '../services/relayer';
import { verifyWalletOwnership, isSignatureTimestampValid } from '../lib/ownership';
import { PublicKey } from '@solana/web3.js';

const router = Router();

/**
 * POST /api/relayer/commit
 * 
 * Submit a merkle root commitment via the relayer.
 * User's wallet stays private - only relayer's wallet appears on-chain.
 * 
 * REQUIRES: Wallet signature to prove ownership of the commitment
 */
router.post('/commit', async (req: Request, res: Response) => {
  try {
    const {
      wallet_address,
      merkle_root,
      metadata,
      signature,
      message,
      timestamp
    } = req.body;

    // 1. Validate required fields
    if (!wallet_address) {
      return res.status(400).json({ error: 'wallet_address is required' });
    }

    if (!merkle_root || !Array.isArray(merkle_root) || merkle_root.length !== 32) {
      return res.status(400).json({ 
        error: 'merkle_root must be an array of 32 bytes' 
      });
    }

    if (!metadata) {
      return res.status(400).json({ error: 'metadata is required' });
    }

    if (!signature) {
      return res.status(400).json({ 
        error: 'signature is required - please sign the commitment message' 
      });
    }

    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    if (!timestamp) {
      return res.status(400).json({ error: 'timestamp is required' });
    }

    // 2. Validate Solana address format
    try {
      new PublicKey(wallet_address);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid Solana wallet address' });
    }

    // 3. Verify signature timestamp is recent
    if (!isSignatureTimestampValid(timestamp)) {
      return res.status(400).json({
        error: 'Signature expired',
        details: 'Please sign a new message. Signatures are valid for 5 minutes.'
      });
    }

    // 4. Verify wallet ownership via signature
    console.log(`🔐 Verifying signature for ${wallet_address}...`);
    
    const isOwner = await verifyWalletOwnership({
      walletAddress: wallet_address,
      signature,
      message
    });

    if (!isOwner) {
      return res.status(401).json({
        error: 'Unauthorized',
        details: 'Invalid signature. You must prove ownership of the wallet address.'
      });
    }

    console.log(`✅ Signature verified`);

    // 5. Validate metadata
    if (!metadata.chain || typeof metadata.chain !== 'string') {
      return res.status(400).json({ error: 'metadata.chain is required' });
    }

    if (!metadata.snapshot_timestamp || typeof metadata.snapshot_timestamp !== 'number') {
      return res.status(400).json({ error: 'metadata.snapshot_timestamp is required' });
    }

    if (metadata.privacy_score === undefined || typeof metadata.privacy_score !== 'number') {
      return res.status(400).json({ error: 'metadata.privacy_score is required' });
    }

    // 6. Prepare relay request
    const relayRequest: RelayCommitRequest = {
      userWallet: wallet_address,
      merkleRoot: merkle_root,
      metadata: {
        chain: metadata.chain,
        snapshotTimestamp: metadata.snapshot_timestamp,
        expiresAt: metadata.expires_at || null,
        privacyScore: metadata.privacy_score
      },
      userSignature: signature,
      message,
      timestamp
    };

    // 7. Submit via relayer
    console.log(`🔄 Submitting commitment via relayer...`);
    const relayer = getRelayerService();
    const result = await relayer.relayCommit(relayRequest);

    if (!result.success) {
      return res.status(400).json({
        error: 'Failed to relay commitment',
        details: result.error
      });
    }

    console.log(`✅ Commitment relayed successfully`);
    console.log(`   Transaction: ${result.transactionSignature}`);
    console.log(`   PDA: ${result.commitmentAddress}`);

    // 8. Return success response
    res.json({
      success: true,
      commitment_address: result.commitmentAddress,
      commitment_version: result.version,
      transaction_signature: result.transactionSignature,
      relayer_wallet: result.relayerWallet,
      message: 'Commitment submitted via relayer. Your wallet remains private on-chain.'
    });

  } catch (error: any) {
    console.error('Relayer commit error:', error);
    res.status(500).json({
      error: 'Failed to process relayer request',
      details: error.message
    });
  }
});

/**
 * GET /api/relayer/status
 * 
 * Get relayer service status and health
 * PUBLIC - no auth required
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const relayer = getRelayerService();
    const stats = relayer.getStats();
    const balance = await relayer.getBalance();
    const hasMinBalance = await relayer.hasMinimumBalance();

    res.json({
      status: hasMinBalance ? 'operational' : 'low_balance',
      relayer_wallet: stats.relayerWallet,
      balance_sol: balance.toFixed(4),
      has_minimum_balance: hasMinBalance,
      rate_limited_wallets: stats.rateLimitedWallets,
      rpc_url: stats.rpcUrl,
      program_id: stats.programId
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

/**
 * GET /api/relayer/balance
 * 
 * Get relayer wallet balance
 * PUBLIC - for transparency
 */
router.get('/balance', async (req: Request, res: Response) => {
  try {
    const relayer = getRelayerService();
    const balance = await relayer.getBalance();
    const stats = relayer.getStats();

    res.json({
      relayer_wallet: stats.relayerWallet,
      balance_sol: balance.toFixed(9),
      balance_lamports: Math.floor(balance * 1e9),
      healthy: balance > 0.1
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message
    });
  }
});

export default router;
