"use client"

import { useState } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle2, Copy, Lock } from "lucide-react"
import ConnectWalletButton from "../connect-wallet-button"
import { useSubscription } from "@/hooks/use-subscription"
import { usePortfolioMerkle } from "@/hooks/use-portfolio-merkle"
import { useShareLink } from "@/hooks/use-share-link"
import { Input } from "../ui/input"
import { toast } from "sonner"

export default function FlexAnonClient({
  id,
  apiBase = "http://localhost:3001/api",
}: {
  id: string
  apiBase?: string
}) {
  const { connected, publicKey, signMessage } = useWallet()
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const walletAddress = publicKey?.toBase58()
  const { merkleRootHex } = usePortfolioMerkle(apiBase, walletAddress || null)
  const { useUpdate } = useSubscription(apiBase, walletAddress || null)

  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

  const handleGenerate = async () => {
    if (!walletAddress || !signMessage) {
      toast.error("Please connect your wallet first.")
      return
    }

    setLoading(true)
    setShareUrl(null)

    try {
      const toastId = toast.loading("Fetching portfolio data...")

      await delay(800) // simulate smooth step transition
      toast.loading("Verifying data integrity...", { id: toastId })

      const link = await useShareLink({ apiBase, walletAddress, merkleRootHex, signMessage })

      toast.loading("Submitting portfolio to relayer...", { id: toastId })
      await useUpdate()
      await delay(600)

      setShareUrl(link)
      toast.success("✅ Share link generated successfully!", { id: toastId })
    } catch (err: any) {
      // 3-step error toasts chain
      toast.error("❌ Something went wrong during generation.")
      await delay(500)
      toast.error("Check your wallet connection or API endpoint.")
      await delay(700)
      toast.error(err?.message || "Unknown error occurred.")
    } finally {
      setLoading(false)
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-3 pb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Lock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">FlexAnon</CardTitle>
                <CardDescription>Privacy-first portfolio sharing</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {!connected ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center">
                  Connect your Solana wallet to get started
                </p>
                <ConnectWalletButton />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-1">Connected Wallet</p>
                  <p className="text-sm font-mono text-foreground truncate">{walletAddress}</p>
                </div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleGenerate}
                    disabled={loading}
                    size="lg"
                    className="w-full"
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
                      className="flex-1 px-3 py-2 text-sm rounded-md font-mono text-green-900 truncate"
                    />
                    <Button
                      onClick={handleCopyLink}
                      size="sm"
                      variant="outline"
                      className="border-green-200 hover:bg-green-100 bg-transparent"
                    >
                      <Copy className="w-4 h-4" />
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                  </div>
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

        <p className="text-xs text-muted-foreground text-center mt-4">
          Your portfolio data is encrypted and never stored on our servers
        </p>
      </motion.div>
    </div>
  )
}
