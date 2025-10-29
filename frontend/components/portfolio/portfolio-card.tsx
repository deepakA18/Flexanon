'use client'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
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
import { useState } from "react"

interface PortfolioCardProps {
  portfolio: PortfolioData
  positions: any[]
  chartData: any
  onShare: () => void
  onRefresh: () => void
  loading: boolean
  refreshing: boolean
}

type ExpandedCard = 'portfolio-value' | 'performance' | 'chart' | 'assets-list' | 'quick-stats' | 'metrics' | 'allocation' | 'movers' | 'asset-cards' | null

export default function PortfolioCard({ 
  portfolio, 
  positions, 
  chartData, 
  onShare, 
  onRefresh, 
  loading, 
  refreshing 
}: PortfolioCardProps) {
  const [expandedCard, setExpandedCard] = useState<ExpandedCard>(null)

  const cardHoverClass = "transition-all duration-300  hover:scale-[1.02] hover:border-blue-400 cursor-pointer"

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto space-y-4">

        {/* Header */}
        <div className="flex flex-col pt-10 sm:flex-row items-start sm:items-center justify-end gap-4 mb-6">
          {/* <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary mb-1">Portfolio Dashboard</h1>
            <p className="text-xs md:text-sm text-primary">Track and manage your crypto assets</p>
          </div> */}
          
          <div className="flex items-center gap-5">
            <Button
              onClick={onRefresh}
              disabled={refreshing}
              variant="outline"
              size="lg"
              className="bg-white text-primary cursor-pointer font-bold hover:bg-gray-50 gap-2 border-gray-200 transition-all duration-300 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>

            <Button
              variant="default"
              onClick={onShare}
              disabled={loading}
              size="lg"
              className="gap-2 text-white cursor-pointer font-bold bg-blue-600 hover:bg-blue-700  transition-all duration-300 disabled:opacity-50"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          
          {/* Left Column - Main Content */}
          <div className="xl:col-span-9 space-y-4">
            
            {/* Top Row: Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div onClick={() => setExpandedCard('portfolio-value')} className={cardHoverClass}>
                <PortfolioValue
                  totalValue={portfolio?.total_value}
                  pnlPercentage={portfolio?.pnl_percentage}
                  positions={positions}
                />
              </div>
              <div onClick={() => setExpandedCard('performance')} className={cardHoverClass}>
                <AssetAllocation positions={positions} totalValue={portfolio?.total_value} />
                
              </div>
            </div>

            {/* Balance Chart */}
            <div onClick={() => setExpandedCard('chart')} className={cardHoverClass}>
              <BalanceChart chartData={chartData} />
            </div>

            {/* Top Assets Table */}
            <div onClick={() => setExpandedCard('assets-list')} className={cardHoverClass}>
              <TopAssetsList positions={positions} />
            </div>

            {/* Asset Cards Grid */}
            <div onClick={() => setExpandedCard('asset-cards')} className={cardHoverClass}>
              <Card className="bg-white">
                <CardContent className="p-4">
                  <h3 className="text-base font-bold mb-3 flex items-center gap-2 text-primary">
                    <span className="w-1 h-5 bg-primary rounded"></span>
                    Your Assets
                  </h3>
                  <AssetCards positions={positions} />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="xl:col-span-3 space-y-4">
            
            {/* Quick Stats */}
            <div onClick={() => setExpandedCard('quick-stats')} className={cardHoverClass}>
              <QuickStats portfolio={portfolio} />
            </div>

            {/* Portfolio Metrics */}
            <div onClick={() => setExpandedCard('metrics')} className={cardHoverClass}>
              <PortfolioMetrics portfolio={portfolio} positions={positions} />
            </div>

            {/* Asset Allocation */}
            <div onClick={() => setExpandedCard('allocation')} className={cardHoverClass}>
             <PortfolioPerformance positions={positions} />
            </div>

            {/* Top Movers */}
            <div onClick={() => setExpandedCard('movers')} className={cardHoverClass}>
              <TopMovers positions={positions} />
            </div>
          </div>
        </div>

        {/* Footer */}
        {portfolio?.snapshot_timestamp && (
          
           
              <div className="text-center">
                <p className="text-xs text-gray-500 mt-20">
                  Last updated: {new Date(portfolio.snapshot_timestamp).toLocaleString(undefined, {
                    hour12: true,
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
          
        )}

      </div>

      {/* Expanded Card Dialogs */}
      <Dialog open={expandedCard === 'portfolio-value'} onOpenChange={() => setExpandedCard(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] border-none overflow-auto [&>button]:hidden">
          <PortfolioValue
            totalValue={portfolio?.total_value}
            pnlPercentage={portfolio?.pnl_percentage}
            positions={positions}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={expandedCard === 'performance'} onOpenChange={() => setExpandedCard(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto border-none [&>button]:hidden">
          <PortfolioPerformance positions={positions} />
        </DialogContent>
      </Dialog>

      <Dialog open={expandedCard === 'chart'} onOpenChange={() => setExpandedCard(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto border-none [&>button]:hidden">
          <BalanceChart chartData={chartData} />
        </DialogContent>
      </Dialog>

      <Dialog open={expandedCard === 'assets-list'} onOpenChange={() => setExpandedCard(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto border-none [&>button]:hidden">
          <TopAssetsList positions={positions} />
        </DialogContent>
      </Dialog>


      <Dialog open={expandedCard === 'quick-stats'} onOpenChange={() => setExpandedCard(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh]  border-none overflow-auto [&>button]:hidden">
          <QuickStats portfolio={portfolio} />
        </DialogContent>
      </Dialog>

      <Dialog open={expandedCard === 'metrics'} onOpenChange={() => setExpandedCard(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] border-none overflow-auto [&>button]:hidden">
          <PortfolioMetrics portfolio={portfolio} positions={positions} />
        </DialogContent>
      </Dialog>

      <Dialog open={expandedCard === 'allocation'} onOpenChange={() => setExpandedCard(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto border-none [&>button]:hidden">
          <AssetAllocation positions={positions} totalValue={portfolio?.total_value} />
        </DialogContent>
      </Dialog>

      <Dialog open={expandedCard === 'movers'} onOpenChange={() => setExpandedCard(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto border-none [&>button]:hidden">
          <TopMovers positions={positions} />
        </DialogContent>
      </Dialog>
    </div>
  )
}