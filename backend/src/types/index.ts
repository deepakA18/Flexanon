// Core types for FlexAnon

export interface WalletAuth {
  address: string;
  chain: 'solana';
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
  changes?: {
    absolute_1d: number;  // 24h change in USD
    percent_1d: number;   // 24h change in percentage
  };
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
  chart_data?: any;                // NEW: Chart data from Zerion
  metadata?: any;
  revoked: boolean;                // Off-chain revocation
  created_at: Date;
}

export interface PublicShareData {
  token_id: string;
  // commitment_address removed for privacy - no one should be able to derive wallet address
  committed_at: string;
  revealed_data: {
    total_value?: string;
    pnl_percentage?: string;
    top_assets?: Array<{
      symbol: string;
      amount: string;
      value_usd: string;
      icon_url?: string;
      name?: string;
      change_24h?: string;
    }>;
    snapshot_time: string;
    chart_data?: any;              // NEW: Chart data for portfolio visualization
  };
  proof_data: MerkleProof[];
  verification_status: 'valid' | 'invalid' | 'unknown';
  on_chain_status: {
    verified: boolean;      // Just show if verified on-chain
    revoked: boolean;
    version: number;
    // merkle_root removed - not needed for public view
  };
  privacy: {
    wallet_address: 'hidden' | 'revealed';
    actual_wallet?: string;  // Only if user chose to reveal
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
  chart_data?: any;                // NEW: Optional chart data from frontend
}

export interface GenerateShareResponse {
  share_url: string;
  token_id: string;
  commitment_address: string;
  commitment_version: number;
  revealed_count: number;
  hidden_count: number;
}