'use client'

import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Shield, CheckCircle, Copy, AlertCircle, Clock, RefreshCw, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PortfolioValue from './portfolio-value'
import BalanceChart from './balance-chart'
import TopAssetsList from './top-asset-list'
import PortfolioPerformance from './portfolio-performance'
import AssetAllocation from './asset-allocation'
import AssetCards from './asset-card'
import PortfolioMetrics from './portfolio-metrics'
import TopMovers from './top-movers'
import QuickStats from './quick-stats'
import type { PortfolioData } from './types'

interface ShareablePortfolioProps {
  shareId: string
  apiBase?: string
}

export default function ShareablePortfolio({ 
  shareId, 
  apiBase = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/api' 
}: ShareablePortfolioProps) {
  const [committedData, setCommittedData] = useState<any>(null)
  const [liveData, setLiveData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [fetchingLive, setFetchingLive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showLiveData, setShowLiveData] = useState(false)
  const [isStale, setIsStale] = useState(false)
  const [dataAge, setDataAge] = useState({ hours: 0, minutes: 0, ageText: '' })

  // Same card classes as portfolio card
  const cardClasses = "bg-white border-blue-500 border-2 p-5 shadow-xl shadow-neutral-950"

  useEffect(() => {
    loadShareData()
  }, [shareId])

  const loadShareData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${apiBase}/share/resolve?token=${shareId}`)
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to load portfolio')
      }

      const data = await response.json()
      
      if (!data.success && data.error) {
        throw new Error(data.error)
      }

      setCommittedData(data)

      // Calculate age
      let commitmentMs = 0
      if (data.committed_at) {
        commitmentMs = new Date(data.committed_at).getTime()
      }
      
      const age = Date.now() - commitmentMs
      const hours = Math.floor(age / 3600000)
      const minutes = Math.floor((age % 3600000) / 60000)
      
      let ageText = ''
      if (hours > 0) {
        ageText = `${hours} hour${hours > 1 ? 's' : ''} ago`
      } else if (minutes > 0) {
        ageText = `${minutes} minute${minutes > 1 ? 's' : ''} ago`
      } else {
        ageText = 'just now'
      }

      setDataAge({ hours, minutes, ageText })

      const staleThreshold = 60000 // 1 minute for testing
      setIsStale(age > staleThreshold)

    } catch (e: any) {
      console.error('Error loading share data:', e)
      setError(e?.message || 'Failed to load portfolio')
    } finally {
      setLoading(false)
    }
  }

  const fetchLatestData = async () => {
    if (!committedData?.wallet_address) {
      toast.error('Cannot fetch latest data: wallet address is hidden for privacy')
      return
    }

    setFetchingLive(true)

    try {
      const response = await fetch(`${apiBase}/dev/test-zerion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: committedData.wallet_address })
      })

      const data = await response.json()
      
      if (!data.success || !data.portfolio) {
        throw new Error('Failed to fetch latest data')
      }

      setLiveData(data.portfolio)
      setShowLiveData(true)
      toast.success('Latest data fetched successfully!')

    } catch (e: any) {
      console.error('Error fetching latest data:', e)
      toast.error(e?.message || 'Failed to fetch latest data')
    } finally {
      setFetchingLive(false)
    }
  }

  const dismissLiveData = () => {
    setShowLiveData(false)
    setLiveData(null)
  }

  const copyLink = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    toast.success('Link copied to clipboard!')
  }

  const getChangeInfo = () => {
    if (!committedData?.revealed_data || !liveData) return null

    const committedValue = parseFloat(committedData.revealed_data.total_value?.replace(/[^0-9.-]+/g, '') || '0')
    const liveValue = liveData.total_value || 0
    const change = liveValue - committedValue
    const changePercent = committedValue > 0 ? ((change / committedValue) * 100) : 0

    return {
      change,
      changePercent,
      isPositive: change >= 0
    }
  }

  const getDisplayData = (source: 'committed' | 'live'): PortfolioData => {
    if (source === 'live' && liveData) {
      return {
        wallet_address: liveData.wallet_address || '',
        total_value: liveData.total_value || 0,
        pnl_percentage: liveData.pnl_percentage || 0,
        assets_count: liveData.assets?.length || 0,
        chain: liveData.chain || 'solana',
        snapshot_timestamp: Date.now(),
        assets: liveData.assets || []
      }
    } else if (committedData?.revealed_data) {
      return {
        wallet_address: committedData.wallet_address || '',
        total_value: parseFloat(committedData.revealed_data.total_value?.replace(/[^0-9.-]+/g, '') || '0'),
        pnl_percentage: parseFloat(committedData.revealed_data.pnl_percentage?.replace(/[^0-9.-]+/g, '') || '0') / 100,
        assets_count: committedData.revealed_data.total_assets_count || 0,
        chain: committedData.revealed_data.chain || 'solana',
        snapshot_timestamp: committedData.revealed_data.snapshot_time 
          ? new Date(committedData.revealed_data.snapshot_time).getTime() 
          : Date.now(),
        assets: committedData.revealed_data.top_assets || []
      }
    }
    return {
      wallet_address: '',
      total_value: 0,
      pnl_percentage: 0,
      assets_count: 0,
      chain: 'solana',
      snapshot_timestamp: Date.now(),
      assets: []
    }
  }

  const getPositions = (source: 'committed' | 'live') => {
    const data = getDisplayData(source)
    if (!data?.assets) return []

    return data.assets.map((asset: any, index: number) => ({
      position: index + 1,
      symbol: asset.symbol || 'UNKNOWN',
      name: asset.name || asset.symbol,
      quantity: asset.amount?.toString() || '0',
      price: parseFloat(asset.value_usd?.replace(/[^0-9.-]+/g, '') || '0') / parseFloat(asset.amount || '1'),
      value: parseFloat(asset.value_usd?.replace(/[^0-9.-]+/g, '') || '0'),
      icon_url: asset.icon_url,
      asset_code: asset.symbol,
      changes: {
        percent_1d: 0,
        absolute_1d: 0
      }
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium text-lg">Loading portfolio...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Oops!</h2>
          <p className="text-gray-600 text-lg">{error}</p>
        </div>
      </div>
    )
  }

  const committedPortfolio = getDisplayData('committed')
  const livePortfolio = getDisplayData('live')
  const committedPositions = getPositions('committed')
  const livePositions = getPositions('live')
  const changeInfo = getChangeInfo()

  const privacyScore = committedData?.privacy_score || committedData?.metadata?.privacy_score || 0
  const revealedCount = committedData?.revealed_count || committedData?.metadata?.revealed_count || 0
  const totalCount = committedData?.total_count || committedData?.metadata?.total_count || 0

  // Active portfolio and positions
  const activePortfolio = showLiveData ? livePortfolio : committedPortfolio
  console.log(activePortfolio)
  const activePositions = showLiveData ? livePositions : committedPositions

  // If showing live data, create chart data from live
  const chartData = showLiveData && liveData ? {
    chart_data: {
      attributes: {
        points: [] // Add live chart points if available
      }
    }
  } : null

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Header - Same as portfolio card but with verification badge */}
        <div className="flex items-center justify-between flex-wrap gap-4">
         
          
          <div className="flex items-center gap-3">
            <Button
              onClick={copyLink}
              variant="outline"
              className="gap-2 border-blue-500 text-blue-500 hover:bg-blue-50"
            >
              <Copy className="w-4 h-4" />
              Copy Link
            </Button>
          </div>
        </div>

        {/* Stale Data Banner */}
        {isStale && !showLiveData && (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <p className="text-primary font-semibold text-sm">
                   This data was verified {dataAge.ageText} and committed to the Solana blockchain.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Live Data Banner */}
        {showLiveData && liveData && (
          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-700" />
                <p className="text-blue-800 font-semibold text-sm">
                  ⚠️ Showing live data (unverified). This has NOT been committed on-chain.
                </p>
              </div>
              {changeInfo && Math.abs(changeInfo.change) > 0.01 && (
                <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                  changeInfo.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {changeInfo.isPositive ? '+' : ''}${changeInfo.change.toFixed(2)} 
                  ({changeInfo.isPositive ? '+' : ''}{changeInfo.changePercent.toFixed(2)}%)
                </div>
              )}
              <Button
                onClick={dismissLiveData}
                variant="outline"
                size="sm"
                className="text-blue-700 border-blue-300"
              >
                Show Committed Data
              </Button>
            </div>
          </div>
        )}

        {/* Privacy Notice */}
        

        {/* Top Row - Key Metrics (EXACT SAME AS PORTFOLIO CARD) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* 1. Total Portfolio Value Card */}
          <div className={`$ md:col-span-4`}>
            <PortfolioValue
              totalValue={activePortfolio.total_value}
              pnlPercentage={activePortfolio.pnl_percentage}
              positions={activePositions}
            />
          </div>

          {/* 4. Portfolio Performance Card */}
          <div className={` md:col-span-4`}>
            <PortfolioPerformance positions={activePositions} />
          </div>

          {/* 9. Quick Stats Card */}
          <div className={` md:col-span-4`}>
            <QuickStats portfolio={activePortfolio} />
          </div>
        </div>

        {/* Second Row - Charts (EXACT SAME AS PORTFOLIO CARD) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          <div className={` md:col-span-4`}>
            <PortfolioMetrics 
              portfolio={activePortfolio} 
              positions={activePositions} 
            />
          </div>
          {/* 5. Asset Allocation Card */}
          <div className={` md:col-span-4`}>
            <AssetAllocation 
              positions={activePositions} 
              totalValue={activePortfolio.total_value} 
            />
          </div>
          <div className={` md:col-span-4`}>
            <TopMovers positions={activePositions} />
          </div>
        </div>

        {/* Third Row - Assets (EXACT SAME AS PORTFOLIO CARD) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* 3. Top Assets Card (Table) */}
          <div className={` md:col-span-12`}>
            <TopAssetsList positions={activePositions} />
          </div>
        </div>

        {/* Footer (EXACT SAME AS PORTFOLIO CARD) */}
        {(committedPortfolio?.snapshot_timestamp || committedData?.committed_at) && (
          <div className="text-center py-4 space-y-2">
            <p className="text-xs text-gray-900">
              {showLiveData ? (
                <>Live data fetched just now</>
              ) : (
                <>
                  Committed on-chain: {new Date(committedData.committed_at).toLocaleString(undefined, { 
                    hour12: true,
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })} ({dataAge.ageText})
                </>
              )}
            </p>
          </div>
        )}

      </div>
    </div>
  )
}