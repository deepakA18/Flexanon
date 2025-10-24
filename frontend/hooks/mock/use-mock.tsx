// __define-ocg__
// This mock file replaces API calls and wallet data with static test values for UI preview

import { useCallback } from "react"

const MOCK_WALLET_ADDRESS = "8KfN7zVq9c3MNfgTqX7kL6rJpD9cHkWp2rE7kXW9QXeP"
const MOCK_MERKLE_ROOT = "0xdeadbeefcafebabe1234567890abcdef"
const MOCK_SHARE_LINK = "https://flexanon.io/share/abc123xyz"

export const useMockPortfolioMerkle = () => {
  return { merkleRootHex: MOCK_MERKLE_ROOT }
}

export const useMockSubscription = () => {
  const useUpdate = async () => Promise.resolve("mock_subscription_update_success")
  return { useUpdate }
}

export const useMockShareLink = () => {
  const useShareLink = useCallback(async () => {
    await new Promise(res => setTimeout(res, 1000)) // simulate delay
    return MOCK_SHARE_LINK
  }, [])
  return { useShareLink }
}

export const useMockWallet = () => {
  return {
    connected: true,
    publicKey: { toBase58: () => MOCK_WALLET_ADDRESS },
    signMessage: async (msg: Uint8Array) => new Uint8Array([1, 2, 3]),
  }
}

export const MOCK_PORTFOLIO = {
  chain: "Solana",
  total_value: 5234.76,
  pnl_percentage: 12.5,
  snapshot_timestamp: 1698451234,
  assets: [
    { symbol: "SOL", amount: 32.1, value_usd: 4312.55, pnl: 10.2 },
    { symbol: "USDC", amount: 922.21, value_usd: 922.21, pnl: 0.0 },
  ],
}
