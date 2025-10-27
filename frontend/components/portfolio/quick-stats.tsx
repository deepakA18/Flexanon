'use client'

import React from 'react'
import { DollarSign, TrendingUp, Wallet } from 'lucide-react'

interface QuickStatsProps {
  portfolio?: {
    total_value?: number
    pnl_percentage?: number
    assets_count?: number
  }
}

export default function QuickStats({ portfolio }: QuickStatsProps) {
  const totalValue = portfolio?.total_value || 0
  const pnlPercentage = portfolio?.pnl_percentage || 0
  const assetsCount = portfolio?.assets_count || 0
  const isPositive = pnlPercentage >= 0

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-blue-500" />
        <h3 className="text-lg font-semibold text-blue-500">Quick Stats</h3>
      </div>

      <div className="space-y-3">
        {/* Net Worth */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-semibold">Net Worth</span>
          </div>
          <div className="text-xl font-bold text-blue-900">
            ${totalValue.toFixed(2)}
          </div>
        </div>

        {/* All-Time PnL */}
        <div className={`p-3 rounded-lg border
          ${isPositive 
            ? 'bg-green-50 border-green-100' 
            : 'bg-red-50 border-red-100'}`}>
          <div className={`flex items-center gap-2 mb-1
            ${isPositive ? 'text-blue-600' : 'text-red-600'}`}>
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-semibold">All-Time PnL</span>
          </div>
          <div className={`text-xl font-bold
            ${isPositive ? 'text-blue-900' : 'text-red-900'}`}>
            {isPositive ? '+' : ''}{(pnlPercentage * 100).toFixed(2)}%
          </div>
        </div>

        {/* Holdings */}
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Wallet className="w-4 h-4" />
            <span className="text-xs font-semibold">Holdings</span>
          </div>
          <div className="text-xl font-bold text-blue-900">
            {assetsCount} {assetsCount === 1 ? 'asset' : 'assets'}
          </div>
        </div>
      </div>
    </div>
  )
}