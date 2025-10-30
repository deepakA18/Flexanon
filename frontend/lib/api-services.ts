interface Asset {
  symbol: string
  name: string
  quantity: number
  price: number
  value: number
  icon_url: string
}
interface Portfolio {
  chain: string
  total_value: number
  pnl_percentage: number
  snapshot_timestamp: number
  assets: Asset[]
}
interface PortfolioResponse {
  success: boolean
  portfolio: Portfolio
}

interface CommitmentResponse {
  success: boolean
  commitment_address: string
  commitment_version: string
  transaction_signature:string
  details?: string
  error?: string
}

interface ShareLinkResponse {
  success: boolean
  share_url: string
  user_friendly_message?: string
  details?: string
  error?: string
}

export interface SubscriptionData {
  plan: 'free' | 'pro'
  updates_remaining: number
  updates_limit: number
}

interface RevealPreferences {
  show_total_value: boolean
  show_pnl: boolean
  show_top_assets: boolean
  top_assets_count: number
  show_wallet_address: boolean
}

interface CommitmentMetadata {
  chain: string
  snapshot_timestamp: number
  expires_at: null
  privacy_score: number
}

export async function fetchPortfolio(
  apiBase: string,
  walletAddress: string
): Promise<Portfolio> {
  const response = await fetch(`${apiBase}/dev/test-zerion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wallet_address: walletAddress })
  })

  const data: PortfolioResponse = await response.json()

  if (!data.success || !data.portfolio) {
    throw new Error('Failed to fetch portfolio data')
  }

  if (data.portfolio.assets.length === 0) {
    throw new Error('No assets found in portfolio')
  }

  return data.portfolio
}
// In your lib/api-services.ts
export async function fetchWalletPositions(apiBase: string, walletAddress: string) {
  try {
    const res = await fetch(`${apiBase}/dev/wallet-positions/${walletAddress}?chain=solana`);

    if (!res.ok) throw new Error('Failed to fetch wallet positions');
    return res.json();
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function fetchWalletChart(apiBase: string, walletAddress: string, period: string = 'day') {
  try {
    const res = await fetch(`${apiBase}/dev/wallet-chart/${walletAddress}?period=${period}`);
    if (!res.ok) throw new Error('Failed to fetch wallet chart');
    return res.json();
  } catch (e) {
    console.error(e);
    return null;
  }
}


export async function submitCommitment(
  apiBase: string,
  walletAddress: string,
  merkleRoot: number[],
  signature: string,
  message: string,
  timestamp: number
): Promise<{ commitmentAddress: string; commitmentVersion: string;transactionSignature:string }> {
  const metadata: CommitmentMetadata = {
    chain: 'solana',
    snapshot_timestamp: timestamp,
    expires_at: null,
    privacy_score: 75
  }

  const response = await fetch(`${apiBase}/relayer/commit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      wallet_address: walletAddress,
      merkle_root: merkleRoot,
      metadata,
      signature,
      message,
      timestamp
    })
  })

  const data: CommitmentResponse = await response.json()
  if (!data.success) {
    throw new Error(data.details || data.error || 'Relayer commit failed')
  }

  return {
    commitmentAddress: data.commitment_address,
    commitmentVersion: data.commitment_version,
    transactionSignature:data.transaction_signature
  }
}

export async function generateShareLink(
  apiBase: string,
  walletAddress: string,
  signature: string,
  message: string,
  timestamp: number,
  commitmentAddress: string,
  commitmentVersion: string
): Promise<string> {
  const revealPreferences: RevealPreferences = {
    show_total_value: true,
    show_pnl: true,
    show_top_assets: true,
    top_assets_count: 5,
    show_wallet_address: false
  }

  const response = await fetch(`${apiBase}/share/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      wallet_address: walletAddress,
      signature,
      message,
      timestamp,
      commitment_address: commitmentAddress,
      commitment_version: commitmentVersion,
      chain: 'solana',
      reveal_preferences: revealPreferences
    })
  })

  const data: ShareLinkResponse = await response.json()
  if (!data.success) {
    const errorMessage =
      data.user_friendly_message || data.details || data.error || 'Link generation failed'
    throw new Error(errorMessage)
  }

  return data.share_url
}

export async function fetchSubscriptionStatus(

  walletAddress: string
): Promise<SubscriptionData> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/subscription/status?wallet=${walletAddress}`)

  return response.json()
}

export async function trackUpdateUsage(
  apiBase: string,
  walletAddress: string
): Promise<void> {
  await fetch(`${apiBase}/subscription/use-update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wallet_address: walletAddress })
  })
}