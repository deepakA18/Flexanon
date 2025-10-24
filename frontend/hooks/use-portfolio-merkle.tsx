import { useState, useEffect } from "react";
import { buildPortfolioLeaves, buildSparseMerkleTree } from "@/lib/crypto-utils";

export function usePortfolioMerkle(apiBase: string, walletAddress: string | null) {
  const [merkleRootHex, setMerkleRootHex] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress) return;

    let mounted = true;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${apiBase}/dev/test-zerion`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet_address: walletAddress }),
        });

        const { success, portfolio } = await res.json();
        if (!success) throw new Error("Failed to fetch portfolio data");
// @ts-ignore
        const leaves = buildPortfolioLeaves(portfolio, walletAddress);
        const root = buildSparseMerkleTree(leaves);

        if (mounted) {
          setPortfolio(portfolio);
          setMerkleRootHex(root);
        }
      } catch (err: unknown) {
        if (mounted) setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();

    return () => { mounted = false }; // cleanup if component unmounts
  }, [apiBase, walletAddress]);

  return { portfolio, merkleRootHex, loading, error };
}
