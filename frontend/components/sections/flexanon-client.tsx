"use client"

import { useState, useCallback } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle2, Copy, Lock, RefreshCw } from "lucide-react"
import ConnectWalletButton from "../connect-wallet-button"
import { Input } from "../ui/input"
import { toast } from "sonner"
import CryptoJS from "crypto-js"

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

function base58Encode(buffer) {
  const bytes = new Uint8Array(buffer)
  const digits = [0]

  for (let i = 0; i < bytes.length; i++) {
    let carry = bytes[i]
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8
      digits[j] = carry % 58
      carry = (carry / 58) | 0
    }

    while (carry > 0) {
      digits.push(carry % 58)
      carry = (carry / 58) | 0
    }
  }

  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    digits.push(0)
  }

  return digits.reverse().map(d => BASE58_ALPHABET[d]).join('')
}

function sha256(data) {
  return CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex)
}

function createLeafKey(identifier) {
  return sha256(identifier)
}

function createLeafValue(data) {
  const dataString = typeof data === 'string' ? data : JSON.stringify(data)
  return sha256(dataString)
}

function buildPortfolioLeaves(portfolio, walletAddress) {
  const leaves = []

  leaves.push({
    key: createLeafKey('wallet_address'),
    value: createLeafValue(walletAddress.toLowerCase())
  })

  leaves.push({
    key: createLeafKey('chain'),
    value: createLeafValue(portfolio.chain)
  })

  leaves.push({
    key: createLeafKey('total_value'),
    value: createLeafValue(portfolio.total_value.toString())
  })

  leaves.push({
    key: createLeafKey('pnl_percentage'),
    value: createLeafValue(portfolio.pnl_percentage.toString())
  })

  leaves.push({
    key: createLeafKey('snapshot_timestamp'),
    value: createLeafValue(portfolio.snapshot_timestamp.toString())
  })

  leaves.push({
    key: createLeafKey('total_assets_count'),
    value: createLeafValue(portfolio.assets.length.toString())
  })

  portfolio.assets.forEach((asset, index) => {
    const assetData = {
      symbol: asset.symbol,
      name: asset.name,
      quantity: asset.quantity,
      price: asset.price,
      value: asset.value,
      icon_url: asset.icon_url
    }

    leaves.push({
      key: createLeafKey(`asset_${index}_${asset.symbol}`),
      value: createLeafValue(JSON.stringify(assetData))
    })
  })

  return leaves
}

function buildSparseMerkleTree(leaves) {
  const EMPTY_HASH = sha256('EMPTY_LEAF')
  const TREE_DEPTH = 256

  const leafLevel = new Map()
  leaves.forEach(leaf => {
    const leafHash = sha256(leaf.key + ':' + leaf.value)
    leafLevel.set(leaf.key, leafHash)
  })

  let currentLevel = leafLevel

  for (let depth = TREE_DEPTH - 1; depth >= 0; depth--) {
    const nextLevel = new Map()
    const processedParents = new Set()

    currentLevel.forEach((hash, bitPath) => {
      if (bitPath.length === 0) return

      const parentPath = bitPath.slice(0, -1)
      if (processedParents.has(parentPath)) return

      processedParents.add(parentPath)

      const leftPath = parentPath + '0'
      const rightPath = parentPath + '1'
      const leftChild = currentLevel.get(leftPath) || EMPTY_HASH
      const rightChild = currentLevel.get(rightPath) || EMPTY_HASH
      const parentHash = sha256(leftChild + rightChild)

      nextLevel.set(parentPath, parentHash)
    })

    currentLevel = nextLevel
  }

  return currentLevel.get('') || EMPTY_HASH
}

export default function FlexAnonClient({
  apiBase = typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? "http://localhost:3001/api"
    : "https://flexanon-delta.vercel.app/api",
}: {
  apiBase?: string
}) {
  const { connected, publicKey, signMessage } = useWallet()
  const [shareUrl, setShareUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [subscription, setSubscription] = useState(null)
  const [commitmentData, setCommitmentData] = useState(null)
  const [status, setStatus] = useState('')

  const walletAddress = publicKey?.toBase58() ?? null

  const fetchSubscriptionStatus = useCallback(async () => {
    if (!walletAddress) return

    try {
      const response = await fetch(`${apiBase}/subscription/status?wallet=${walletAddress}`)
      const data = await response.json()
      setSubscription(data)
    } catch (error) {
      console.error('Error fetching subscription:', error)
    }
  }, [walletAddress, apiBase])

  const trackUpdateUsage = useCallback(async () => {
    if (!walletAddress) return

    try {
      await fetch(`${apiBase}/subscription/use-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: walletAddress })
      })

      await fetchSubscriptionStatus()
    } catch (error) {
      console.error('Failed to track update:', error)
    }
  }, [walletAddress, apiBase, fetchSubscriptionStatus])

  const generateShareLink = async () => {
    if (!walletAddress || !signMessage) {
      toast.error("Wallet not ready")
      return
    }

    setLoading(true)
    setStatus('')
    setShareUrl(null)

    try {
      // Step 1: Fetch portfolio
      setStatus('Step 1/4: Fetching portfolio data...')

      const portfolioResponse = await fetch(`${apiBase}/dev/test-zerion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: walletAddress })
      })

      const portfolioData = await portfolioResponse.json()

      if (!portfolioData.success || !portfolioData.portfolio) {
        throw new Error('Failed to fetch portfolio data')
      }

      const portfolio = portfolioData.portfolio

      if (portfolio.assets.length === 0) {
        throw new Error('No assets found in portfolio')
      }

      // Step 2: Build merkle leaves
      setStatus('Step 2/4: Building merkle tree...')

      const leaves = buildPortfolioLeaves(portfolio, walletAddress)
      const merkleRootHex = buildSparseMerkleTree(leaves)

      const merkleRoot = []
      for (let i = 0; i < merkleRootHex.length; i += 2) {
        merkleRoot.push(parseInt(merkleRootHex.substr(i, 2), 16))
      }

      // Step 3: Sign and submit via relayer
      setStatus('Step 3/4: Signing and submitting via relayer...')

      const timestamp = Date.now()
      const message = `FlexAnon Commitment

Wallet: ${walletAddress}
Merkle Root: ${merkleRootHex.substring(0, 32)}...
Timestamp: ${timestamp}

I authorize this commitment to be submitted via the FlexAnon relayer service.`

      const encodedMessage = new TextEncoder().encode(message)
      const signedMessage = await signMessage(encodedMessage)
      const signature = base58Encode(signedMessage)

      const relayResponse = await fetch(`${apiBase}/relayer/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: walletAddress,
          merkle_root: merkleRoot,
          metadata: {
            chain: 'solana',
            snapshot_timestamp: timestamp,
            expires_at: null,
            privacy_score: 75
          },
          signature: signature,
          message: message,
          timestamp: timestamp
        })
      })

      const relayData = await relayResponse.json()

      if (!relayData.success) {
        throw new Error(relayData.details || relayData.error || 'Relayer commit failed')
      }

      const commitmentAddress = relayData.commitment_address
      const commitmentVersion = relayData.commitment_version

      setCommitmentData({ commitmentAddress, commitmentVersion })

      // Step 4: Generate share link
      setStatus('Step 4/4: Generating share link...')

      const linkMessage = `FlexAnon Ownership Verification

I am the owner of wallet: ${walletAddress}

Timestamp: ${timestamp}

This signature proves I own this wallet and authorize share link generation.`

      const linkEncodedMessage = new TextEncoder().encode(linkMessage)
      const linkSignedMessage = await signMessage(linkEncodedMessage)
      const linkSignature = base58Encode(linkSignedMessage)

      const generateResponse = await fetch(`${apiBase}/share/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: walletAddress,
          signature: linkSignature,
          message: linkMessage,
          timestamp: timestamp,
          commitment_address: commitmentAddress,
          commitment_version: commitmentVersion,
          chain: 'solana',
          reveal_preferences: {
            show_total_value: true,
            show_pnl: true,
            show_top_assets: true,
            top_assets_count: 5,
            show_wallet_address: false
          }
        })
      })

      const generateData = await generateResponse.json()

      if (!generateData.success) {
        const errorMessage = generateData.user_friendly_message || 
                           generateData.details || 
                           generateData.error || 
                           'Link generation failed'
        throw new Error(errorMessage)
      }

      await trackUpdateUsage()

      setShareUrl(generateData.share_url)
      setStatus('')
      toast.success('✅ Share link generated successfully!')

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      toast.error(`Failed: ${message}`)
      setStatus('')
    } finally {
      setLoading(false)
    }
  }

  const refreshPortfolio = async () => {
    if (!walletAddress || !signMessage) {
      toast.error("Wallet not ready")
      return
    }

    setRefreshing(true)

    try {
      // Fetch portfolio
      const portfolioResponse = await fetch(`${apiBase}/dev/test-zerion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: walletAddress })
      })

      const portfolioData = await portfolioResponse.json()

      if (!portfolioData.success || !portfolioData.portfolio) {
        throw new Error('Failed to fetch portfolio data')
      }

      const portfolio = portfolioData.portfolio

      if (portfolio.assets.length === 0) {
        throw new Error('No assets found in portfolio')
      }

      // Build merkle tree
      const leaves = buildPortfolioLeaves(portfolio, walletAddress)
      const merkleRootHex = buildSparseMerkleTree(leaves)
      const merkleRoot = []
      for (let i = 0; i < merkleRootHex.length; i += 2) {
        merkleRoot.push(parseInt(merkleRootHex.substr(i, 2), 16))
      }

      // Sign and commit
      const timestamp = Date.now()
      const message = `FlexAnon Commitment

Wallet: ${walletAddress}
Merkle Root: ${merkleRootHex.substring(0, 32)}...
Timestamp: ${timestamp}

I authorize this commitment to be submitted via the FlexAnon relayer service.`

      const encodedMessage = new TextEncoder().encode(message)
      const signedMessage = await signMessage(encodedMessage)
      const signature = base58Encode(signedMessage)

      const relayResponse = await fetch(`${apiBase}/relayer/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: walletAddress,
          merkle_root: merkleRoot,
          metadata: {
            chain: 'solana',
            snapshot_timestamp: timestamp,
            expires_at: null,
            privacy_score: 75
          },
          signature: signature,
          message: message,
          timestamp: timestamp
        })
      })

      const relayData = await relayResponse.json()

      if (!relayData.success) {
        throw new Error(relayData.details || relayData.error || 'Relayer commit failed')
      }

      await trackUpdateUsage()

      toast.success('✅ Portfolio refreshed! Link updated with latest data.')

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      toast.error(`Failed to refresh: ${message}`)
    } finally {
      setRefreshing(false)
    }
  }

  const handleCopyLink = () => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast.success("Share link copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-2xl">
          <CardHeader className="space-y-3 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Lock className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold">FlexAnon</CardTitle>
                <CardDescription className="text-base">Privacy-first portfolio sharing</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {!connected ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Connect your Solana wallet to get started
                </p>
                <ConnectWalletButton />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                  <p className="text-xs text-muted-foreground mb-1">Connected Wallet</p>
                  <p className="text-sm font-mono text-foreground truncate">{walletAddress}</p>
                </div>

                {subscription && (
                  <div className="p-3 rounded-lg border border-purple-200 bg-purple-50">
                    <p className="text-xs text-muted-foreground mb-2">Subscription Status</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-purple-700">
                        {subscription.plan === 'pro' ? '💎 Pro' : '⭐ Free'}
                      </span>
                      <span className="text-sm text-purple-600">
                        {subscription.updates_remaining}/{subscription.updates_limit} updates
                      </span>
                    </div>
                  </div>
                )}

                {status && (
                  <div className="p-3 rounded-lg border border-blue-200 bg-blue-50">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <p className="text-sm text-blue-700">{status}</p>
                    </div>
                  </div>
                )}

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={generateShareLink}
                    disabled={loading}
                    size="lg"
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate Share Link"
                    )}
                  </Button>
                </motion.div>
              </div>
            )}

            {shareUrl && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <p className="font-semibold text-green-900">Share Link Ready</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-green-700">
                    Your private portfolio link has been generated. Share it securely with others.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="flex-1 px-3 py-2 text-xs rounded-md font-mono text-green-900 truncate"
                    />
                    <Button
                      onClick={handleCopyLink}
                      size="sm"
                      variant="outline"
                      className="border-green-200 hover:bg-green-100 bg-white"
                    >
                      <Copy className="w-4 h-4" />
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                  <Button
                    onClick={refreshPortfolio}
                    disabled={refreshing}
                    size="sm"
                    variant="outline"
                    className="w-full border-green-200 hover:bg-green-100 bg-white"
                  >
                    {refreshing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Refreshing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh Portfolio
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            <div className="flex justify-center pt-2">
              <Badge variant="secondary" className="gap-1">
                <Lock className="w-3 h-3" />
                Privacy Protected
              </Badge>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-white/70 text-center mt-4">
          Your portfolio data is encrypted and never stored on our servers
        </p>
      </motion.div>
    </div>
  )
}