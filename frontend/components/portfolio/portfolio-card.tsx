'use client'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { PortfolioData } from "./types"
import UnifiedWalletCard from "./unified-wallet-card"
import { RefreshCw, Share2 } from "lucide-react"

// Add TimePeriod type
export type TimePeriod = '1h' | '8h' | '1d' | '1w' | '1m' | '6m' | '1y'

interface PortfolioCardProps {
  portfolio: PortfolioData
  positions: any[]
  chartData: any
  
  // NEW: Period selector props
  selectedPeriod?: TimePeriod
  isLoadingChart?: boolean
  onPeriodChange?: (period: TimePeriod) => void
  
  // Existing props
  onShare: () => void
  onRefresh: () => void
  loading: boolean
  refreshing: boolean
}

export default function PortfolioCard({ 
  portfolio, 
  positions, 
  chartData, 
  selectedPeriod = '1d', // Default period
  isLoadingChart = false,
  onPeriodChange,
  onShare, 
  onRefresh, 
  loading, 
  refreshing 
}: PortfolioCardProps) {
  return (
    <div className="min-h-screen bg-white] p-4 md:p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* Header with Action Buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-4 mb-6 pt-10">
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
              className="gap-2 text-white cursor-pointer font-bold bg-[#004aad] hover:bg-[#003d8f] transition-all duration-300 disabled:opacity-50"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>
        </div>

        {/* Main Unified Card */}
        <UnifiedWalletCard
          totalValue={portfolio?.total_value}
          pnlPercentage={portfolio?.pnl_percentage / 100} // Convert to decimal (e.g., -1.14 → -0.0114)
          positions={positions.map(pos => ({
            token_symbol: pos.symbol,
            symbol: pos.symbol,
            name: pos.name,
            amount: parseFloat(pos.quantity || '0'),
            quantity: parseFloat(pos.quantity || '0'),
            value: pos.value,
            realized_pl: 0,
            unrealized_pl: pos.changes?.absolute_1d || 0,
            changes: {
              absolute_1d: pos.changes?.absolute_1d || 0,
              percent_1d: (pos.changes?.percent_1d || 0) / 100 // Convert to decimal
            },
            icon_url: pos.icon_url,
            icon: pos.icon_url
          }))}
          chartData={chartData}
          selectedPeriod={selectedPeriod} // NEW: Pass selected period
          isLoadingChart={isLoadingChart} // NEW: Pass chart loading state
          onPeriodChange={onPeriodChange} // NEW: Pass period change handler
          onRefresh={onRefresh}
          onShare={onShare}
        />

        {/* Footer */}
        {portfolio?.snapshot_timestamp && (
          <div className="text-center mt-8">
            <p className="text-xs text-gray-500">
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
    </div>
  )
}