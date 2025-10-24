import { buildPortfolioLeaves, buildSparseMerkleTree } from "@/lib/crypto-utils";

export async function usePortfolioMerkle(apiBase: string, walletAddress: string) {
  const res = await fetch(`${apiBase}/dev/test-zerion`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet_address: walletAddress }),
  });
  const { success, portfolio } = await res.json();
  if (!success) throw new Error("Failed to fetch portfolio data");

  const leaves = buildPortfolioLeaves(portfolio, walletAddress);
  const merkleRootHex = buildSparseMerkleTree(leaves);
  return { portfolio, merkleRootHex };
}
