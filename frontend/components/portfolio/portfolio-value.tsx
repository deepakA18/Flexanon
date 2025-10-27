'use client'

import React from 'react'
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight } from 'lucide-react'

interface PortfolioValueProps {
  totalValue?: number
  pnlPercentage?: number
  positions?: any[]
}

export default function PortfolioValue({ totalValue = 0, pnlPercentage = 0, positions = [] }: PortfolioValueProps) {
  const isPositive = pnlPercentage >= 0
  const absoluteChange = positions[0]?.changes?.absolute_1d || 0
  const assetsCount = positions.length

  return (
    <div className="space-y-6 text-white">
      {/* Label */}
      <div className="flex items-center gap-2 text-blue-600">
        <Wallet className="w-5 h-5" />
        <span className="text-sm font-medium uppercase tracking-wider">Total Value</span>
      </div>

      {/* Main Value - Extra Large */}
      <div>
        <p className="text-6xl md:text-7xl font-extrabold tracking-tight text-blue-500">
          ${totalValue.toFixed(2)}
        </p>
      </div>

      {/* Change Section */}
      <div className="space-y-3">
        {/* Badge */}
        <div className="inline-flex text-blue-500 items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 px-4 py-3 rounded-2xl">
          {isPositive ? (
            <ArrowUpRight className="w-5 h-5" />
          ) : (
            <TrendingDown className="w-5 h-5" />
          )}
          <span className="text-xl text-blue-500 font-bold">
            {isPositive ? '+' : ''}{(pnlPercentage * 100).toFixed(2)}%
          </span>
        </div>

        {/* Change Text */}
        <p className="text-blue-100 text-base text-blue-500">
          {isPositive ? '+' : ''}${absoluteChange.toFixed(2)} from yesterday
        </p>
      </div>

      {/* Bottom Section */}
      <div className="pt-6 mt-auto border-t border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <p className=" text-sm mb-1 text-blue-500">Portfolio</p>
            <p className="text-2xl font-bold text-blue-500">{assetsCount} Assets</p>
          </div>
          <div className="text-right">
            <p className=" text-sm mb-1 text-blue-500">Status</p>
            <p className="text-2xl font-bold">{isPositive ? '📈' : '📉'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}