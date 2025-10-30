'use client'

import React from 'react'
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
    <Card className="bg-[#004aad] text-white border-none shadow-2xl">
      <CardHeader className="space-y-5 pb-6">
        {/* Label */}
        <div className="flex items-center gap-2 text-white/90">
          <Wallet className="w-5 h-5" />
          <span className="text-sm font-medium uppercase tracking-wider">Wallet Value</span>
        </div>

        {/* Main Value - Extra Large */}
        <div>
          <p className="text-6xl md:text-7xl font-extrabold tracking-tight text-white">
            ${totalValue.toFixed(2)}
          </p>
        </div>

        {/* Change Section */}
        <div className="space-y-3">
          {/* Badge */}
          <Badge 
            variant="secondary" 
            className={`inline-flex items-center gap-2 backdrop-blur-sm border-0 px-4 py-2.5 ${
              isPositive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
            }`}
          >
            {isPositive ? (
              <ArrowUpRight className="w-5 h-5" />
            ) : (
              <ArrowDownRight className="w-5 h-5" />
            )}
            <span className="text-xl font-bold">
              {isPositive ? '+' : ''}{(pnlPercentage * 100).toFixed(2)}%
            </span>
          </Badge>

          {/* Change Text */}
          <p className="text-white/80 text-base">
            {isPositive ? '+' : ''}${absoluteChange.toFixed(2)} from yesterday
          </p>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {/* Bottom Section */}
        <div className="border-t border-white/20 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm mb-1 text-white/70">Portfolio</p>
              <p className="text-2xl font-bold text-white">{assetsCount} Assets</p>
            </div>
            <div className="text-right">
              <p className="text-sm mb-1 text-white/70">Status</p>
              <div className="flex justify-end">
                {isPositive ? (
                  <TrendingUp className="w-8 h-8 text-green-400" />
                ) : (
                  <TrendingDown className="w-8 h-8 text-red-400" />
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}