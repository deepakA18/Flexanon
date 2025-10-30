import { query } from '../config/database.js';
import { ShareToken, MerkleLeaf, MerkleProof, PublicShareData } from '../types/index.js';
import { generateShortToken } from '../lib/crypto.js';
import { formatPublicPortfolioData } from './portfolio.js';
import { getSolanaClient } from '../lib/solana.js';
import { PublicKey } from '@solana/web3.js';

/**
 * Share token service - handles storage and retrieval of share links
 * Now integrated with on-chain Solana commitments and chart data
 */

export interface CreateShareTokenParams {
  walletAddress: string;
  commitmentAddress: string;
  commitmentVersion: number;
  revealedLeaves: MerkleLeaf[];
  proofData: MerkleProof[];
  chartData?: any; // NEW: Chart data parameter
  metadata?: any;
}

/**
 * Create a new share token
 */
export async function createShareToken(params: CreateShareTokenParams): Promise<ShareToken> {
  const {
    walletAddress,
    commitmentAddress,
    commitmentVersion,
    revealedLeaves,
    proofData,
    chartData, // NEW: Extract chart data
    metadata = {}
  } = params;

  // Verify commitment exists on-chain
  const solanaClient = getSolanaClient();
  const commitmentPubkey = new PublicKey(commitmentAddress);
  const verification = await solanaClient.verifyCommitment(
    commitmentPubkey,
    new PublicKey(walletAddress)
  );

  if (!verification.valid) {
    throw new Error(`Invalid commitment: ${verification.reason}`);
  }

  // Generate unique token ID
  let tokenId: string;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    tokenId = generateShortToken(8);
    const existing = await query(
      'SELECT token_id FROM share_tokens WHERE token_id = $1',
      [tokenId]
    );
    
    if (existing.rows.length === 0) break;
    
    attempts++;
    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique token ID');
    }
  } while (attempts < maxAttempts);

  // Insert into database (NOW WITH CHART DATA)
  const result = await query(
    `INSERT INTO share_tokens 
      (token_id, owner_address, commitment_address, commitment_version, revealed_leaves, proof_data, chart_data, metadata, revoked)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      tokenId,
      walletAddress,
      commitmentAddress,
      commitmentVersion,
      JSON.stringify(revealedLeaves),
      JSON.stringify(proofData),
      chartData ? JSON.stringify(chartData) : null, // NEW: Store chart data
      JSON.stringify(metadata),
      false
    ]
  );

  const row = result.rows[0];
  return {
    ...row,
    revealed_leaves: typeof row.revealed_leaves === 'string' 
      ? JSON.parse(row.revealed_leaves) 
      : row.revealed_leaves,
    proof_data: typeof row.proof_data === 'string'
      ? JSON.parse(row.proof_data)
      : row.proof_data,
    chart_data: row.chart_data && typeof row.chart_data === 'string' // NEW: Parse chart data
      ? JSON.parse(row.chart_data)
      : row.chart_data,
    metadata: typeof row.metadata === 'string'
      ? JSON.parse(row.metadata)
      : row.metadata
  };
}

/**
 * Get share token by ID
 */
export async function getShareToken(tokenId: string): Promise<ShareToken | null> {
  const result = await query(
    'SELECT * FROM share_tokens WHERE token_id = $1',
    [tokenId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  
  return {
    ...row,
    revealed_leaves: typeof row.revealed_leaves === 'string' 
      ? JSON.parse(row.revealed_leaves) 
      : row.revealed_leaves,
    proof_data: typeof row.proof_data === 'string'
      ? JSON.parse(row.proof_data)
      : row.proof_data,
    chart_data: row.chart_data && typeof row.chart_data === 'string' // NEW: Parse chart data
      ? JSON.parse(row.chart_data)
      : row.chart_data,
    metadata: typeof row.metadata === 'string'
      ? JSON.parse(row.metadata)
      : row.metadata
  };
}

/**
 * Resolve a share token to public data with on-chain verification
 */
export async function resolveShareToken(tokenId: string): Promise<PublicShareData | null> {
  const token = await getShareToken(tokenId);

  if (!token) {
    return null;
  }

  // Check off-chain revocation
  if (token.revoked) {
    throw new Error('This share link has been revoked');
  }

  // Verify on-chain commitment
  const solanaClient = getSolanaClient();
  const commitmentPubkey = new PublicKey(token.commitment_address);
  
  const verification = await solanaClient.verifyCommitment(commitmentPubkey);
  
  if (!verification.valid) {
    throw new Error(`On-chain verification failed: ${verification.reason}`);
  }

  const commitment = verification.commitment!;

  // Check if commitment was updated (version mismatch)
  if (commitment.version > token.commitment_version) {
    throw new Error('Portfolio has been updated. This share link is outdated.');
  }

  // Format revealed data for public display
  const revealedData = formatPublicPortfolioData(token.revealed_leaves);

  // Count total assets in tree
  const totalAssetsCount = token.metadata?.total_leaves_count || 
    (token.revealed_leaves.length + (token.metadata?.hidden_count || 0));

  // Determine if wallet address is revealed
  const walletRevealed = token.revealed_leaves.some(
    leaf => leaf.label === 'wallet_address'
  );

  return {
    token_id: token.token_id,
    committed_at: new Date(commitment.timestamp * 1000).toISOString(),
    revealed_data: {
      ...revealedData,
      chart_data: token.chart_data || null // NEW: Include chart data in response
    },
    proof_data: token.proof_data,
    verification_status: 'valid',
    on_chain_status: {
      verified: true,
      revoked: commitment.revoked,
      version: commitment.version,
    },
    privacy: {
      wallet_address: walletRevealed ? 'revealed' : 'hidden',
      total_assets_count: totalAssetsCount,
      revealed_count: token.revealed_leaves.length
    }
  };
}

/**
 * Revoke a share token (off-chain only)
 */
export async function revokeShareToken(tokenId: string, walletAddress: string): Promise<boolean> {
  const result = await query(
    `UPDATE share_tokens 
     SET revoked = TRUE 
     WHERE token_id = $1 AND owner_address = $2
     RETURNING token_id`,
    [tokenId, walletAddress]
  );

  return result.rows.length > 0;
}

/**
 * Get all share tokens for a wallet
 */
export async function getWalletShareTokens(walletAddress: string): Promise<ShareToken[]> {
  const result = await query(
    `SELECT * FROM share_tokens 
     WHERE owner_address = $1 
     ORDER BY created_at DESC`,
    [walletAddress]
  );

  return result.rows.map(row => ({
    ...row,
    revealed_leaves: typeof row.revealed_leaves === 'string'
      ? JSON.parse(row.revealed_leaves)
      : row.revealed_leaves,
    proof_data: typeof row.proof_data === 'string'
      ? JSON.parse(row.proof_data)
      : row.proof_data,
    chart_data: row.chart_data && typeof row.chart_data === 'string' // NEW: Parse chart data
      ? JSON.parse(row.chart_data)
      : row.chart_data,
    metadata: typeof row.metadata === 'string'
      ? JSON.parse(row.metadata)
      : row.metadata
  }));
}

/**
 * Track share view (analytics)
 */
export async function trackShareView(
  tokenId: string,
  viewerIp?: string,
  userAgent?: string
): Promise<void> {
  try {
    await query(
      `INSERT INTO share_views (token_id, viewer_ip, user_agent)
       VALUES ($1, $2, $3)`,
      [tokenId, viewerIp || null, userAgent || null]
    );
  } catch (error) {
    console.error('Failed to track share view:', error);
  }
}

/**
 * Get view count for a token
 */
export async function getShareViewCount(tokenId: string): Promise<number> {
  const result = await query(
    'SELECT COUNT(*) as count FROM share_views WHERE token_id = $1',
    [tokenId]
  );

  return parseInt(result.rows[0]?.count || '0');
}

export default {
  createShareToken,
  getShareToken,
  resolveShareToken,
  revokeShareToken,
  getWalletShareTokens,
  trackShareView,
  getShareViewCount
};