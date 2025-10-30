'use client'

import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Shield, AlertCircle, RefreshCw, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import UnifiedWalletCard from './unified-wallet-card'
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
  const [dataAge, setDataAge] = useState({ hours: 0, minutes: 0, ageText: '' })

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
      amount: parseFloat(asset.amount || '0'),
      price: parseFloat(asset.value_usd?.replace(/[^0-9.-]+/g, '') || '0') / parseFloat(asset.amount || '1'),
      value: parseFloat(asset.value_usd?.replace(/[^0-9.-]+/g, '') || '0'),
      icon_url: asset.icon_url,
      icon: asset.icon_url,
      asset_code: asset.symbol,
      token_symbol: asset.symbol,
      changes: {
        percent_1d: parseFloat(asset.change_24h || '0'),
        absolute_1d: 0
      }
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-[#004aad] border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium text-lg">Loading portfolio...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white">
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

  const activePortfolio = showLiveData ? livePortfolio : committedPortfolio
  const activePositions = showLiveData ? livePositions : committedPositions

  // Chart data should come from the committed/revealed data stored when share link was created
  // We cannot fetch it live because wallet address is hidden for privacy
  const chartData = showLiveData 
    ? liveData?.chart_data
    : (committedData?.revealed_data?.chart_data || committedData?.chart_data)

  console.log('Chart data available:', !!chartData)
  if (!chartData) {
    console.warn('No chart data found. Chart data must be stored when creating the share link.')
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-[1800px] mx-auto space-y-6">
        
        {/* Minimal Header - Share button only */}
        <div className="flex items-center justify-end">
          <Button
            onClick={copyLink}
            variant="outline"
            size="sm"
            className="gap-2 border-gray-300 text-gray-700 hover:bg-white hover:shadow-sm bg-white/80 backdrop-blur-sm"
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </div>

        {/* Compact Verification Badge */}
        {!showLiveData && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-3 shadow-sm">
            <div className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2 flex-1">
                <Shield className="w-4 h-4 text-green-600 flex-shrink-0" />
                <p className="text-green-800 font-medium text-sm">
                  ✓ Verified on Solana • {dataAge.ageText}
                </p>
              </div>
              {committedData?.wallet_address && (
                <Button
                  onClick={fetchLatestData}
                  disabled={fetchingLive}
                  variant="ghost"
                  size="sm"
                  className="text-green-700 hover:text-green-800 hover:bg-green-100 text-xs h-7 px-3 flex-shrink-0"
                >
                  {fetchingLive ? (
                    <>
                      <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3 h-3 mr-1.5" />
                      Refresh
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Live Data Indicator */}
        {showLiveData && liveData && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-3 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <p className="text-amber-800 font-medium text-sm">
                  Live data (unverified)
                </p>
                {changeInfo && Math.abs(changeInfo.change) > 0.01 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    changeInfo.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {changeInfo.isPositive ? '+' : ''}${changeInfo.change.toFixed(2)}
                  </span>
                )}
              </div>
              <Button
                onClick={dismissLiveData}
                variant="ghost"
                size="sm"
                className="text-amber-700 hover:text-amber-800 hover:bg-amber-100 text-xs h-7 px-3"
              >
                Show Verified
              </Button>
            </div>
          </div>
        )}

        {/* Main Unified Card */}
        <div className="w-full">
          <UnifiedWalletCard
            totalValue={activePortfolio.total_value}
            pnlPercentage={activePortfolio.pnl_percentage}
            positions={activePositions}
            chartData={chartData}
          />
        </div>

        {/* Minimal Footer */}
        <div className="text-center pb-4 space-y-1">
          <p className="text-xs text-gray-500">
            {showLiveData ? (
              <>Live data • Updated just now</>
            ) : (
              <>
                Verified on {new Date(committedData.committed_at).toLocaleDateString('en-US', { 
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })} at {new Date(committedData.committed_at).toLocaleTimeString('en-US', { 
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </>
            )}
          </p>
          <p className="text-xs text-gray-400">
            Powered by FlexAnon • Zero-Knowledge Portfolio Sharing
          </p>
        </div>

      </div>
    </div>
  )
}