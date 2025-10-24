"use client"

export async function useShareLink({
  apiBase,
  walletAddress,
  merkleRootHex,
  signMessage
}: {
  apiBase: string
  walletAddress: string
  merkleRootHex: string
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>
}) {
  // Encode and sign Merkle root
  const encoded = new TextEncoder().encode(merkleRootHex)
  const signed = await signMessage(encoded)
  const base58Sig = base58Encode(signed.signature)

  const res = await fetch(`${apiBase}/share/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      wallet_address: walletAddress,
      signature: base58Sig,
      message: `FlexAnon Ownership Verification\nWallet: ${walletAddress}`,
      timestamp: Date.now(),
      merkle_root: merkleRootHex,
      reveal_preferences: {
        show_total_value: true,
        show_pnl: true,
        show_top_assets: true,
        top_assets_count: 5,
        show_wallet_address: false
      }
    }),
  })

  const data = await res.json()
  if (!data.success) throw new Error(data.user_friendly_message || "Failed to generate share link")
  return data.share_url
}

// Base58 helper
const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
function base58Encode(buffer: Uint8Array) {
  const digits = [0]
  for (let i = 0; i < buffer.length; i++) {
    let carry = buffer[i]
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8
      digits[j] %= 58
      carry = (carry / 58) | 0
    }
    while (carry > 0) {
      digits.push(carry % 58)
      carry = (carry / 58) | 0
    }
  }
  // leading zeros
  for (let i = 0; i < buffer.length && buffer[i] === 0; i++) digits.push(0)
  return digits.reverse().map((d) => BASE58_ALPHABET[d]).join("")
}
