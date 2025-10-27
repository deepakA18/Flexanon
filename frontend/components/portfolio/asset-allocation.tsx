'use client'

import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { PieChart as PieChartIcon } from 'lucide-react'

interface Position {
  symbol?: string
  name?: string
  value?: number
  icon_url?: string
}

interface AssetAllocationProps {
  positions?: Position[]
  totalValue?: number
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899', '#14b8a6']

export default function AssetAllocation({ positions = [], totalValue = 0 }: AssetAllocationProps) {
  // Safe array check
  const safePositions = Array.isArray(positions) ? positions : []
  const safeTotalValue = totalValue || 0

  // Calculate chart data with safe math
  const chartData = safePositions
    .filter(p => (p?.value || 0) > 0) // Only include assets with value
    .map((position, index) => {
      const value = position?.value || 0
      const percentage = safeTotalValue > 0 ? (value / safeTotalValue) * 100 : 0
      
      return {
        name: position?.symbol || 'Unknown',
        value: value,
        percentage: percentage,
        color: COLORS[index % COLORS.length],
        icon_url: position?.icon_url
      }
    })

  // Handle empty data
  if (chartData.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <PieChartIcon className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900">Asset Allocation</h3>
        </div>
        <div className="h-[250px] flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <p className="text-gray-500 text-sm">No allocation data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <PieChartIcon className="w-4 h-4 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-900">Asset Allocation</h3>
      </div>

      {/* Pie Chart */}
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              fill="#8884d8"
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
              formatter={(value: any, name: any, props: any) => {
                const val = parseFloat(value)
                const pct = props?.payload?.percentage || 0
                if (isNaN(val)) return ['$0.00 (0.0%)', name]
                return [
                  `$${val.toFixed(2)} (${pct.toFixed(1)}%)`,
                  name
                ]
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="space-y-2 max-h-[120px] overflow-y-auto">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-gray-700 font-medium truncate">
                {item.name}
              </span>
            </div>
            <span className="text-gray-900 font-semibold ml-2">
              {item.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}