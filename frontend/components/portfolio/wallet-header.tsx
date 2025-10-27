'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Wallet } from 'lucide-react'
import { SubscriptionData } from './types'
import { truncateAddress } from './utils'

interface WalletHeaderProps {
  walletAddress?: string | null
  subscription?: SubscriptionData | null
  subscriptionLoading?: boolean
}

export default function WalletHeader({
  walletAddress,
  subscription,
  subscriptionLoading
}: WalletHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
                <Wallet className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-neutral-400 uppercase tracking-widest">Connected Wallet</p>
                <p className="text-base font-mono font-semibold text-white">
                  {truncateAddress(walletAddress)}
                </p>
              </div>
            </div>
            {subscription && !subscriptionLoading && (
              <Badge variant="outline" className="gap-2 bg-white/10 border-white/20 text-neutral-200">
                {subscription?.plan === 'pro' ? '💎 Pro' : '⭐ Free'}
                <span className="text-xs text-neutral-400">
                  {subscription?.updates_remaining}/{subscription?.updates_limit}
                </span>
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}