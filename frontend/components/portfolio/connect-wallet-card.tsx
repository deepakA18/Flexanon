'use client'

import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import ConnectWalletButton from '../connect-wallet-button'
import { Button } from '../ui/button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function ConnectWalletCard() {
  const router = useRouter()

  useEffect(() => {
    // Redirect after 2 seconds
    const timer = setTimeout(() => {
      router.push('/')
    }, 2000)

    // Cleanup timer on unmount
    return () => clearTimeout(timer)
  }, [router])
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col h-full w-full items-center justify-center gap-6"
    >
      {/* Loader */}
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Redirecting to home page...</p>
      </div>

      {/* Manual redirect button */}
      <Button asChild variant="outline">
        <Link href="/">Go to home page now</Link>
      </Button>
    </motion.div>
  )
}