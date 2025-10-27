'use client'

import React from 'react'
import { TrendingUp, TrendingDown, List } from 'lucide-react'

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

interface TopAssetsListProps {
  positions?: Position[]
}

export default function TopAssetsList({ positions = [] }: TopAssetsListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <List className="w-4 h-4 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-900">Top Assets</h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Asset</th>
              <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
              <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Price</th>
              <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Value</th>
              <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 uppercase">24h</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((position, index) => {
              const change = position.changes?.percent_1d || 0
              const isPositive = change >= 0

              return (
                <tr 
                  key={position.symbol + index}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  {/* Asset */}
                  <td className="py-4 px-3">
                    <div className="flex items-center gap-3">
                      {position.icon_url && (
                        <img 
                          src={position.icon_url} 
                          alt={position.symbol}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{position.symbol}</div>
                        <div className="text-xs text-gray-500">{position.name}</div>
                      </div>
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="py-4 px-3 text-right">
                    <span className="text-sm font-medium text-gray-900">
                      {parseFloat(position.quantity).toFixed(4)}
                    </span>
                  </td>

                  {/* Price */}
                  <td className="py-4 px-3 text-right">
                    <span className="text-sm font-medium text-gray-900">
                      ${position.price.toFixed(2)}
                    </span>
                  </td>

                  {/* Value */}
                  <td className="py-4 px-3 text-right">
                    <span className="text-sm font-bold text-gray-900">
                      ${position.value.toFixed(2)}
                    </span>
                  </td>

                  {/* 24h Change */}
                  <td className="py-4 px-3 text-right">
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded
                      ${isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {isPositive ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span className="text-xs font-semibold">
                        {isPositive ? '+' : ''}{(change * 100).toFixed(2)}%
                      </span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {positions.length === 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">
          No assets found
        </div>
      )}
    </div>
  )
}