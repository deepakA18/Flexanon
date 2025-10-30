'use client'

import React from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, SlidersHorizontal, Camera } from 'lucide-react'
import Image from 'next/image'

interface UnifiedWalletCardProps {
  totalValue?: number
  pnlPercentage?: number
  positions?: any[]
  chartData?: any
  onRefresh?: () => void
  onShare?: () => void
}

export default function UnifiedWalletCard({ 
  totalValue = 0, 
  pnlPercentage = 0, 
  positions = [],
  chartData 
}: UnifiedWalletCardProps) {
  const isPositive = pnlPercentage >= 0

  // Process chart data
  const points = chartData?.chart_data?.attributes?.points || []
  const samplingRate = 12
  const data = points
    .filter((_: any, index: number) => index % samplingRate === 0)
    .map(([timestamp, value]: [number, number]) => ({
      time: new Date(timestamp * 1000).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      value,
      fullDate: new Date(timestamp * 1000)
    }))

  // Calculate metrics from positions
  const realizedPL = positions.reduce((sum, p) => sum + (p?.realized_pl || 0), 0)
  const unrealizedPL = positions.reduce((sum, p) => sum + (p?.unrealized_pl || 0), 0)
  const netChange = positions.reduce((sum, p) => sum + (p?.changes?.absolute_1d || 0), 0)
  const projectedGrowth = realizedPL + unrealizedPL + netChange

  // Time period buttons
  const periods = ['1h', '8h', '1d', '1w', '1m', '6m', '1y']
  const [selectedPeriod, setSelectedPeriod] = React.useState('1d')

  // Get top 5 assets by value
  const topAssets = [...positions]
    .sort((a, b) => (b?.value || 0) - (a?.value || 0))
    .slice(0, 5)
    .map((asset, idx) => ({
      symbol: asset?.token_symbol || asset?.symbol || 'UNKNOWN',
      name: asset?.name || asset?.token_symbol || 'Unknown Token',
      amount: Number(asset?.amount || asset?.quantity || 0),
      value: Number(asset?.value || 0),
      change24h: Number(asset?.changes?.percent_1d || 0),
      icon: asset?.icon_url || asset?.icon || '💰',
      isLargeCard: idx === 2 // Make the 3rd card (ETH) larger with chart
    }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 rounded-3xl overflow-hidden shadow-2xl">
      {/* Left Side - Blue Card */}
      <div className="lg:col-span-8 bg-[#004aad] text-white">
        <div className="p-8">
          {/* Header Section */}
          <div className="flex items-start justify-between mb-8">
            <div className="space-y-6">
              {/* Title */}
              <h2 className="text-white/90 text-lg font-medium">Wallet Value</h2>
              
              {/* Main Value */}
              <div>
                <h1 className="text-7xl font-bold mb-2">
                  ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h1>
                
                {/* Percentage Badge */}
                <Badge 
                  className={`inline-flex items-center gap-2 px-3 py-1.5 text-base font-semibold border-0 ${
                    isPositive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                  }`}
                >
                  <span className="text-xl">⊙</span>
                  {isPositive ? '+' : ''}{(pnlPercentage * 100).toFixed(1)}%
                </Badge>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-10 w-10 rounded-xl bg-white/10 hover:bg-white/20 text-white border-none"
              >
                <Plus className="h-5 w-5" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-10 w-10 rounded-xl bg-white/10 hover:bg-white/20 text-white border-none"
              >
                <SlidersHorizontal className="h-5 w-5" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-10 w-10 rounded-xl bg-white/10 hover:bg-white/20 text-white border-none"
              >
                <Camera className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div>
              <p className="text-white/60 text-sm mb-1">Realized PL</p>
              <p className="text-2xl font-bold">
                +${realizedPL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-green-400 text-xs mt-1">
                ⊙ +4.9% Today
              </p>
            </div>

            <div>
              <p className="text-white/60 text-sm mb-1">Unrealized PL</p>
              <p className="text-2xl font-bold">
                -${Math.abs(unrealizedPL).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-red-400 text-xs mt-1">
                ⊙ -2.1% Today
              </p>
            </div>

            <div>
              <p className="text-white/60 text-sm mb-1">Net Change</p>
              <p className="text-2xl font-bold">
                +${netChange.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-green-400 text-xs mt-1">
                ⊙ +0.8% Today
              </p>
            </div>

            <div>
              <p className="text-white/60 text-sm mb-1">Projected Growth</p>
              <p className="text-2xl font-bold">
                +${projectedGrowth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-green-400 text-xs mt-1">
                ⊙ +2.9% Today
              </p>
            </div>
          </div>

          {/* Time Period Selector */}
          <div className="flex items-center justify-center gap-3 mb-6">
            {periods.map((period) => (
              <Button
                key={period}
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedPeriod === period
                    ? 'bg-white/20 text-white'
                    : 'bg-transparent text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                {period}
              </Button>
            ))}
          </div>

          {/* Chart Area */}
          <div className="h-[400px] relative">
            {/* Bar chart background effect */}
            <div className="absolute inset-0 opacity-30">
              <div className="flex items-end justify-between h-full px-2 gap-1">
                {Array.from({ length: 80 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-white/40 rounded-t-sm"
                    style={{
                      height: `${Math.random() * 100}%`,
                      minHeight: '10%'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Line Chart Overlay */}
            <div className="relative h-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <defs>
                    <linearGradient id="colorValue1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFA500" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#FFA500" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorValue2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFFFFF" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#FFFFFF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  
                  {/* White line */}
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#FFFFFF" 
                    strokeWidth={2.5}
                    fill="url(#colorValue2)" 
                    dot={false}
                  />
                  
                  {/* Orange line */}
                  <Area 
                    type="monotone" 
                    dataKey={(d) => d.value * 0.95} 
                    stroke="#FFA500" 
                    strokeWidth={2.5}
                    fill="url(#colorValue1)" 
                    dot={false}
                  />
                  
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0, 74, 173, 0.95)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '12px',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                      color: '#fff'
                    }}
                    labelStyle={{ color: '#fff', fontWeight: 600 }}
                    formatter={(value: any) => [`$${value.toFixed(2)}`, 'Value']}
                  />
                </AreaChart>
              </ResponsiveContainer>

              {/* Peak indicator */}
              <div 
                className="absolute bg-white rounded-full p-2 shadow-lg"
                style={{ top: '20%', right: '35%' }}
              >
                <div className="w-3 h-3 rounded-full bg-[#004aad]" />
              </div>
              <div 
                className="absolute bg-white px-3 py-1.5 rounded-lg shadow-lg text-[#004aad] font-bold text-sm"
                style={{ top: '15%', right: '30%' }}
              >
                +$10,859.48
                <div className="text-xs font-normal">⊙ 15.4%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Dark Panel with Top Assets */}
      <div className="lg:col-span-4 bg-[#1a1a1a] text-white">
        <div className="p-6 h-full flex flex-col">
          {/* Portfolio Risk Score Section */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold mb-1">Portfolio</h3>
                <h3 className="text-2xl font-bold">Risk Score</h3>
              </div>
              <div className="text-right text-xs text-gray-400">
                <p>Updated:</p>
                <p>Just Now</p>
              </div>
            </div>

            {/* Risk Score Bar */}
            <div className="mb-2">
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-red-500 via-orange-400 to-green-500" style={{ width: '30%' }} />
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Low Risk</span>
              <span>High Risk</span>
            </div>
          </div>

          {/* Top Assets Section */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">Top Assets</h4>
              <button className="text-sm text-gray-400 hover:text-white">View All</button>
            </div>

            {/* Asset Cards Grid */}
            <div className="grid grid-cols-2 gap-3 overflow-y-auto flex-1 pr-2">
              {topAssets.map((asset, idx) => {
                const isPositiveChange = asset.change24h >= 0
                
                return (
                  <div 
                    key={idx} 
                    className={`rounded-xl p-4 transition-all hover:scale-[1.02] ${
                      asset.isLargeCard 
                        ? 'col-span-2 bg-gradient-to-br from-red-500 to-red-600' 
                        : 'bg-[#252525]'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                          {asset.icon.startsWith('http') ? (
                            <img src={asset.icon} alt={asset.symbol} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl">{asset.icon}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold">{asset.symbol}</p>
                          <p className="text-xs text-gray-400">{asset.name}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-2xl font-bold">
                        {asset.amount > 0.01 
                          ? asset.amount.toFixed(2) 
                          : asset.amount.toFixed(6)}
                      </p>
                      <p className="text-sm text-gray-400">
                        ${asset.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <div className={`flex items-center gap-1 text-xs font-semibold ${
                        isPositiveChange ? 'text-green-400' : 'text-red-400'
                      }`}>
                        <span>⊙</span>
                        <span>{isPositiveChange ? '+' : ''}{(asset.change24h * 100).toFixed(2)}%</span>
                      </div>
                    </div>

                    {/* Mini chart for the large card */}
                    {asset.isLargeCard && (
                      <div className="mt-4 h-20 opacity-60">
                        <div className="flex items-end justify-between h-full gap-[2px]">
                          {Array.from({ length: 40 }).map((_, i) => (
                            <div
                              key={i}
                              className="flex-1 bg-white/40 rounded-t-sm"
                              style={{
                                height: `${Math.random() * 100}%`,
                                minHeight: '20%'
                              }}
                            />
                          ))}
                        </div>
                        {/* Line overlay */}
                        <svg className="w-full h-16 -mt-16" viewBox="0 0 100 50" preserveAspectRatio="none">
                          <polyline
                            fill="none"
                            stroke="rgba(255,255,255,0.8)"
                            strokeWidth="1.5"
                            points={Array.from({ length: 20 }, (_, i) => `${i * 5},${25 + Math.sin(i) * 15}`).join(' ')}
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
