import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

/**
 * Signature verification for Solana wallet ownership proof
 */

export interface VerifyOwnershipParams {
  walletAddress: string;
  signature: string;
  message: string;
}

/**
 * Create a standard message for signing
 */
export function createOwnershipMessage(walletAddress: string, timestamp: number): string {
  return `FlexAnon Ownership Verification\n\nI am the owner of wallet: ${walletAddress}\n\nTimestamp: ${timestamp}\n\nThis signature proves I own this wallet and authorize share link generation.`;
}

/**
 * Verify Solana wallet ownership via signature
 */
export async function verifyWalletOwnership(params: VerifyOwnershipParams): Promise<boolean> {
  const { walletAddress, signature, message } = params;

  try {
    // Decode signature and public key from base58
    const signatureBytes = bs58.decode(signature);
    const publicKey = new PublicKey(walletAddress);
    const messageBytes = new TextEncoder().encode(message);

    // Verify using ed25519
    const verified = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKey.toBytes()
    );

    return verified;
  } catch (error) {
    console.error('Solana ownership verification failed:', error);
    return false;
  }
}

/**
 * Check if signature timestamp is valid (within 5 minutes)
 */
export function isSignatureTimestampValid(timestamp: number): boolean {
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  const diff = Math.abs(now - timestamp);
  return diff < fiveMinutes;
}

export default {
  verifyWalletOwnership,
  createOwnershipMessage,
  isSignatureTimestampValid
};
