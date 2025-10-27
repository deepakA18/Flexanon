'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Copy, Loader2, Share2 } from 'lucide-react'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: () => void
  shareUrl?: string | null
  shareStatus?: string
  loading: boolean
  copied: boolean
  onCopy: () => void
}

export default function ShareModal({
  isOpen,
  onClose,
  onGenerate,
  shareUrl,
  shareStatus,
  loading,
  copied,
  onCopy
}: ShareModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
            onClick={(e) => e?.stopPropagation?.()}
          >
            <Card className="border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
              <CardHeader className="space-y-3 border-b border-white/5">
                <CardTitle className="text-2xl text-white">Share Your Portfolio</CardTitle>
                <CardDescription className="text-neutral-300">
                  {shareUrl ? 'Your secure share link is ready' : 'Generate a secure link to share your portfolio anonymously'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                {!shareUrl ? (
                  <>
                    {shareStatus && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg flex items-center gap-3"
                      >
                        <Loader2 className="w-5 h-5 text-blue-400 flex-shrink-0 animate-spin" />
                        <p className="text-sm text-blue-200">{shareStatus}</p>
                      </motion.div>
                    )}

                    <div className="bg-white/5 rounded-lg p-4 space-y-3 text-sm border border-white/10">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-neutral-300">Your portfolio data is encrypted and verified</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-neutral-300">Share link proves ownership without revealing details</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-neutral-300">Never stored on our servers</span>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        onClick={onGenerate}
                        disabled={loading}
                        className="flex-1 gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Share2 className="w-4 h-4" />
                            Generate Link
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={onClose}
                        disabled={loading}
                        variant="outline"
                        className="flex-1 border-white/10 bg-white/5 text-neutral-200 hover:bg-white/10"
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-lg"
                    >
                      <p className="text-sm text-emerald-200 font-semibold mb-1">✓ Link Generated Successfully</p>
                      <p className="text-xs text-neutral-300">Your secure share link is ready to use</p>
                    </motion.div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={shareUrl}
                          readOnly
                          className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-mono text-white outline-none"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={onCopy}
                          className="flex-shrink-0 bg-white/5 border-white/10 text-neutral-200 hover:bg-white/10 gap-2"
                        >
                          <Copy className="w-4 h-4" />
                          {copied ? 'Copied!' : 'Copy'}
                        </Button>
                      </div>
                      {copied && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-xs text-emerald-400 flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Copied to clipboard
                        </motion.p>
                      )}
                    </div>

                    <Button
                      onClick={onClose}
                      className="w-full gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Done
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}