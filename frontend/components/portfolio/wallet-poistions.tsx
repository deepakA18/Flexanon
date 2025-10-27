'use client'

import React from "react"

interface Position {
  position: number
  symbol: string
  name: string
  quantity: string
  price: number
  value: number
  icon_url?: string
  asset_code?: string
}

interface Props {
  positions: Position[]
}

export default function WalletPositions({ positions }: Props) {
  if (!positions || positions.length === 0) {
    return (
      <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500 text-xs">No positions found</p>
      </div>
    )
  }

  // Show only top 6 positions
  const topPositions = positions.slice(0, 6)

  return (
    <div className="grid grid-cols-2 gap-3">
      {topPositions.map((pos) => (
        <div
          key={pos.asset_code}
          className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-2
                     hover:shadow-md hover:border-gray-300 hover:-translate-y-0.5 
                     transition-all duration-200"
        >
          {pos.icon_url && (
            <img
              src={pos.icon_url}
              alt={pos.symbol}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-100 flex-shrink-0"
            />
          )}
          <div className="flex flex-col min-w-0 flex-1">
            <p className="font-bold text-gray-900 text-xs truncate">
              {pos.symbol}
            </p>
            <p className="text-gray-600 text-[10px] truncate">
              {pos.quantity}
            </p>
            <p className="text-gray-900 font-semibold text-sm mt-0.5">
              ${pos.value.toFixed(2)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}