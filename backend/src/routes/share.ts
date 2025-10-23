import { Router, Request, Response } from 'express';
import { getZerionClientOrMock } from '../lib/mock-zerion';
import { getSolanaClient } from '../lib/solana';
import { verifyWalletOwnership, isSignatureTimestampValid } from '../lib/ownership';
import SparseMerkleTree from '../lib/merkle';
import { PublicKey } from '@solana/web3.js';
import { 
  buildPortfolioLeaves, 
  selectLeavesToReveal,
  calculatePrivacyScore 
} from '../services/portfolio';
import {
  createShareToken,
  resolveShareToken,
  revokeShareToken,
  getWalletShareTokens,
  trackShareView
} from '../services/share';
import { GenerateShareRequest, RevealPreferences } from '../types';

const router = Router();

/**
 * POST /api/share/generate
 * Generate a new share link
 * REQUIRES: Wallet signature to prove ownership
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const {
      wallet_address,
      signature,
      message,
      timestamp,
      commitment_address,
      commitment_version,
      chain = 'solana',
      reveal_preferences,
    } = req.body;

    // Validate required fields
    if (!wallet_address) {
      return res.status(400).json({ error: 'wallet_address is required' });
    }

    if (!signature) {
      return res.status(400).json({ 
        error: 'signature is required - please sign the ownership message with your wallet' 
      });
    }

    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    if (!timestamp) {
      return res.status(400).json({ error: 'timestamp is required' });
    }

    if (!commitment_address) {
      return res.status(400).json({ error: 'commitment_address is required' });
    }

    if (commitment_version === undefined) {
      return res.status(400).json({ error: 'commitment_version is required' });
    }

    if (!reveal_preferences) {
      return res.status(400).json({ error: 'reveal_preferences is required' });
    }

    console.log(`📊 Generating share link for ${wallet_address}...`);

    // 1. CRITICAL: Verify wallet ownership via signature
    console.log(`🔐 Verifying wallet ownership...`);
    
    // Check timestamp is recent (within 5 minutes)
    if (!isSignatureTimestampValid(timestamp)) {
      return res.status(400).json({
        error: 'Signature expired',
        details: 'Please sign a new message. Signatures are valid for 5 minutes.'
      });
    }

    // Verify signature
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

    console.log(`✅ Wallet ownership verified`);

    // 2. Verify wallet address is in the message
    if (!message.includes(wallet_address)) {
      return res.status(400).json({
        error: 'Invalid message',
        details: 'Message must contain the wallet address'
      });
    }

    // Default reveal preferences
    const prefs: RevealPreferences = {
      show_total_value: reveal_preferences.show_total_value ?? true,
      show_pnl: reveal_preferences.show_pnl ?? true,
      show_top_assets: reveal_preferences.show_top_assets ?? true,
      top_assets_count: reveal_preferences.top_assets_count ?? 3,
      show_all_assets: reveal_preferences.show_all_assets ?? false,
      show_wallet_address: reveal_preferences.show_wallet_address ?? false,
      show_snapshot_time: reveal_preferences.show_snapshot_time ?? true
    };

    // 3. Verify commitment exists on-chain AND owner matches
    console.log(`🔍 Verifying on-chain commitment...`);
    const solanaClient = getSolanaClient();
    const commitmentPubkey = new PublicKey(commitment_address);
    const ownerPubkey = new PublicKey(wallet_address);

    const verification = await solanaClient.verifyCommitment(
      commitmentPubkey,
      ownerPubkey // This ensures the on-chain commitment owner matches
    );

    if (!verification.valid) {
      return res.status(400).json({
        error: 'Invalid on-chain commitment',
        details: verification.reason
      });
    }

    const onChainCommitment = verification.commitment!;

    // Double-check owner matches (critical security check)
    if (onChainCommitment.owner !== wallet_address) {
      return res.status(401).json({
        error: 'Unauthorized',
        details: 'You do not own this commitment on-chain'
      });
    }

    // Check version matches
    if (onChainCommitment.version !== commitment_version) {
      return res.status(400).json({
        error: 'Version mismatch',
        details: `Expected version ${commitment_version}, but on-chain version is ${onChainCommitment.version}`
      });
    }

    console.log(`✅ On-chain commitment verified (version ${onChainCommitment.version})`);

    // 4. Fetch portfolio from Zerion
    console.log(`📊 Fetching portfolio from Zerion...`);
    const zerionClient = await getZerionClientOrMock();
    const portfolio = await zerionClient.getPortfolio(wallet_address, chain);

    if (!portfolio || portfolio.assets.length === 0) {
      return res.status(400).json({ 
        error: 'No portfolio found',
        details: 'This wallet has no assets on mainnet. FlexAnon requires mainnet assets to generate a share link.',
        user_friendly_message: 'Oops! Looks like your wallet doesn\'t have any mainnet balance!'
      });
    }

    console.log(`✅ Portfolio fetched: ${portfolio.assets.length} assets, $${portfolio.total_value}`);

    // 5. Build Merkle leaves from portfolio
    const allLeaves = buildPortfolioLeaves(portfolio, wallet_address);
    console.log(`🌳 Built ${allLeaves.length} Merkle leaves`);

    // 6. Select leaves to reveal
    const { revealed, hidden } = selectLeavesToReveal(allLeaves, prefs);
    console.log(`👁️  Revealing ${revealed.length} leaves, hiding ${hidden.length}`);

    // 7. Create Sparse Merkle Tree
    const smtLeaves = allLeaves.map(leaf => ({
      key: leaf.key,
      value: leaf.value
    }));
    const smt = new SparseMerkleTree(smtLeaves);
    const merkleRoot = smt.getRoot();
    console.log(`🔐 Merkle root: ${merkleRoot.slice(0, 16)}...`);

    // 8. Verify root matches on-chain commitment
    const onChainRoot = Buffer.from(onChainCommitment.merkleRoot).toString('hex');
    if (merkleRoot !== onChainRoot) {
      return res.status(400).json({
        error: 'Merkle root mismatch',
        details: 'The calculated merkle root does not match the on-chain commitment'
      });
    }

    console.log(`✅ Merkle root matches on-chain commitment`);

    // 9. Generate proofs for revealed leaves
    const proofData = revealed.map(leaf => ({
      leaf,
      ...smt.getProof(leaf.key)
    }));

    // 10. Create share token in database
    const shareToken = await createShareToken({
      walletAddress: wallet_address,
      commitmentAddress: commitment_address,
      commitmentVersion: commitment_version,
      revealedLeaves: revealed,
      proofData,
      metadata: {
        chain,
        total_leaves_count: allLeaves.length,
        hidden_count: hidden.length,
        privacy_score: calculatePrivacyScore(revealed.length, allLeaves.length)
      }
    });

    console.log(`✅ Share token created: ${shareToken.token_id}`);

    // Build share URL
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/s/${shareToken.token_id}`;

    res.json({
      success: true,
      share_url: shareUrl,
      token_id: shareToken.token_id,
      commitment_address: commitment_address,
      commitment_version: commitment_version,
      revealed_count: revealed.length,
      hidden_count: hidden.length,
      privacy_score: calculatePrivacyScore(revealed.length, allLeaves.length),
    });

  } catch (error: any) {
    console.error('Error generating share link:', error);
    res.status(500).json({ 
      error: 'Failed to generate share link',
      details: error.message 
    });
  }
});

/**
 * GET /api/share/resolve?token=xxx
 * Resolve a share token to public data (no auth required)
 * This is PUBLIC - anyone can view
 */
router.get('/resolve', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'token parameter is required' });
    }

    console.log(`🔍 Resolving token: ${token}`);

    // Track view (optional analytics)
    const viewerIp = req.ip;
    const userAgent = req.headers['user-agent'];
    await trackShareView(token, viewerIp, userAgent);

    // Resolve token to public data (includes on-chain verification)
    const publicData = await resolveShareToken(token);

    if (!publicData) {
      return res.status(404).json({ error: 'Share link not found' });
    }

    res.json(publicData);

  } catch (error: any) {
    console.error('Error resolving share token:', error);
    
    if (error.message.includes('revoked')) {
      return res.status(403).json({ error: error.message });
    }

    if (error.message.includes('outdated') || error.message.includes('updated')) {
      return res.status(410).json({ error: error.message });
    }

    res.status(500).json({ 
      error: 'Failed to resolve share link',
      details: error.message 
    });
  }
});

/**
 * POST /api/share/verify
 * Verify Merkle proofs for revealed data
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { merkle_root, revealed_item, proof } = req.body;

    if (!merkle_root || !revealed_item || !proof) {
      return res.status(400).json({ 
        error: 'merkle_root, revealed_item, and proof are required' 
      });
    }

    // Verify the proof
    const isValid = SparseMerkleTree.verify(
      merkle_root,
      {
        key: revealed_item.key,
        value: revealed_item.value
      },
      {
        siblings: proof.siblings,
        path: proof.path
      }
    );

    res.json({
      valid: isValid,
      merkle_root,
      item_label: revealed_item.label,
      message: isValid 
        ? 'Item verified against committed Merkle root' 
        : 'Verification failed - item does not match Merkle root'
    });

  } catch (error: any) {
    console.error('Error verifying proof:', error);
    res.status(500).json({ 
      error: 'Failed to verify proof',
      details: error.message 
    });
  }
});

/**
 * POST /api/share/revoke
 * Revoke a share token (off-chain only)
 * REQUIRES: Wallet signature to prove ownership
 */
router.post('/revoke', async (req: Request, res: Response) => {
  try {
    const { token_id, wallet_address, signature, message, timestamp } = req.body;

    if (!token_id) {
      return res.status(400).json({ error: 'token_id is required' });
    }

    if (!wallet_address) {
      return res.status(400).json({ error: 'wallet_address is required' });
    }

    if (!signature) {
      return res.status(400).json({ 
        error: 'signature is required - please sign the revocation message with your wallet' 
      });
    }

    // Verify wallet ownership
    if (!isSignatureTimestampValid(timestamp)) {
      return res.status(400).json({ error: 'Signature expired' });
    }

    const isOwner = await verifyWalletOwnership({
      walletAddress: wallet_address,
      signature,
      message
    });

    if (!isOwner) {
      return res.status(401).json({ error: 'Unauthorized - invalid signature' });
    }

    const success = await revokeShareToken(token_id, wallet_address);

    if (!success) {
      return res.status(404).json({ 
        error: 'Share token not found or you do not own it' 
      });
    }

    res.json({ 
      success: true,
      message: 'Share token revoked successfully (off-chain)' 
    });

  } catch (error: any) {
    console.error('Error revoking share token:', error);
    res.status(500).json({ 
      error: 'Failed to revoke share token',
      details: error.message 
    });
  }
});

/**
 * GET /api/share/my-tokens?wallet=xxx&signature=xxx&message=xxx&timestamp=xxx
 * Get all share tokens for a wallet
 * REQUIRES: Wallet signature to prove ownership
 */
router.get('/my-tokens', async (req: Request, res: Response) => {
  try {
    const { wallet, signature, message, timestamp } = req.query;

    if (!wallet || typeof wallet !== 'string') {
      return res.status(400).json({ error: 'wallet parameter is required' });
    }

    if (!signature || typeof signature !== 'string') {
      return res.status(400).json({ 
        error: 'signature is required - please sign the message with your wallet' 
      });
    }

    // Verify wallet ownership
    if (!isSignatureTimestampValid(Number(timestamp))) {
      return res.status(400).json({ error: 'Signature expired' });
    }

    const isOwner = await verifyWalletOwnership({
      walletAddress: wallet,
      signature,
      message: message as string
    });

    if (!isOwner) {
      return res.status(401).json({ error: 'Unauthorized - invalid signature' });
    }

    const tokens = await getWalletShareTokens(wallet);

    // Format response
    const formattedTokens = tokens.map(token => ({
      token_id: token.token_id,
      commitment_address: token.commitment_address,
      commitment_version: token.commitment_version,
      created_at: token.created_at,
      revoked: token.revoked,
      revealed_count: token.revealed_leaves.length,
      privacy_score: token.metadata?.privacy_score,
      share_url: `${process.env.BASE_URL || 'http://localhost:3000'}/s/${token.token_id}`
    }));

    res.json({
      tokens: formattedTokens,
      total: formattedTokens.length
    });

  } catch (error: any) {
    console.error('Error fetching user tokens:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tokens',
      details: error.message 
    });
  }
});

/**
 * REMOVED: GET /api/share/commitment/:address
 * 
 * This endpoint was REMOVED for privacy reasons:
 * - It exposed wallet addresses publicly
 * - Anyone could query any commitment by guessing addresses
 * - Defeats the purpose of privacy-first design
 * 
 * Commitment data is now ONLY accessible through:
 * 1. Share tokens (controlled by owner)
 * 2. On-chain queries (but only if you know the commitment PDA)
 */

export default router;
