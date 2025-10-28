"use client";

import { useEffect, useRef } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { motion } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";

export default function ConnectWalletButton() {
  const { connected, publicKey } = useWallet();
  const router = useRouter();
  const hasNavigated = useRef(false);

  useEffect(() => {
    // Navigate immediately when wallet connects
    if (connected && publicKey && !hasNavigated.current) {
      hasNavigated.current = true;
      const walletAddress = publicKey.toBase58();
      
      // Use replace for instant navigation without adding to history
      router.replace(`/profile/${walletAddress}`);
    }
    
    // Reset navigation flag when wallet disconnects
    if (!connected) {
      hasNavigated.current = false;
    }
  }, [connected, publicKey, router]);

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      className="inline-block"
    >
      <WalletMultiButton />
    </motion.div>
  );
}