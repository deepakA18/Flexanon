'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import ConnectWalletButton from '../connect-wallet-button'

export default function ConnectWalletCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto"
    >
      <Card className="portfolio-card relative overflow-hidden rounded-2xl shadow-lg">
        <div className="portfolio-bevel" />
        <div className="portfolio-inner-shadow" />

        <CardHeader className="space-y-4 text-center py-8">
          <CardTitle className="text-4xl md:text-5xl bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">
            Welcome to FlexAnon
          </CardTitle>
          <CardDescription className="text-base text-neutral-300">
            Connect your wallet to view and share your portfolio anonymously
          </CardDescription>
        </CardHeader>

        <CardContent className="pb-8 flex justify-center">
          <ConnectWalletButton />
        </CardContent>
      </Card>
    </motion.div>
  )
}
