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
      const walletAddress = publicKey.toBase58();
      router.push(`/profile/${walletAddress}`);
    } else if (!connected) {
      router.push(`/`);
    }
  }, [connected, publicKey, router]);

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      className="inline-block"
    >
      <WalletMultiButton className="!text-white transition-all px-4 py-2" />
    </motion.div>
  );
}
