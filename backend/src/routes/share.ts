import { Router, Request, Response } from 'express';
import { getZerionClientOrMock } from '../lib/mock-zerion';
import { getSolanaClient } from '../lib/solana';
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
 * No authentication required - verification happens on-chain
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const {
      wallet_address,
      commitment_address,
      commitment_version,
      chain = 'solana',
      reveal_preferences,
    }: GenerateShareRequest = req.body;

    // Validate inputs
    if (!wallet_address) {
      return res.status(400).json({ error: 'wallet_address is required' });
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

    // 1. Verify commitment exists on-chain
    console.log(`🔍 Verifying on-chain commitment...`);
    const solanaClient = getSolanaClient();
    const commitmentPubkey = new PublicKey(commitment_address);
    const ownerPubkey = new PublicKey(wallet_address);

    const verification = await solanaClient.verifyCommitment(
      commitmentPubkey,
      ownerPubkey
    );

    if (!verification.valid) {
      return res.status(400).json({
        error: 'Invalid on-chain commitment',
        details: verification.reason
      });
    }

    const onChainCommitment = verification.commitment!;

    // Check version matches
    if (onChainCommitment.version !== commitment_version) {
      return res.status(400).json({
        error: 'Version mismatch',
        details: `Expected version ${commitment_version}, but on-chain version is ${onChainCommitment.version}`
      });
    }

    console.log(`✅ On-chain commitment verified (version ${onChainCommitment.version})`);

    // 2. Fetch portfolio from Zerion
    console.log(`📊 Fetching portfolio from Zerion...`);
    const zerionClient = getZerionClientOrMock();
    const portfolio = await zerionClient.getPortfolio(wallet_address, chain);

    if (!portfolio || portfolio.assets.length === 0) {
      return res.status(400).json({ 
        error: 'No portfolio data found for this wallet' 
      });
    }

    console.log(`✅ Portfolio fetched: ${portfolio.assets.length} assets, $${portfolio.total_value}`);

    // 3. Build Merkle leaves from portfolio
    const allLeaves = buildPortfolioLeaves(portfolio, wallet_address);
    console.log(`🌳 Built ${allLeaves.length} Merkle leaves`);

    // 4. Select leaves to reveal
    const { revealed, hidden } = selectLeavesToReveal(allLeaves, prefs);
    console.log(`👁️  Revealing ${revealed.length} leaves, hiding ${hidden.length}`);

    // 5. Create Sparse Merkle Tree
    const smtLeaves = allLeaves.map(leaf => ({
      key: leaf.key,
      value: leaf.value
    }));
    const smt = new SparseMerkleTree(smtLeaves);
    const merkleRoot = smt.getRoot();
    console.log(`🔐 Merkle root: ${merkleRoot.slice(0, 16)}...`);

    // 6. Verify root matches on-chain commitment
    const onChainRoot = Buffer.from(onChainCommitment.merkleRoot).toString('hex');
    if (merkleRoot !== onChainRoot) {
      return res.status(400).json({
        error: 'Merkle root mismatch',
        details: 'The calculated merkle root does not match the on-chain commitment'
      });
    }

    console.log(`✅ Merkle root matches on-chain commitment`);

    // 7. Generate proofs for revealed leaves
    const proofData = revealed.map(leaf => ({
      leaf,
      ...smt.getProof(leaf.key)
    }));

    // 8. Create share token in database
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
 * Requires wallet signature verification
 */
router.post('/revoke', async (req: Request, res: Response) => {
  try {
    const { token_id, wallet_address } = req.body;

    if (!token_id) {
      return res.status(400).json({ error: 'token_id is required' });
    }

    if (!wallet_address) {
      return res.status(400).json({ error: 'wallet_address is required' });
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
 * GET /api/share/my-tokens?wallet=xxx
 * Get all share tokens for a wallet
 */
router.get('/my-tokens', async (req: Request, res: Response) => {
  try {
    const { wallet } = req.query;

    if (!wallet || typeof wallet !== 'string') {
      return res.status(400).json({ error: 'wallet parameter is required' });
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
 * GET /api/share/commitment/:address
 * Get on-chain commitment details
 */
router.get('/commitment/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({ error: 'address parameter is required' });
    }

    const solanaClient = getSolanaClient();
    const commitmentPubkey = new PublicKey(address);
    
    const commitment = await solanaClient.getCommitment(commitmentPubkey);

    if (!commitment) {
      return res.status(404).json({ error: 'Commitment not found on-chain' });
    }

    res.json({
      address: commitment.address,
      owner: commitment.owner,
      merkle_root: Buffer.from(commitment.merkleRoot).toString('hex'),
      version: commitment.version,
      timestamp: commitment.timestamp,
      revoked: commitment.revoked,
      committed_at: new Date(commitment.timestamp * 1000).toISOString()
    });

  } catch (error: any) {
    console.error('Error fetching commitment:', error);
    res.status(500).json({ 
      error: 'Failed to fetch commitment',
      details: error.message 
    });
  }
});

export default router;
