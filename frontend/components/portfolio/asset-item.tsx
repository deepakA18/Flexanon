'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { Asset } from './types'
import { formatCurrency } from './utils'

interface AssetItemProps {
  asset: Asset
  index: number
}

export default function AssetItem({ asset, index }: AssetItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 200, damping: 15 }}
      className="relative flex items-center gap-3 p-3 rounded-xl border text-neutral-200 bg-white/10"
     
    >
     
     
      {/* Icon */}
      {asset?.icon_url ? (
        <img
          src={asset.icon_url}
          alt={asset.symbol}
          className="w-8 h-8 rounded-full object-cover border border-white/10"
          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-400 to-neutral-900 flex items-center justify-center text-[10px] font-semibold text-white/80 border border-white/10">
          {asset?.symbol?.slice?.(0, 2)?.toUpperCase?.()}
        </div>
      )}

      {/* Name + Symbol */}
      <div className="min-w-0 flex-1">
        <p className="text-lg  text-white/90 truncate font-mono tracking-wider font-bold">{asset?.symbol}</p>
       
      </div>

      {/* Value */}
      <div className="text-right">
        <p className="text-lg font-bold text-white/90">
          ${asset?.value?.toLocaleString?.('en-US', { maximumFractionDigits: 2 })}
        </p>
        <p className="text-[12px] text-neutral-500">
          {parseFloat(asset?.quantity || '0')?.toLocaleString?.('en-US', {
            maximumFractionDigits: 4,
          })}
        </p>
      </div>
    </motion.div>
  )
}
