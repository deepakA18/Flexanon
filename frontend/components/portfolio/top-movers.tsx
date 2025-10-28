'use client'

import React from 'react'
import { TrendingUp, TrendingDown, Zap } from 'lucide-react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Position {
  symbol: string
  icon_url?: string
  changes?: {
    percent_1d?: number
  }
}

interface TopMoversProps {
  positions?: Position[]
}

export default function TopMovers({ positions = [] }: TopMoversProps) {
  // Sort by absolute change value (highest movers, regardless of direction)
  const sortedPositions = [...positions].sort((a, b) => {
    const changeA = Math.abs(a.changes?.percent_1d || 0)
    const changeB = Math.abs(b.changes?.percent_1d || 0)
    return changeB - changeA
  })

  const topMovers = sortedPositions.slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-500">
          <Zap className="w-4 h-4" />
          <span className="text-sm font-semibold">Top Movers (24h)</span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {topMovers.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No movers data available
          </div>
        ) : (
          <div className="space-y-3">
            {topMovers.map((position, index) => {
              const change = position.changes?.percent_1d || 0
              const isPositive = change >= 0

              return (
                <div
                  key={position.symbol + index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg
                           hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {position.icon_url && (
                      <Image
                        height={32}
                        width={32}
                        src={position.icon_url}
                        alt={position.symbol}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <span className="font-semibold text-gray-900 text-sm">
                      {position.symbol}
                    </span>
                  </div>

                  <Badge 
                    variant="secondary"
                    className={`flex items-center gap-1.5
                      ${isPositive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                  >
                    {isPositive ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span className="text-sm font-bold">
                      {isPositive ? '+' : ''}{(change * 100).toFixed(2)}%
                    </span>
                  </Badge>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}