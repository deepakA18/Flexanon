'use client'

import React from 'react'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'

interface PortfolioPerformanceProps {
  positions?: any[]
}

export default function PortfolioPerformance({ positions = [] }: PortfolioPerformanceProps) {
  const percentChange = positions[0]?.changes?.percent_1d || 0
  const absoluteChange = positions[0]?.changes?.absolute_1d || 0
  const isPositive = percentChange >= 0

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-2 text-blue-500">
        <Activity className="w-4 h-4" />
        <h3 className="text-lg font-semibold">Portfolio Performance</h3>
      </div>

      {/* Main Metric */}
      <div className="space-y-2">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl
          ${isPositive ? 'bg-blue-50' : 'bg-red-50'}`}>
          {isPositive ? (
            <TrendingUp className={`w-6 h-6 ${isPositive ? 'text-blue-600' : 'text-red-600'}`} />
          ) : (
            <TrendingDown className={`w-6 h-6 ${isPositive ? 'text-blue-600' : 'text-red-600'}`} />
          )}
          <span className={`text-3xl font-bold ${isPositive ? 'text-blue-700' : 'text-red-700'}`}>
            {isPositive ? '+' : ''}{(percentChange * 100).toFixed(2)}%
          </span>
        </div>

        {/* Subtitle */}
        <p className={`text-sm font-medium ${isPositive ? 'text-blue-600' : 'text-red-600'}`}>
          {isPositive ? '+' : ''}${absoluteChange.toFixed(2)} today
        </p>
      </div>

      {/* Additional Info */}
      <div className="pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Status</span>
          <span className={`font-semibold ${isPositive ? 'text-blue-600' : 'text-red-600'}`}>
            {isPositive ? 'Gaining' : 'Declining'}
          </span>
        </div>
      </div>
    </div>
  )
}