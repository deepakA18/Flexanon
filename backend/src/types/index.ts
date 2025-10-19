// Core types for FlexAnon

export interface WalletAuth {
  address: string;
  chain: 'solana' | 'ethereum' | 'polygon' | 'base';
  signature: string;
  message: string;
  timestamp: number;
}

export interface ZerionAsset {
  asset_code: string;
  symbol: string;
  name: string;
  quantity: string;
  price: number;
  value: number;
  icon_url?: string;
}

export interface ZerionPortfolio {
  wallet_address: string;
  chain: string;
  total_value: number;
  pnl_percentage: number;
  assets: ZerionAsset[];
  snapshot_timestamp: number;
}

export interface MerkleLeaf {
  key: string;      // hash of the key identifier
  value: string;    // hash of the actual value
  data?: any;       // actual data (only for revealed leaves)
  label?: string;   // human-readable label
}

export interface MerkleProof {
  leaf: MerkleLeaf;
  siblings: string[];
  path: number[];   // 0 = left, 1 = right
}

export interface RevealPreferences {
  show_total_value: boolean;
  show_pnl: boolean;
  show_top_assets: boolean;
  top_assets_count: number;
  show_all_assets: boolean;
  show_wallet_address: boolean;
  show_snapshot_time: boolean;
}

export interface ShareToken {
  token_id: string;
  owner_address: string;           // Solana wallet
  commitment_address: string;      // PDA address
  commitment_version: number;      // Version at creation
  revealed_leaves: MerkleLeaf[];
  proof_data: MerkleProof[];
  metadata?: any;
  revoked: boolean;                // Off-chain revocation
  created_at: Date;
}

export interface PublicShareData {
  token_id: string;
  commitment_address: string;
  commitment_version: number;
  committed_at: string;
  revealed_data: {
    total_value?: string;
    pnl_percentage?: string;
    top_assets?: Array<{
      symbol: string;
      amount: string;
      value_usd: string;
    }>;
    snapshot_time: string;
  };
  proof_data: MerkleProof[];
  verification_status: 'valid' | 'invalid' | 'unknown';
  on_chain_status: {
    exists: boolean;
    revoked: boolean;
    version: number;
    merkle_root?: string;
  };
  privacy: {
    wallet_address: 'hidden' | 'revealed';
    total_assets_count: number;
    revealed_count: number;
  };
}

export interface GenerateShareRequest {
  wallet_address: string;
  commitment_address: string;      // From Solana
  commitment_version: number;      // Current version
  chain: string;
  reveal_preferences: RevealPreferences;
}

export interface GenerateShareResponse {
  share_url: string;
  token_id: string;
  commitment_address: string;
  commitment_version: number;
  revealed_count: number;
  hidden_count: number;
}
