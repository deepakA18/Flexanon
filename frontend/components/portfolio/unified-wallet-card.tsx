'use client'

import React from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, SlidersHorizontal, Camera, Download, Share2, Copy } from 'lucide-react'
import AssetAllocation from './asset-allocation'
import Image from 'next/image'
import { ScrollArea } from '../ui/scroll-area'
import { toPng } from 'html-to-image' 
import { logoAbstract } from '@/public'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// ============================================================================
// Type Definitions
// ============================================================================

export type TimePeriod = '1h' | '8h' | '1d' | '1w' | '1m' | '6m' | '1y'

interface ChartData {
  chart_data?: {
    attributes?: {
      points?: [number, number][]
    }
  }
}

interface PositionChanges {
  absolute_1d?: number
  percent_1d?: number
}

interface Position {
  token_symbol?: string
  symbol?: string
  name?: string
  amount?: number
  quantity?: number
  value?: number
  realized_pl?: number
  unrealized_pl?: number
  changes?: PositionChanges
  icon_url?: string
  icon?: string
}

interface ProcessedChartDataPoint {
  time: string
  value: number
  fullDate: Date
}

interface TopAsset {
  symbol: string
  name: string
  amount: number
  value: number
  change24h: number
  icon: string
  isLargeCard: boolean
}

interface MetricsData {
  netChange: number
  netChangePercent: number
  totalValue: number
}

export interface UnifiedWalletCardProps {
  totalValue?: number
  pnlPercentage?: number
  positions?: Position[]
  chartData?: ChartData
  selectedPeriod?: TimePeriod
  isLoadingChart?: boolean
  onRefresh?: () => void
  onShare?: () => void
  onAddAsset?: () => void
  onFilter?: () => void
  onScreenshot?: () => void
  onPeriodChange?: (period: TimePeriod) => void
}

// ============================================================================
// Helper Functions
// ============================================================================

const toNumber = (value: any): number => {
  const num = Number(value)
  return isNaN(num) ? 0 : num
}

const processChartData = (
  chartData?: ChartData,
  samplingRate: number = 12
): ProcessedChartDataPoint[] => {
  const points = chartData?.chart_data?.attributes?.points || []
  
  if (points.length === 0) {
    return []
  }

  return points
    .filter((_, index) => index % samplingRate === 0)
    .map(([timestamp, value]) => ({
      time: new Date(timestamp * 1000).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      value: toNumber(value),
      fullDate: new Date(timestamp * 1000)
    }))
}

const calculateMetrics = (positions: Position[], totalValue: number): MetricsData => {
  const netChange = positions.reduce(
    (sum, p) => sum + toNumber(p?.changes?.absolute_1d),
    0
  )
  const previousValue = totalValue - netChange
  const netChangePercent = previousValue !== 0 ? (netChange / previousValue) * 100 : 0

  return {
    netChange,
    netChangePercent,
    totalValue
  }
}

const getTopAssets = (positions: Position[], limit: number = 5): TopAsset[] => {
  return [...positions]
    .sort((a, b) => toNumber(b?.value) - toNumber(a?.value))
    .slice(0, limit)
    .map((asset, idx) => ({
      symbol: asset?.token_symbol || asset?.symbol || 'UNKNOWN',
      name: asset?.name || asset?.token_symbol || 'Unknown Token',
      amount: toNumber(asset?.amount || asset?.quantity),
      value: toNumber(asset?.value),
      change24h: toNumber(asset?.changes?.percent_1d),
      icon: asset?.icon_url || asset?.icon || '💰',
      isLargeCard: idx === 2
    }))
}

const formatCurrency = (value: number, decimals: number = 2): string => {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

const formatPercentage = (value: number, decimals: number = 3): string => {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(decimals)}%`
}

const calculateRiskScore = (positions: Position[]): number => {
  if (positions.length === 0) return 0
  
  const totalValue = positions.reduce((sum, p) => sum + toNumber(p?.value), 0)
  if (totalValue === 0) return 0
  
  const concentration = positions.reduce((max, p) => {
    const percentage = (toNumber(p?.value) / totalValue) * 100
    return Math.max(max, percentage)
  }, 0)
  
  const avgVolatility = positions.reduce((sum, p) => {
    return sum + Math.abs(toNumber(p?.changes?.percent_1d))
  }, 0) / positions.length
  
  const riskScore = Math.min(100, (concentration * 0.6) + (avgVolatility * 0.4))
  
  return riskScore
}

// ============================================================================
// Screenshot Utilities (UPDATED)
// ============================================================================

const captureElement = async (element: HTMLElement): Promise<string> => {
  try {
    const dataUrl = await toPng(element, {
      quality: 1.0,
      pixelRatio: 2, // 2x for high quality
      cacheBust: true,
      style: {
        transform: 'scale(1)',
        transformOrigin: 'top left',
      },
      // Filter out problematic elements
      filter: (node) => {
        // Exclude certain elements if needed
        return node.tagName !== 'IFRAME'
      }
    })
    return dataUrl
  } catch (error) {
    console.error('Screenshot capture failed:', error)
    throw error
  }
}

const downloadImage = (dataUrl: string, filename: string) => {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const copyImageToClipboard = async (dataUrl: string): Promise<boolean> => {
  try {
    const blob = await (await fetch(dataUrl)).blob()
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ])
    return true
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}

const shareToTwitter = (totalValue: number, pnlPercentage: number) => {
  const isPositive = pnlPercentage >= 0
  const emoji = isPositive ? '📈' : '📉'
  const text = `${emoji} My portfolio: $${formatCurrency(totalValue)} (${formatPercentage(pnlPercentage * 100)}) via @FlexAnon`
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
  window.open(twitterUrl, '_blank', 'width=550,height=420')
}

// ============================================================================
// Main Component
// ============================================================================

export default function UnifiedWalletCard({ 
  totalValue = 0, 
  pnlPercentage = 0, 
  positions = [],
  chartData,
  selectedPeriod = '1d',
  isLoadingChart = false,
  onAddAsset,
  onFilter,
  onScreenshot,
  onPeriodChange
}: UnifiedWalletCardProps) {
  const [isCapturing, setIsCapturing] = React.useState(false)
  const isPositive = pnlPercentage >= 0
  const processedChartData = React.useMemo(
    () => processChartData(chartData),
    [chartData]
  )
  const metrics = React.useMemo(
    () => calculateMetrics(positions, totalValue),
    [positions, totalValue]
  )
  const topAssets = React.useMemo(
    () => getTopAssets(positions, 5),
    [positions]
  )
  const riskScore = React.useMemo(
    () => calculateRiskScore(positions),
    [positions]
  )

  const periods: TimePeriod[] = ['1h', '1d', '1w', '1m', '1y']

  const handlePeriodClick = (period: TimePeriod) => {
    if (onPeriodChange) {
      onPeriodChange(period)
    }
  }

  const cardRef = React.useRef<HTMLDivElement>(null)

  const handleScreenshot = async (action: 'download' | 'copy' | 'twitter') => {
    if (!cardRef.current) return
    
    setIsCapturing(true)
    toast.info('Capturing screenshot...', { duration: 1000 })
    
    try {
      const dataUrl = await captureElement(cardRef.current)
      
      switch (action) {
        case 'download':
          const timestamp = new Date().toISOString().split('T')[0]
          downloadImage(dataUrl, `flexanon-portfolio-${timestamp}.png`)
          toast.success('Screenshot downloaded!')
          break
          
        case 'copy':
          const copied = await copyImageToClipboard(dataUrl)
          if (copied) {
            toast.success('Screenshot copied to clipboard!')
          } else {
            // Fallback: download if copy fails
            downloadImage(dataUrl, `flexanon-portfolio-${Date.now()}.png`)
            toast.info('Downloaded instead (clipboard not supported)')
          }
          break
          
        case 'twitter':
          // First download the image
          downloadImage(dataUrl, `flexanon-portfolio-${Date.now()}.png`)
          // Then open Twitter share dialog
          shareToTwitter(totalValue, pnlPercentage)
          toast.success('Opening Twitter... Attach the downloaded image!')
          break
      }
      
      if (onScreenshot) onScreenshot()
    } catch (error) {
      console.error('Screenshot failed:', error)
      toast.error('Failed to capture screenshot')
    } finally {
      setIsCapturing(false)
    }
  }

  return (
    <div ref={cardRef} className="relative rounded-2xl md:rounded-[4rem] overflow-visible shadow-2xl max-w-full">
      {/* Base Layer - Black Panel (Full Width) */}
      <div className="bg-[#1a1a1a] rounded-2xl md:rounded-[4rem]">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left placeholder for blue overlay */}
          <div className="hidden lg:block lg:col-span-8 h-full min-h-[900px]"></div>
          
          {/* Right Side - Dark Panel */}
          <div className="lg:col-span-4 text-white p-4 md:p-6">
            <div className="h-full flex flex-col">
              {/* Asset Allocation Pie Chart */}
              <AssetAllocationSection positions={positions} totalValue={totalValue} />
              
              {/* Top Assets */}
              <TopAssetsSection assets={topAssets} />
            </div>
          </div>
        </div>
      </div>

      {/* Overlay Layer - Blue Card */}
      <div className="static lg:absolute top-0 h-full left-0 lg:w-[66.666667%] w-full">
        <div className="bg-[#004aad] h-full text-white rounded-2xl md:rounded-[4rem] lg:rounded-tr-[4rem] lg:rounded-br-[4rem]">
          <div className="p-4 md:p-6 lg:p-8">
            {/* Header Section */}
            <div className="flex items-start justify-between mb-4 md:mb-8">
              <div className="space-y-3 md:space-y-6">
                <div className='flex flex-col items-start'>
                    <Image src={logoAbstract} alt='logo' height={60} width={60} className="md:h-[90px] md:w-[90px]" />
                </div>

                <div>
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-2">
                    ${formatCurrency(totalValue)}
                  </h1>

                  <Badge
                    className={`inline-flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 text-sm md:text-base font-semibold border-0 ${
                      isPositive
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-red-500/20 text-red-300'
                    }`}
                  >
                    <span className="text-lg md:text-xl">⊙</span>
                    {formatPercentage(pnlPercentage * 100)}
                  </Badge>
                </div>
              </div>

              {/* Screenshot Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={isCapturing}
                    className="h-10 w-10 rounded-xl bg-white/10 hover:bg-white/20 text-white border-none disabled:opacity-50"
                    title="Screenshot Options"
                  >
                    {isCapturing ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    ) : (
                      <Camera className="h-5 w-5" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => handleScreenshot('download')}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleScreenshot('copy')}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy to Clipboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleScreenshot('twitter')}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share to Twitter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6 mb-4 md:mb-8">
              {/* Total Value */}
              <div className='bg-white/10 rounded-xl md:rounded-2xl p-3 md:p-5 md:px-7'>
                <p className="text-white text-xs md:text-sm mb-1">Total Value</p>
                <p className="text-xl md:text-2xl font-bold">
                  ${formatCurrency(metrics.totalValue)}
                </p>
                <p className={`text-xs mt-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  ⊙ {formatPercentage(pnlPercentage * 100)} 24h
                </p>
              </div>

              {/* 24h Change */}
              <div className='bg-white/10 rounded-xl md:rounded-2xl p-3 md:p-5 md:px-7'>
                <p className="text-white text-xs md:text-sm mb-1">24h Change</p>
                <p className="text-xl md:text-2xl font-bold">
                  {metrics.netChange >= 0 ? '+' : ''}${formatCurrency(Math.abs(metrics.netChange))}
                </p>
                <p className={`text-xs mt-1 ${metrics.netChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ⊙ {formatPercentage(metrics.netChangePercent)} Today
                </p>
              </div>

              {/* Asset Count */}
              <div className='bg-white/10 rounded-xl md:rounded-2xl p-3 md:p-5 md:px-7'>
                <p className="text-white text-xs md:text-sm mb-1">Assets</p>
                <p className="text-xl md:text-2xl font-bold">
                  {positions.length}
                </p>
                <p className="text-white/40 text-xs mt-1">
                  {positions.length === 1 ? 'token' : 'tokens'} held
                </p>
              </div>
            </div>

            {/* Time Period Selector */}
            <div className="flex items-center justify-center gap-1 md:gap-3 mb-4 md:mb-6 overflow-x-auto">
              {periods.map((period) => (
                <Button
                  key={period}
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePeriodClick(period)}
                  disabled={isLoadingChart}
                  className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    selectedPeriod === period
                      ? 'bg-white/20 text-white'
                      : 'bg-transparent text-white/60 hover:bg-white/10 hover:text-white'
                  } ${isLoadingChart ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {period}
                </Button>
              ))}
            </div>

            {/* Chart Area */}
            <ChartSection data={processedChartData} isLoading={isLoadingChart} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Sub-Components (Rest remains the same...)
// ============================================================================

interface ChartSectionProps {
  data: ProcessedChartDataPoint[]
  isLoading?: boolean
}

const ChartSection: React.FC<ChartSectionProps> = ({ data, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="h-[250px] md:h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-b-2 border-white" />
          <p className="text-white/60 text-sm md:text-base">Loading chart data...</p>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="h-[250px] md:h-[400px] flex items-center justify-center text-white/60">
        <p className="text-sm md:text-base">No chart data available</p>
      </div>
    )
  }

  return (
    <div className="h-[300px] md:h-[500px] relative w-full">
      {/* Bar chart background effect */}
      <div className="absolute inset-0 opacity-30">
        <div className="flex items-end justify-between h-full px-2 gap-1">
          {Array.from({ length: 80 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-white/40 rounded-t-sm"
              style={{
                height: `${Math.random() * 100}%`,
                minHeight: '10%'
              }}
            />
          ))}
        </div>
      </div>

      {/* Line Chart Overlay */}
      <div className="relative h-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
            <defs>
              <linearGradient id="colorValue1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FFA500" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#FFA500" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorValue2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FFFFFF" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#FFFFFF" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#FFFFFF" 
              strokeWidth={2.5}
              fill="url(#colorValue2)" 
              dot={false}
            />
            
            <Area 
              type="monotone" 
              dataKey={(d) => d.value * 0.95} 
              stroke="#FFA500" 
              strokeWidth={2.5}
              fill="url(#colorValue1)" 
              dot={false}
            />
            
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 74, 173, 0.95)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '12px',
                boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                color: '#fff'
              }}
              labelStyle={{ color: '#fff', fontWeight: 600 }}
              formatter={(value: any) => [`$${toNumber(value).toFixed(2)}`, 'Value']}
            />
          </AreaChart>
        </ResponsiveContainer>

        <PeakIndicator data={data} />
      </div>
    </div>
  )
}

interface PeakIndicatorProps {
  data: ProcessedChartDataPoint[]
}

const PeakIndicator: React.FC<PeakIndicatorProps> = ({ data }) => {
  if (data.length === 0) return null

  const peak = data.reduce((max, point) => 
    point.value > max.value ? point : max
  , data[0])

  const firstValue = data[0].value
  const peakChange = peak.value - firstValue
  const peakPercentage = ((peakChange / firstValue) * 100)

  return (
    <>
      <div 
        className="absolute bg-white rounded-full p-1.5 md:p-2 shadow-lg"
        style={{ top: '20%', right: '35%' }}
      >
        <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-[#004aad]" />
      </div>
      <div 
        className="absolute bg-white px-2 py-1 md:px-3 md:py-1.5 rounded-lg shadow-lg text-[#004aad] font-bold text-xs md:text-sm"
        style={{ top: '15%', right: '30%' }}
      >
        {peakChange >= 0 ? '+' : ''}${formatCurrency(peakChange)}
        <div className="text-[10px] md:text-xs font-normal">
          ⊙ {formatPercentage(peakPercentage)}
        </div>
      </div>
    </>
  )
}

interface AssetAllocationSectionProps {
  positions: Position[]
  totalValue: number
}

const AssetAllocationSection: React.FC<AssetAllocationSectionProps> = ({ positions, totalValue }) => {
  return (
    <div className="mb-8">
      <AssetAllocation positions={positions} totalValue={totalValue} />
    </div>
  )
}

interface TopAssetsSectionProps {
  assets: TopAsset[]
}

const TopAssetsSection: React.FC<TopAssetsSectionProps> = ({ assets }) => {
  if (assets.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <p className="text-sm md:text-base">No assets found</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <h4 className="text-base md:text-lg font-semibold">Top Assets</h4>
       
      </div>

      <div className="grid grid-cols-2 gap-2 overflow-y-auto flex-1 pr-2">
        {assets.map((asset, idx) => (
          <ScrollArea key={`${asset.symbol}-${idx}`} className="h-full max-h-[280px] md:max-h-[320px] pr-2">

          <AssetCard  asset={asset} />
          </ScrollArea>
        ))}
      </div>
    </div>
  )
}

interface AssetCardProps {
  asset: TopAsset
}

const AssetCard: React.FC<AssetCardProps> = ({ asset }) => {
  const isPositiveChange = asset.change24h >= 0
  
  return (
    <div 
      className={`rounded-xl md:rounded-2xl p-2.5 md:p-3 transition-all h-fit ${
        asset.isLargeCard 
          ? ' bg-[#252525] text-white' 
          : 'bg-[#252525]'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
          {asset.icon.startsWith('http') ? (
            <Image 
              height={50} 
              width={50}
              src={asset.icon} 
              alt={asset.symbol} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <span className="text-base md:text-lg">{asset.icon}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs md:text-sm font-bold">{asset.symbol}</p>
          <p className="text-[9px] md:text-[10px] text-gray-400 truncate">{asset.name}</p>
        </div>
      </div>

      <div className="space-y-0.5">
        <p className="text-lg md:text-xl font-bold">
          {asset.amount > 0.01 
            ? asset.amount.toFixed(2) 
            : asset.amount.toFixed(3)}
        </p>
        <p className="text-xs text-gray-400">
          ${formatCurrency(asset.value)}
        </p>
        <div
          className={`flex items-center gap-1 text-[10px] font-semibold ${
            isPositiveChange ? 'text-green-400' : 'text-red-400'
          }`}
        >
          <span>⊙</span>
          <span>{(Number(asset.change24h)*100).toFixed(3)}%</span>
        </div>
      </div>
    </div>
  )
}