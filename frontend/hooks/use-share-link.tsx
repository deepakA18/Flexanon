import { base58Encode } from "@/lib/crypto-utils";

export async function useShareLink({
  apiBase,
  walletAddress,
  merkleRootHex,
  signMessage,
}: {
  apiBase: string;
  walletAddress: string;
  merkleRootHex: string;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
}) {
  const timestamp = Date.now();
  const message = `FlexAnon Commitment\n\nWallet: ${walletAddress}\nMerkle Root: ${merkleRootHex.substring(
    0,
    32
  )}...\nTimestamp: ${timestamp}`;

  const signedMessage = await signMessage(new TextEncoder().encode(message));
  const signature = base58Encode(signedMessage);

  const relayResponse = await fetch(`${apiBase}/relayer/commit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      wallet_address: walletAddress,
      merkle_root: merkleRootHex,
      signature,
      message,
      timestamp,
      metadata: { chain: "solana", snapshot_timestamp: timestamp, privacy_score: 75 },
    }),
  });

  const relayData = await relayResponse.json();
  if (!relayData.success) throw new Error(relayData.error || "Relayer commit failed");

  const linkMessage = `Verify ownership of ${walletAddress} at ${timestamp}`;
  const linkSignature = base58Encode(await signMessage(new TextEncoder().encode(linkMessage)));

  const genResponse = await fetch(`${apiBase}/share/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      wallet_address: walletAddress,
      signature: linkSignature,
      message: linkMessage,
      timestamp,
      commitment_address: relayData.commitment_address,
      chain: "solana",
    }),
  });

  const genData = await genResponse.json();
  if (!genData.success) throw new Error(genData.error || "Link generation failed");

  return genData.share_url;
}
