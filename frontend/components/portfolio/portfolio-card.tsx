'use client'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { PortfolioData } from "./types"
import PortfolioValue from "./portfolio-value"
import BalanceChart from "./balance-chart"
import TopAssetsList from "./top-asset-list"
import PortfolioPerformance from "./portfolio-performance"
import AssetAllocation from "./asset-allocation"
import AssetCards from "./asset-card"
import PortfolioMetrics from "./portfolio-metrics"
import TopMovers from "./top-movers"
import QuickStats from "./quick-stats"
import { RefreshCw, Share2 } from "lucide-react"

interface PortfolioCardProps {
  portfolio: PortfolioData
  positions: any[]
  chartData: any
  onShare: () => void
  onRefresh: () => void
  loading: boolean
  refreshing: boolean
}

export default function PortfolioCard({ 
  portfolio, 
  positions, 
  chartData, 
  onShare, 
  onRefresh, 
  loading, 
  refreshing 
}: PortfolioCardProps) {
  const cardClasses = "bg-white border-blue-500 border-2 p-5 shadow-xl shadow-neutral-950"

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <Button
            onClick={onRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-slate-700/50 hover:border-blue-500/50 hover:bg-slate-800 text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>

          <Button
            variant="default"
            onClick={onShare}
            disabled={loading}
            className="gap-2 text-white bg-blue-500 font-bold cursor-pointer hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Share2 className="w-4 h-4" />
            Share Portfolio
          </Button>
        </div>

        {/* Top Row - Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* 1. Total Portfolio Value Card */}
          <div className={`${cardClasses} md:col-span-4`}>
            <PortfolioValue
              totalValue={portfolio?.total_value}
              pnlPercentage={portfolio?.pnl_percentage}
              positions={positions}
            />
          </div>

          {/* 4. Portfolio Performance Card */}
          <div className={`${cardClasses} md:col-span-3`}>
            <PortfolioPerformance positions={positions} />
          </div>

          {/* 9. Quick Stats Card */}
          <div className={`${cardClasses} md:col-span-2`}>
            <QuickStats portfolio={portfolio} />
          </div>

          {/* 7. Portfolio Metrics Card */}
          <div className={`${cardClasses} md:col-span-3`}>
            <PortfolioMetrics portfolio={portfolio} positions={positions} />
          </div>
        </div>

        {/* Second Row - Charts */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* 2. Balance Chart Card */}
          <div className={`${cardClasses} md:col-span-8`}>
            <BalanceChart chartData={chartData} />
          </div>

          {/* 5. Asset Allocation Card */}
          <div className={`${cardClasses} md:col-span-4`}>
            <AssetAllocation positions={positions} totalValue={portfolio?.total_value} />
          </div>
        </div>

        {/* Third Row - Assets */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* 3. Top Assets Card (Table) */}
          <div className={`${cardClasses} md:col-span-8`}>
            <TopAssetsList positions={positions} />
          </div>

          {/* 8. Top Movers Card */}
          <div className={`${cardClasses} md:col-span-4`}>
            <TopMovers positions={positions} />
          </div>
        </div>

        {/* Fourth Row - Individual Asset Cards */}
        <div className={cardClasses}>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Your Assets</h3>
          <AssetCards positions={positions} />
        </div>

        {/* Footer */}
        {portfolio?.snapshot_timestamp && (
          <div className="text-center py-4">
            <p className="text-xs text-gray-400">
              Last updated: {new Date(portfolio.snapshot_timestamp).toLocaleString(undefined, {
                hour12: true,
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        )}

      </div>
    </div>
  )
}