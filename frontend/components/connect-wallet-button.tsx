"use client";

import { useEffect } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { motion } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";

export default function ConnectWalletButton() {
  const { connected, publicKey } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (connected && publicKey) {
      // Convert the wallet address to string
      const walletAddress = publicKey.toBase58();

      // Navigate to /profile/[walletAddress]
      router.push(`/profile/${walletAddress}`);
    }
  }, [connected, publicKey, router]);

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      className="inline-block"
    >
      <WalletMultiButton className="!bg-indigo-600 !rounded-4xl !text-white !font-semibold hover:!bg-indigo-700 transition-all px-4 py-2" />
    </motion.div>
  );
}
