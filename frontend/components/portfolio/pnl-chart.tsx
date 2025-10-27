'use client'

import React from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface PnlChartProps {
    data: { timestamp: string; totalValue: number; pnl: number }[]
}

export default function PnlChart({ data }: PnlChartProps) {
    return (
        <div className="w-full h-40 bg-neutral-900/30 rounded-xl backdrop-blur-md p-2">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    {/* X Axis */}
                    <XAxis
                        dataKey="timestamp"
                        tickFormatter={(val) => new Date(val).toLocaleDateString()}
                        stroke="#888888"
                        tickLine={false}
                        axisLine={false}
                        fontSize={12}
                    />

                    {/* Y Axis */}
                    <YAxis
                        domain={['auto', 'auto']}
                        tickFormatter={(val) => `$${val.toLocaleString()}`}
                        stroke="#888888"
                        tickLine={false}
                        axisLine={false}
                        fontSize={12}
                    />

                    {/* Tooltip */}
                    <Tooltip
                        contentStyle={{
                            background: 'rgba(20, 20, 20, 0.9)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '0.5rem',
                        }}
                        itemStyle={{ color: '#fff' }}
                        labelStyle={{ color: '#aaa' }}
                    />

                    {/* Total Value Line */}
                    <Line
                        type="monotone"
                        dataKey="totalValue"
                        stroke="url(#totalGradient)"
                        strokeWidth={2}
                        dot={{ r: 3, stroke: '#fff', strokeWidth: 1, fill: 'transparent' }}
                        activeDot={{ r: 5, fill: '#fff' }}
                    />

                    {/* PnL Line */}
                    <Line
                        type="monotone"
                        dataKey="pnl"
                        stroke="url(#pnlGradient)"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 5, fill: '#10B981' }}
                    />

                    {/* Gradients */}
                    <defs>
                        <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#aaaaaa" stopOpacity={0.2} />
                        </linearGradient>
                        <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#047857" stopOpacity={0.2} />
                        </linearGradient>
                    </defs>
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}
