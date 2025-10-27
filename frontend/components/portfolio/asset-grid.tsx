'use client'

import React from 'react'
import { Wallet } from 'lucide-react'
import { Asset } from './types'

interface AssetGridProps {
  assets?: Asset[]
}

export default function AssetGrid({ assets }: AssetGridProps) {
  if (!assets || assets.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
        <Wallet className="w-10 h-10 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No assets found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {assets.map((asset) => (
        <div 
          key={asset.asset_code || asset.symbol} 
          className="bg-white border border-gray-200 p-4 rounded-lg flex items-center gap-3 
                   hover:shadow-md hover:border-gray-300 transition-all duration-200"
        >
          {asset.icon_url && (
            <img 
              src={asset.icon_url} 
              alt={asset.symbol} 
              className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100" 
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">
              {asset.name || asset.symbol}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {asset.quantity} units
            </div>
            <div className="text-base text-gray-900 font-semibold mt-1">
              ${asset.value?.toFixed(2)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}