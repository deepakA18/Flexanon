"use client"

import { useState, useEffect } from "react"
import { sha256 } from "@/lib/crypto-utils" // utility to compute hex SHA256
import { buildSparseMerkleTree, buildPortfolioLeaves } from "@/lib/crypto-utils" // your existing logic

export function usePortfolioMerkle(apiBase: string, walletAddress: string | null) {
  const [merkleRootHex, setMerkleRootHex] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!walletAddress) return
    setLoading(true)

    async function fetchPortfolio() {
      try {
        const res = await fetch(`${apiBase}/dev/test-zerion`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet_address: walletAddress }),
        })
        const data = await res.json()
        if (!data.success || !data.portfolio) throw new Error("Failed to fetch portfolio")

        const leaves = buildPortfolioLeaves(data.portfolio, walletAddress)
        const rootHex = buildSparseMerkleTree(leaves)
        setMerkleRootHex(rootHex)
      } catch (err) {
        console.error("Merkle hook error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchPortfolio()
  }, [walletAddress, apiBase])

  return { merkleRootHex, loading }
}
