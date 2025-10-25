import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet} from '@coral-xyz/anchor';
import * as fs from 'fs';
import * as path from 'path';
import bs58 from 'bs58';
import BN from 'bn.js';

export interface RelayCommitRequest {
  userWallet: string;
  merkleRoot: number[];
  metadata: {
    chain: string;
    snapshotTimestamp: number;
    expiresAt: number | null;
    privacyScore: number;
  };
  userSignature: string;
  message: string;
  timestamp: number;
}

export interface RelayCommitResponse {
  success: boolean;
  commitmentAddress: string;
  transactionSignature: string;
  relayerWallet: string;
  version: number;
  error?: string;
}

export class RelayerService {
  private connection: Connection;
  private relayerKeypair: Keypair;
  private program: Program;
  private programId: PublicKey;
  private rateLimitMap: Map<string, number> = new Map();
  private RATE_LIMIT_MS = 60000;

  constructor() {
    const rpcUrl = process.env.SOLANA_RPC_URL || 'http://localhost:8899';
    const programIdStr = process.env.SOLANA_PROGRAM_ID;

    if (!programIdStr) {
      throw new Error('SOLANA_PROGRAM_ID not set');
    }

    this.connection = new Connection(rpcUrl, 'confirmed');
    this.programId = new PublicKey(programIdStr);
    this.relayerKeypair = this.loadRelayerKeypair();

    const wallet = new Wallet(this.relayerKeypair);
    const provider = new AnchorProvider(this.connection, wallet, {
      commitment: 'confirmed'
    });

    // Load IDL - try environment variable first (for production), then file (for local)
    let idlJson;
    const idlEnv = process.env.FLEXANON_IDL;
    
    if (idlEnv) {
      // Production: IDL from environment variable
      console.log('[RELAYER] Loading IDL from environment variable');
      idlJson = JSON.parse(idlEnv);
    } else {
      // Local development: IDL from file in backend folder
      console.log('[RELAYER] Loading IDL from file');
      const idlPath = path.join(process.cwd(), 'flexanon-idl.json');
      console.log(`[RELAYER] IDL path: ${idlPath}`);
      idlJson = JSON.parse(fs.readFileSync(idlPath, 'utf-8'));
    }

    if (idlJson.accounts && idlJson.accounts[0] && !idlJson.accounts[0].type) {
      const shareCommitmentType = idlJson.types.find((t: any) => t.name === 'ShareCommitment');
      if (shareCommitmentType) {
        idlJson.accounts[0].type = shareCommitmentType.type;
      }
    }

    this.program = new Program(idlJson as any, provider);

    console.log('[RELAYER] Service initialized');
    console.log(`[RELAYER] Wallet: ${this.relayerKeypair.publicKey.toString()}`);
    console.log(`[RELAYER] Program: ${programIdStr}`);
  }

  private loadRelayerKeypair(): Keypair {
    // 1. Try base58 encoded private key from environment (PRODUCTION)
    const privateKeyEnv = process.env.RELAYER_PRIVATE_KEY;
    if (privateKeyEnv) {
      try {
        console.log('[RELAYER] Loading keypair from RELAYER_PRIVATE_KEY (base58)');
        const secretKey = bs58.decode(privateKeyEnv);
        if (secretKey.length !== 64) {
          throw new Error(`Invalid key length: ${secretKey.length}, expected 64 bytes`);
        }
        return Keypair.fromSecretKey(secretKey);
      } catch (error: any) {
        console.error('[RELAYER] Failed to decode base58 private key:', error.message);
        throw new Error(`Invalid RELAYER_PRIVATE_KEY: ${error.message}`);
      }
    }

    // 2. Try keypair file path (LOCAL DEVELOPMENT)
    const keypairPath = process.env.RELAYER_KEYPAIR_PATH || 
                        path.join(process.env.HOME || '', '.config/solana/id.json');
    
    try {
      console.log(`[RELAYER] Loading keypair from file: ${keypairPath}`);
      const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'));
      return Keypair.fromSecretKey(Uint8Array.from(keypairData));
    } catch (error: any) {
      console.error(`[RELAYER] Failed to load keypair from file:`, error.message);
      throw new Error(
        'Failed to load relayer keypair. Set RELAYER_PRIVATE_KEY (base58) or RELAYER_KEYPAIR_PATH'
      );
    }
  }

  private checkRateLimit(userWallet: string): boolean {
    const lastCommit = this.rateLimitMap.get(userWallet);
    if (!lastCommit) return true;
    return (Date.now() - lastCommit) >= this.RATE_LIMIT_MS;
  }

  private updateRateLimit(userWallet: string) {
    this.rateLimitMap.set(userWallet, Date.now());
  }

  private verifyUserSignature(request: RelayCommitRequest): boolean {
    try {
      const { userWallet, message, timestamp } = request;

      const age = Date.now() - timestamp;
      if (age > 5 * 60 * 1000) {
        console.log('[RELAYER] Signature expired');
        return false;
      }

      if (!message.includes(userWallet)) {
        console.log('[RELAYER] Message missing wallet address');
        return false;
      }

      const merkleRootHex = Buffer.from(request.merkleRoot).toString('hex');
      if (!message.includes(merkleRootHex.substring(0, 16))) {
        console.log('[RELAYER] Message missing merkle root');
        return false;
      }

      return true;
    } catch (error) {
      console.error('[RELAYER] Signature verification error:', error);
      return false;
    }
  }

  async getBalance(): Promise<number> {
    const balance = await this.connection.getBalance(this.relayerKeypair.publicKey);
    return balance / 1e9;
  }

  async hasMinimumBalance(minSol: number = 0.1): Promise<boolean> {
    const balance = await this.getBalance();
    return balance >= minSol;
  }

  async relayCommit(request: RelayCommitRequest): Promise<RelayCommitResponse> {
    try {
      const { userWallet, merkleRoot, metadata } = request;

      if (!this.verifyUserSignature(request)) {
        return {
          success: false,
          commitmentAddress: '',
          transactionSignature: '',
          relayerWallet: this.relayerKeypair.publicKey.toString(),
          version: 0,
          error: 'Invalid signature or expired timestamp'
        };
      }

      if (!this.checkRateLimit(userWallet)) {
        return {
          success: false,
          commitmentAddress: '',
          transactionSignature: '',
          relayerWallet: this.relayerKeypair.publicKey.toString(),
          version: 0,
          error: 'Rate limit exceeded'
        };
      }

      const hasFunds = await this.hasMinimumBalance();
      if (!hasFunds) {
        console.error('[RELAYER] Insufficient balance');
        return {
          success: false,
          commitmentAddress: '',
          transactionSignature: '',
          relayerWallet: this.relayerKeypair.publicKey.toString(),
          version: 0,
          error: 'Relayer service temporarily unavailable'
        };
      }

      const userPubkey = new PublicKey(userWallet);
      const [commitmentPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('commitment'), userPubkey.toBuffer()],
        this.programId
      );

      console.log(`[RELAYER] Relaying for ${userWallet}`);
      console.log(`[RELAYER] PDA: ${commitmentPDA.toString()}`);

      const anchorMetadata = {
        chain: metadata.chain,
        snapshotTimestamp: new BN(metadata.snapshotTimestamp),
        expiresAt: metadata.expiresAt ? new BN(metadata.expiresAt) : null,
        privacyScore: metadata.privacyScore
      };

      const tx = await this.program.methods
        .commitRoot(userPubkey, merkleRoot, anchorMetadata)
        .accounts({
          commitment: commitmentPDA,
          relayer: this.relayerKeypair.publicKey,
          systemProgram: SystemProgram.programId
        } as any)
        .signers([this.relayerKeypair])
        .rpc();

      console.log(`[RELAYER] Transaction: ${tx}`);

      this.updateRateLimit(userWallet);

      const accountData = await this.connection.getAccountInfo(commitmentPDA);
      let version = 1;
      if (accountData) {
        version = accountData.data.readUInt32LE(72);
      }

      return {
        success: true,
        commitmentAddress: commitmentPDA.toString(),
        transactionSignature: tx,
        relayerWallet: this.relayerKeypair.publicKey.toString(),
        version
      };

    } catch (error: any) {
      console.error('[RELAYER] Error:', error);
      return {
        success: false,
        commitmentAddress: '',
        transactionSignature: '',
        relayerWallet: this.relayerKeypair.publicKey.toString(),
        version: 0,
        error: error.message || 'Failed to relay commitment'
      };
    }
  }

  getStats() {
    return {
      relayerWallet: this.relayerKeypair.publicKey.toString(),
      rateLimitedWallets: this.rateLimitMap.size,
      rpcUrl: this.connection.rpcEndpoint,
      programId: this.programId.toString()
    };
  }
}

let relayerService: RelayerService | null = null;

export function getRelayerService(): RelayerService {
  if (!relayerService) {
    relayerService = new RelayerService();
  }
  return relayerService;
}

export default RelayerService;
