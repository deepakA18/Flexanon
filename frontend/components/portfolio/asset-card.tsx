'use client'

import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Position {
  symbol: string
  name: string
  icon_url?: string
  quantity: string
  price: number
  value: number
  changes?: {
    percent_1d?: number
  }
}

interface AssetCardsProps {
  positions?: Position[]
}

export default function AssetCards({ positions = [] }: AssetCardsProps) {
  if (positions.length === 0) {
    return (
      <div className="col-span-full text-center py-8  text-sm">
        No assets found
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 bg-white sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {positions.map((position, index) => {
        const change = position.changes?.percent_1d || 0
        const isPositive = change >= 0

        return (
          <Card
            key={position.symbol + index}
            className="bg-gradient-to-br from-white to-gray-50 hover:shadow-lg 
                     hover:border-gray-300 hover:-translate-y-1 transition-all duration-200 cursor-pointer"
          >
            <CardContent className="p-4">
              {/* Icon & Symbol */}
              <div className="flex flex-col items-center text-center space-y-2">
                {position.icon_url && (
                  <Image
                    priority
                    height={48}
                    width={48}
                    src={position.icon_url}
                    alt={position.symbol}
                    className="w-12 h-12 rounded-full ring-2 ring-gray-200"
                  />
                )}

                <div className="w-full">
                  <div className="font-bold  text-sm truncate">
                    {position.symbol}
                  </div>
                  <div className="text-xs  truncate">
                    {position.name}
                  </div>
                </div>
              </div>

              {/* Quantity */}
              <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
                <div className="text-xs  text-center">Amount</div>
                <div className="text-sm font-semibold  text-center truncate">
                  {parseFloat(position.quantity).toFixed(4)}
                </div>
              </div>

              {/* Price */}
              <div className="mt-2 space-y-1">
                <div className="text-xs  text-center">Price</div>
                <div className="text-sm font-semibold  text-center">
                  ${position.price.toFixed(2)}
                </div>
              </div>

              {/* Value */}
              <div className="mt-2 space-y-1">
                <div className="text-xs  text-center">Value</div>
                <div className="text-base font-bold  text-center">
                  ${position.value.toFixed(2)}
                </div>
              </div>

              {/* 24h Change */}
              <div className="mt-3">
                <Badge 
                  variant="secondary"
                  className={`w-full flex items-center justify-center gap-1
                    ${isPositive ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
                >
                  {isPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span className="text-xs font-bold">
                    {isPositive ? '+' : ''}{(change * 100).toFixed(2)}%
                  </span>
                </Badge>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}