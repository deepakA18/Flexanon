'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { RefreshCw, Share2 } from 'lucide-react'
import { base58Encode, buildPortfolioLeaves, buildSparseMerkleTree } from '@/lib/crypto-utils'
import { fetchPortfolio, submitCommitment, generateShareLink, fetchSubscriptionStatus, trackUpdateUsage, fetchWalletPositions, fetchWalletChart } from '@/lib/api-services'
import { useRouter } from 'next/navigation'
import { Spotlight } from '../ui/spotlight-new'
import { PortfolioData, SubscriptionData } from '../portfolio/types'
import { ConnectWalletCard, PortfolioCard, PortfolioLoading, PortfolioEmpty, ShareModal } from '@/components/portfolio'
import { Button } from '@/components/ui/button'

interface Props { apiBase?: string }

export default function FlexAnonClient({ apiBase = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://flexanon-delta.vercel.app/api' }: Props) {
  const { connected, publicKey, signMessage } = useWallet()
  const router = useRouter()
  const walletAddress = publicKey?.toBase58?.() ?? null

  const [positions, setPositions] = useState<any[]>([])
  const [chartData, setChartData] = useState<any>(null)
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(false)
  const [portfolioLoading, setPortfolioLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareStatus, setShareStatus] = useState('')

  const fetchWalletPositionsData = useCallback(async () => {
    if (!walletAddress) return
    try {
      const data = await fetchWalletPositions(apiBase, walletAddress)
      setPositions(data?.positions ?? data?.fungible_positions ?? [])
    } catch (e) {
      console.error('fetchWalletPositions error:', e)
      toast?.error?.('Failed to fetch wallet positions')
    }
  }, [walletAddress, apiBase])

  const fetchWalletChartData = useCallback(async () => {
    if (!walletAddress) return
    try {
      const data = await fetchWalletChart(apiBase, walletAddress, 'day')
      setChartData(data)
    } catch (e) {
      console.error('fetchWalletChart error:', e)
      toast?.error?.('Failed to fetch wallet chart')
    }
  }, [walletAddress, apiBase])

  const fetchSubscription = useCallback(async () => {
    if (!walletAddress) return
    try {
      setSubscription(await fetchSubscriptionStatus?.(walletAddress) ?? null)
    } catch (e) {
      console.error('fetchSubscription error:', e)
      toast?.error?.('Failed to fetch subscription')
    }
  }, [walletAddress])

  const fetchPortfolioData = useCallback(async () => {
    if (!walletAddress) return
    setPortfolioLoading(true)
    try {
      const data = await fetchPortfolio?.(apiBase, walletAddress)
      if (!data) {
        setPortfolio(null)
        return
      }

      // Normalize backend Portfolio -> frontend PortfolioData
      const normalized: PortfolioData = {
        wallet_address: walletAddress,
        chain: data?.chain ?? 'Solana',
        total_value: data?.total_value ?? 0,
        pnl_percentage: data?.pnl_percentage ?? 0,
        assets_count: data?.assets?.length ?? 0,
        assets: (data?.assets ?? []).map((a: any) => ({
          asset_code: a?.asset_code ?? undefined,
          symbol: a?.symbol ?? '',
          name: a?.name ?? '',
          quantity: a?.quantity != null ? String(a.quantity) : '0',
          price: a?.price ?? undefined,
          value: a?.value ?? undefined,
          icon_url: a?.icon_url ?? undefined
        })),
        snapshot_timestamp: data?.snapshot_timestamp ?? undefined
      }
      setPortfolio(normalized)
    } catch (e) {
      console.error('fetchPortfolio error:', e)
      toast?.error?.('Failed to fetch portfolio')
    } finally {
      setPortfolioLoading(false)
    }
  }, [walletAddress, apiBase])

  const trackUpdate = useCallback(async () => {
    if (!walletAddress) return
    try {
      await trackUpdateUsage?.(apiBase, walletAddress)
      await fetchSubscription?.()
      router?.refresh?.()
    } catch (e) {
      console.error('trackUpdate error:', e)
    }
  }, [walletAddress, apiBase, fetchSubscription, router])

  const buildAndSign = async (data: any[]) => {
    // Safety checks
    if (!walletAddress) {
      throw new Error('Wallet address is required')
    }

    if (!signMessage) {
      throw new Error('Sign message function not available')
    }

    if (!Array.isArray(data)) {
      console.warn('buildAndSign: data is not an array, using empty array')
      data = []
    }

    // Construct Portfolio object for Merkle tree
    const portfolioObj = {
      chain: 'Solana',
      total_value: data.reduce((sum, a) => sum + (a?.value ?? 0), 0),
      pnl_percentage: 0,
      snapshot_timestamp: Date.now(),
      assets: data
    }

    try {
      // Build leaves with safe function
      const leaves = buildPortfolioLeaves(portfolioObj, walletAddress)

      if (leaves.length === 0) {
        console.warn('buildAndSign: no valid leaves generated')
      }

      // Build merkle root
      const rootHex = buildSparseMerkleTree(leaves)

      // Convert hex to byte array safely
      const root: number[] = []
      for (let i = 0; i < (rootHex?.length || 0); i += 2) {
        const byte = rootHex?.substring?.(i, i + 2) || '00'
        root.push(parseInt(byte, 16))
      }

      const ts = Date.now()
      const message = `FlexAnon Commitment\n\nWallet: ${walletAddress}\nMerkle Root: ${(rootHex || '').substring(0, 32)}...\nTimestamp: ${ts}\n\nI authorize this commitment to be submitted via the FlexAnon relayer service.`

      // Sign message
      const sig = await signMessage(new TextEncoder().encode(message))
      if (!sig) {
        throw new Error('Signing failed - no signature returned')
      }

      const signature = base58Encode(sig)
      if (!signature) {
        throw new Error('Failed to encode signature')
      }

      return { root, signature, message, timestamp: ts }
    } catch (error) {
      console.error('buildAndSign error:', error)
      throw new Error(`Failed to build and sign: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

const handleGenerateShareLink = async () => {
  if (!walletAddress || !signMessage) {
    toast?.error?.('Wallet not ready')
    return
  }

  setLoading(true)
  setShareStatus('')

  try {
    setShareStatus('Fetching portfolio data...')
    const current = await fetchPortfolio?.(apiBase, walletAddress)

    // Get portfolio data safely
    const portfolioData = Array.isArray(current?.assets) ? current.assets : []

    if (portfolioData.length === 0) {
      toast?.error?.('No assets found to share')
      setLoading(false)
      return
    }

    setShareStatus('Building verification...')
    const { root, signature, message, timestamp } = await buildAndSign(portfolioData)

    setShareStatus('Submitting commitment...')
    const commitmentResult = await submitCommitment?.(apiBase, walletAddress, root, signature, message, timestamp)

    if (!commitmentResult?.commitmentAddress) {
      throw new Error('Failed to get commitment address')
    }
    console.log(commitmentResult);
    const { commitmentAddress, commitmentVersion, transactionSignature } = commitmentResult

    // Show transaction signature toast if available
    

    setShareStatus('Signing ownership...')
    const linkMsg = `FlexAnon Ownership Verification\n\nI am the owner of wallet: ${walletAddress}\nTimestamp: ${timestamp}`
    const linkSigRaw = await signMessage(new TextEncoder().encode(linkMsg))

    if (!linkSigRaw) {
      throw new Error('Ownership signing failed')
    }

    const linkSig = base58Encode(linkSigRaw)
    if (!linkSig) {
      throw new Error('Failed to encode ownership signature')
    }

    setShareStatus('Generating share link...')
    const url = await generateShareLink?.(apiBase, walletAddress, linkSig, linkMsg, timestamp, commitmentAddress, commitmentVersion)

    if (!url) {
      throw new Error('Failed to generate share URL')
    }

    await trackUpdate?.()
    setShareUrl(url)
    if (transactionSignature) {
      toast?.success?.(
        `Commitment verified on-chain!`,
        {
          description: `Transaction: ${transactionSignature.slice(0, 8)}...${transactionSignature.slice(-8)}`,
          action: {
            label: 'View on Solscan',
            onClick: () => window.open(`https://solscan.io/tx/${transactionSignature}?cluster=devnet`, '_blank')
          },
         
        }
      )
    }


  } catch (e: any) {
    console.error('handleGenerateShareLink error:', e)
    const errorMessage = e?.message || 'Failed to generate share link'
    toast?.error?.(errorMessage)
  } finally {
    setShareStatus('')
    setLoading(false)
  }
}

  const handleRefresh = async () => {
    if (!walletAddress || !signMessage) {
      toast?.error?.('Wallet not ready')
      return
    }

    // Check subscription limits
    

    try {
      setRefreshing(true)
      toast?.info?.('Refreshing portfolio...')

      // Fetch fresh portfolio data
      const current = await fetchPortfolio?.(apiBase, walletAddress)
      const portfolioData = Array.isArray(current?.assets) ? current.assets : []

      if (portfolioData.length === 0) {
        toast?.warning?.('No assets found in portfolio')
        return
      }

      // Build and sign the commitment
      const { root, signature, message, timestamp } = await buildAndSign(portfolioData)

      // Submit commitment to blockchain
      await submitCommitment?.(apiBase, walletAddress, root, signature, message, timestamp)

      // Track the update usage
      await trackUpdate?.()

      // Refresh all data
      await Promise.all([
        fetchPortfolioData?.(),
        fetchWalletPositionsData?.(),
        fetchWalletChartData?.()
      ])

      toast?.success?.('Portfolio refreshed successfully!')
    } catch (e: any) {
      console.error('handleRefresh error:', e)
      toast?.error?.(e?.message ?? 'Failed to refresh portfolio')
    } finally {
      setRefreshing(false)
    }
  }

  const handleCopy = async () => {
    if (!shareUrl) return
    try {
      await navigator?.clipboard?.writeText?.(shareUrl)
      toast?.success?.('Link copied to clipboard!')
    } catch (e) {
      console.error('Copy failed:', e)
      toast?.error?.('Failed to copy link')
    }
  }

  useEffect(() => {
    if (connected && walletAddress) {
      fetchSubscription()
      fetchPortfolioData()
      fetchWalletPositionsData()
      fetchWalletChartData()
    }
  }, [connected, walletAddress, fetchSubscription, fetchPortfolioData, fetchWalletPositionsData, fetchWalletChartData])

  return (
    <div className="w-full bg-transparent antialiased relative overflow-hidden">
      <div className="p-6 mx-auto">
        {!connected ? (
          <ConnectWalletCard />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              {portfolioLoading ? (
                <PortfolioLoading />
              ) : portfolio ? (
                <div className="space-y-4">
                  {/* Action Bar - Positioned at the top with subscription info and action buttons */}


                  {/* Portfolio Card */}
                  <PortfolioCard
                    positions={positions}
                    chartData={chartData}
                    portfolio={portfolio}
                    onRefresh={handleRefresh}
                    onShare={() => setShowShareModal(true)}
                    refreshing={refreshing}
                    loading={loading}
                  />
                </div>
              ) : (
                <PortfolioEmpty />
              )}
            </div>
          </motion.div>
        )}
      </div>

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onGenerate={handleGenerateShareLink}
        shareUrl={shareUrl}
        shareStatus={shareStatus}
        loading={loading}
        copied={false}
        onCopy={handleCopy}
      />

    </div>
  )
}