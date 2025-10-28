'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import ConnectWalletButton from '../connect-wallet-button'
import { Button } from '../ui/button'
import Link from 'next/link'

export default function ConnectWalletCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col h-full w-full items-center justify-center"
    >




      <Button asChild >
        <Link href="/">Redirect to home page</Link>
      </Button>



    </motion.div>
  )
}
