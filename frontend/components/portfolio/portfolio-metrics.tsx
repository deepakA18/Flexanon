'use client'

import React from 'react'
import { BarChart3, Link2, Layers, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { PortfolioData } from './types'

interface PortfolioMetricsProps {
  portfolio?: PortfolioData
  positions?: any[]
}

export default function PortfolioMetrics({ portfolio, positions = [] }: PortfolioMetricsProps) {
  const walletAddress = portfolio?.wallet_address || ''
  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : 'N/A'

  return (
    <Card className='bg-white'>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <BarChart3 className="w-4 h-4" />
          <span className="text-lg font-semibold">Portfolio Metrics</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Total Assets */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2 text-primary">
            <Layers className="w-4 h-4" />
            <span className="text-sm">Total Assets</span>
          </div>
          <span className="text-sm font-bold ">{positions.length}</span>
        </div>
        
        <Separator />

        {/* Network */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2 text-primary">
            <Link2 className="w-4 h-4" />
            <span className="text-sm">Network</span>
          </div>
          <span className="text-sm font-semibold  capitalize">
            {portfolio?.chain || 'Solana'}
          </span>
        </div>
        
        <Separator />

        {/* Total Value */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2 text-primary">
            <BarChart3 className="w-4 h-4" />
            <span className="text-sm">Total Value</span>
          </div>
          <span className="text-sm font-bold ">
            ${(portfolio?.total_value || 0).toFixed(2)}
          </span>
        </div>
        
        <Separator />

        {/* Last Updated */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2 text-primary">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Last Updated</span>
          </div>
          <span className="text-xs font-medium ">
            {portfolio?.snapshot_timestamp
              ? (() => {
                const now = Date.now()
                const snapshotTime = new Date(portfolio.snapshot_timestamp).getTime()
                const diffMs = now - snapshotTime
                const diffMinutes = Math.floor(diffMs / (1000 * 60))
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

                if (diffMinutes < 1) return 'Just now'
                if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`
                if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
                if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
                return new Date(portfolio.snapshot_timestamp).toLocaleDateString()
              })()
              : 'Never'
            }
          </span>
        </div>

        {/* Wallet Address */}
        {walletAddress && (
          <>
            <Separator className="my-3" />
            <div className="pt-3">
              <div className="text-xs text-primary mb-1">Wallet Address</div>
              <div className="font-mono text-xs text-primary bg-gray-50 px-2 py-1.5 rounded">
                {shortAddress}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}