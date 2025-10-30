'use client'

import React, { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface BalanceChartProps {
  chartData?: {
    chart_data?: {
      attributes?: {
        points?: [number, number][]
        begin_at?: string
        end_at?: string
      }
    }
  }
}

type Period = 'day' | 'week' | 'month' | 'year'

export default function BalanceChart({ chartData }: BalanceChartProps) {
  const [period, setPeriod] = useState<Period>('day')

  const points = chartData?.chart_data?.attributes?.points || []
  const endAt = chartData?.chart_data?.attributes?.end_at
  
  // Filter points based on selected period
  const getFilteredPoints = () => {
    if (!endAt || points.length === 0) return points

    const endDate = new Date(endAt)
    const periodInMs = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      year: 365 * 24 * 60 * 60 * 1000
    }

    const startTime = (endDate.getTime() - periodInMs[period]) / 1000

    return points.filter(([timestamp]) => timestamp >= startTime)
  }

  const filteredPoints = getFilteredPoints()
  
  // Sample points for better visualization
  const samplingRate = period === 'day' ? 1 : period === 'week' ? 4 : period === 'month' ? 12 : 24
  const data = filteredPoints
    .filter((_, index) => index % samplingRate === 0)
    .map(([timestamp, value]) => {
      const date = new Date(timestamp * 1000)
      return {
        time: period === 'day' 
          ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : period === 'week'
          ? date.toLocaleDateString([], { month: 'short', day: 'numeric' })
          : period === 'month'
          ? date.toLocaleDateString([], { month: 'short', day: 'numeric' })
          : date.toLocaleDateString([], { month: 'short', year: 'numeric' }),
        value,
        fullDate: date
      }
    })

  const periods: Period[] = ['day', 'week', 'month', 'year']

  return (
    <Card className='bg-white'>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-primary">
            <TrendingUp className="w-4 h-4" />
            <span className="text-lg font-semibold">Balance Chart</span>
          </CardTitle>

          {/* Period Selector */}
          <div 
            className="flex gap-1 bg-gray-100 text-primary rounded-lg p-1"
            onClick={(e) => e.stopPropagation()}
          >
            {periods.map((p) => (
              <Button
                key={p}
                onClick={() => setPeriod(p)}
                variant={period === p ? 'default' : 'ghost'}
                size="sm"
                className={`capitalize text-xs px-3 py-1 h-8 hover:bg-white ${
                  period === p 
                    ? 'bg-white shadow-sm text-primary' 
                    : 'hover:bg-white/50'
                }`}
              >
                {p}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Chart */}
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#004aad" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#004aad" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis 
                dataKey="time" 
                tick={{ fill: '#6b7280', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                tick={{ fill: '#6b7280', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) => `$${value.toFixed(2)}`}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                labelStyle={{ color: '#374151', fontWeight: 600, fontSize: 12 }}
                formatter={(value: any) => [`$${value.toFixed(4)}`, 'Balance']}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#004AAD" 
                strokeWidth={2}
                fill="url(#colorValue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}