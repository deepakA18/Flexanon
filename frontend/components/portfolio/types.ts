export interface Asset {
  asset_code?: string
  symbol?: string
  name?: string
  quantity?: string
  price?: number
  value?: number
  icon_url?: string
}

// In your types file (e.g., components/portfolio/types.ts)
export interface PortfolioData {
  wallet_address: string
  chain: string
  total_value: number
  pnl_percentage: number
  assets_count: number
  assets: Asset[]
  snapshot_timestamp?: number // Keep as number (Unix timestamp)
}

export interface SubscriptionData {
  plan?: string
  updates_remaining?: number
  updates_limit?: number
}