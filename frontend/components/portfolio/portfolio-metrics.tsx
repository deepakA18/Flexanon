'use client'

import React from 'react'
import { BarChart3, Link2, Layers, Clock } from 'lucide-react'
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
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-blue-500" />
        <h3 className="text-lg font-semibold text-blue-500">Portfolio Metrics</h3>
      </div>

      <div className="space-y-3">
        {/* Total Assets */}
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <div className="flex items-center gap-2 text-blue-600">
            <Layers className="w-4 h-4" />
            <span className="text-sm">Total Assets</span>
          </div>
          <span className="text-sm font-bold text-gray-900">{positions.length}</span>
        </div>

        {/* Network */}
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <div className="flex items-center gap-2 text-blue-600">
            <Link2 className="w-4 h-4" />
            <span className="text-sm">Network</span>
          </div>
          <span className="text-sm font-semibold text-gray-900 capitalize">
            {portfolio?.chain || 'Solana'}
          </span>
        </div>

        {/* Total Value */}
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <div className="flex items-center gap-2 text-blue-600">
            <BarChart3 className="w-4 h-4" />
            <span className="text-sm">Total Value</span>
          </div>
          <span className="text-sm font-bold text-gray-900">
            ${(portfolio?.total_value || 0).toFixed(2)}
          </span>
        </div>

        {/* Last Updated */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2 text-blue-600">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Last Updated</span>
          </div>
          <span className="text-xs font-medium text-gray-500">
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
      </div>

      {/* Wallet Address */}
      {walletAddress && (
        <div className="pt-3 border-t border-gray-100">
          <div className="text-xs text-blue-500 mb-1">Wallet Address</div>
          <div className="font-mono text-xs text-blue-900 bg-gray-50 px-2 py-1.5 rounded">
            {shortAddress}
          </div>
        </div>
      )}
    </div>
  )
}