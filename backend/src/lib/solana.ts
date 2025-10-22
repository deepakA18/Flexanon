import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, web3, BN } from '@coral-xyz/anchor';

/**
 * Solana client for interacting with on-chain commitments
 */

export class SolanaClient {
  connection: Connection;
  programId: PublicKey;

  constructor() {
    const rpcUrl = process.env.SOLANA_RPC_URL || 'http://localhost:8899';
    const programIdStr = process.env.SOLANA_PROGRAM_ID;

    if (!programIdStr) {
      throw new Error('SOLANA_PROGRAM_ID not set in environment variables');
    }

    this.connection = new Connection(rpcUrl, 'confirmed');
    this.programId = new PublicKey(programIdStr);

    console.log(`🔗 Solana client initialized`);
    console.log(`   RPC: ${rpcUrl}`);
    console.log(`   Program ID: ${programIdStr}`);
  }

  /**
   * Derive PDA for a user's commitment account
   */
  async getCommitmentAddress(owner: PublicKey): Promise<[PublicKey, number]> {
    return await PublicKey.findProgramAddress(
      [
        Buffer.from('commitment'),
        owner.toBuffer(),
      ],
      this.programId
    );
  }

  /**
   * Fetch commitment from on-chain
   */
  async getCommitment(commitmentAddress: PublicKey): Promise<ShareCommitment | null> {
    try {
      const accountInfo = await this.connection.getAccountInfo(commitmentAddress);
      
      if (!accountInfo) {
        return null;
      }

      // Parse the account data according to ShareCommitment struct layout
      const data = accountInfo.data;

      // Skip 8-byte discriminator
      let offset = 8;

      // Parse owner (32 bytes)
      const owner = new PublicKey(data.slice(offset, offset + 32));
      offset += 32;

      // Parse merkle_root (32 bytes)
      const merkleRoot = Array.from(data.slice(offset, offset + 32));
      offset += 32;

      // Parse version (4 bytes, u32)
      const version = data.readUInt32LE(offset);
      offset += 4;

      // Parse metadata (CommitMetadata struct)
      // - chain: String (4 bytes length prefix + string data)
      const chainLen = data.readUInt32LE(offset);
      offset += 4;
      const chain = data.slice(offset, offset + chainLen).toString('utf-8');
      offset += chainLen;
      
      // - snapshot_timestamp: i64 (8 bytes)
      const snapshotTimestamp = Number(data.readBigInt64LE(offset));
      offset += 8;
      
      // - expires_at: Option<i64> (1 byte discriminator + optional 8 bytes)
      const hasExpiresAt = data[offset] === 1;
      offset += 1;
      let expiresAt = null;
      if (hasExpiresAt) {
        expiresAt = Number(data.readBigInt64LE(offset));
        offset += 8;
      }
      
      // - privacy_score: u8 (1 byte)
      const privacyScore = data[offset];
      offset += 1;

      // Parse timestamp (8 bytes, i64)
      const timestamp = Number(data.readBigInt64LE(offset));
      offset += 8;

      // Parse revoked (1 byte, bool)
      const revoked = data[offset] === 1;
      offset += 1;

      // Parse bump (1 byte, u8) - not used but present
      const bump = data[offset];

      return {
        owner: owner.toString(),
        merkleRoot,
        version,
        timestamp,
        revoked,
        address: commitmentAddress.toString(),
      };
    } catch (error) {
      console.error('Error fetching commitment:', error);
      return null;
    }
  }

  /**
   * Check if a commitment exists for a wallet
   */
  async hasCommitment(owner: PublicKey): Promise<boolean> {
    const [commitmentPda] = await this.getCommitmentAddress(owner);
    const accountInfo = await this.connection.getAccountInfo(commitmentPda);
    return accountInfo !== null;
  }

  /**
   * Verify commitment is valid
   */
  async verifyCommitment(
    commitmentAddress: PublicKey,
    expectedOwner?: PublicKey,
    expectedRoot?: Uint8Array
  ): Promise<{ valid: boolean; commitment?: ShareCommitment; reason?: string }> {
    const commitment = await this.getCommitment(commitmentAddress);

    if (!commitment) {
      return {
        valid: false,
        reason: 'Commitment not found on-chain',
      };
    }

    // Check if revoked
    if (commitment.revoked) {
      return {
        valid: false,
        commitment,
        reason: 'Commitment has been revoked on-chain',
      };
    }

    // Verify owner if provided
    if (expectedOwner) {
      if (commitment.owner !== expectedOwner.toString()) {
        return {
          valid: false,
          commitment,
          reason: 'Owner mismatch',
        };
      }
    }

    // Verify merkle root if provided
    if (expectedRoot) {
      const rootMatches = Buffer.from(commitment.merkleRoot).equals(Buffer.from(expectedRoot));
      if (!rootMatches) {
        return {
          valid: false,
          commitment,
          reason: 'Merkle root mismatch',
        };
      }
    }

    return {
      valid: true,
      commitment,
    };
  }

  /**
   * Get network info
   */
  async getNetworkInfo() {
    try {
      const version = await this.connection.getVersion();
      const slot = await this.connection.getSlot();
      
      return {
        version,
        slot,
        network: process.env.SOLANA_NETWORK || 'unknown',
      };
    } catch (error) {
      console.error('Error getting network info:', error);
      return null;
    }
  }
}

/**
 * Types
 */
export interface ShareCommitment {
  owner: string;            // Base58 pubkey
  merkleRoot: number[];     // 32-byte array
  version: number;
  timestamp: number;
  revoked: boolean;
  address: string;          // PDA address
}

/**
 * Singleton instance
 */
let solanaClient: SolanaClient | null = null;

export function getSolanaClient(): SolanaClient {
  if (!solanaClient) {
    solanaClient = new SolanaClient();
  }
  return solanaClient;
}

export default SolanaClient;
