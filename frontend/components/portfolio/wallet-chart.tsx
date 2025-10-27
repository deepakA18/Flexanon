"use client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface WalletChartData {
  chart_data: {
    attributes: {
      points: [number, number][]
    }
  }
}

interface Props {
  points: WalletChartData
}

export default function WalletChart({ points }: Props) {
  const data = points.chart_data.attributes.points.map(([timestamp, value]) => ({
    time: new Date(timestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    value,
  }))

  const maxValue = Math.max(...data.map((d) => d.value))
  const minValue = Math.min(...data.map((d) => d.value))
  const avgValue = data.reduce((sum, d) => sum + d.value, 0) / data.length

  const getBarColor = (value: number) => {
    const ratio = value / maxValue
    if (ratio > 0.75) return "#10b981" // emerald
    if (ratio > 0.5) return "#3b82f6" // blue
    if (ratio > 0.25) return "#8b5cf6" // purple
    return "#6b7280" // gray
  }

  return (
    <div className="w-full bg-white rounded-lg">
      {/* Chart */}
      <div className="rounded-lg p-2">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
            barCategoryGap="15%"
          >
            <CartesianGrid stroke="#e5e7eb" vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              tick={{ fill: "#6b7280", fontSize: 12 }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={false}
              interval={Math.floor(data.length / 8)}
            />
            <YAxis
              domain={[0, Math.ceil(maxValue * 1.1)]}
              tick={{ fill: "#6b7280", fontSize: 12 }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={false}
              width={50}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: "#ffffff", 
                border: "1px solid #e5e7eb", 
                borderRadius: "0.5rem",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
              }}
              labelStyle={{ color: "#374151", fontWeight: 600 }}
              formatter={(value: any) => [`$${value.toFixed(2)}`, "Balance"]}
              cursor={{ fill: "rgba(16, 185, 129, 0.05)" }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.value)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
          <p className="text-xs text-emerald-700 font-medium mb-1">Highest</p>
          <p className="text-lg font-bold text-emerald-900">${maxValue.toFixed(2)}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-xs text-blue-700 font-medium mb-1">Average</p>
          <p className="text-lg font-bold text-blue-900">${avgValue.toFixed(2)}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-700 font-medium mb-1">Lowest</p>
          <p className="text-lg font-bold text-gray-900">${minValue.toFixed(2)}</p>
        </div>
      </div>
    </div>
  )
}