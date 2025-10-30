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
  
  // Sample every nth point based on period for better visualization
  const samplingRate = period === 'day' ? 12 : period === 'week' ? 24 : 48
  const data = points
    .filter((_, index) => index % samplingRate === 0)
    .map(([timestamp, value]) => ({
      time: new Date(timestamp * 1000).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      value,
      fullDate: new Date(timestamp * 1000)
    }))

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