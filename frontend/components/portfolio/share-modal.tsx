'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Copy, Loader2, Share2, Shield, Lock, Eye, X, ExternalLink } from 'lucide-react'

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
  const handleOpenLink = () => {
    if (shareUrl) {
      window.open(shareUrl, '_blank')
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="w-full max-w-lg"
            onClick={(e) => e?.stopPropagation?.()}
          >
            <Card className="bg-white relative rounded-4xl border-none">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>

              <CardHeader className="space-y-3 border-b border-gray-100 pb-5">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-blue-100 rounded-xl flex-shrink-0">
                    <Share2 className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 pt-1">
                    <CardTitle className="text-2xl text-primary mb-1">Share Portfolio</CardTitle>
                    <CardDescription className="text-gray-600 text-sm leading-relaxed">
                      {shareUrl 
                        ? 'Your portfolio link has been generated successfully' 
                        : 'Create a shareable link to showcase your portfolio'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-6 pb-6 space-y-6">
                {!shareUrl ? (
                  <>
                    {shareStatus && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3"
                      >
                        <Loader2 className="w-5 h-5 text-blue-600 flex-shrink-0 animate-spin" />
                        <p className="text-sm text-blue-700 font-medium">{shareStatus}</p>
                      </motion.div>
                    )}

                    {/* Security Features */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-4">
                        <Shield className="w-5 h-5 text-blue-600" />
                        <h4 className="text-sm font-semibold text-primary">Security Features</h4>
                      </div>
                      
                      <div className="grid gap-3">
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                          <div className="mt-0.5 p-1.5 bg-green-100 rounded-lg">
                            <Lock className="w-4 h-4 text-green-700" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-primary mb-0.5">End-to-end encryption</p>
                            <p className="text-xs text-gray-600 leading-relaxed">Address is encrypted before sharing</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                          <div className="mt-0.5 p-1.5 bg-blue-100 rounded-lg">
                            <Eye className="w-4 h-4 text-blue-700" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-primary mb-0.5">Anonymous sharing</p>
                            <p className="text-xs text-gray-600 leading-relaxed">No address  is included in the link</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                          <div className="mt-0.5 p-1.5 bg-purple-100 rounded-lg">
                            <Shield className="w-4 h-4 text-purple-700" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-primary mb-0.5">No server storage</p>
                            <p className="text-xs text-gray-600 leading-relaxed">Your address is never stored on our servers</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                      <Button
                        onClick={onGenerate}
                        disabled={loading}
                        size="lg"
                        className="flex-1 gap-2 bg-primary text-white font-semibold shadow-sm h-11"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating Link...
                          </>
                        ) : (
                          <>
                            <Share2 className="w-4 h-4" />
                            Generate Share Link
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={onClose}
                        disabled={loading}
                        variant="outline"
                        size="lg"
                        className="px-6 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 h-11"
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Success Message */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3"
                    >
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-green-900 font-semibold mb-0.5">Link generated successfully</p>
                        <p className="text-xs text-green-700">Share this link with anyone to showcase your portfolio</p>
                      </div>
                    </motion.div>

                    {/* Share Link Input */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-700 block uppercase tracking-wide">
                        Shareable Link
                      </label>
                      <div className="flex items-stretch gap-2">
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            value={shareUrl}
                            readOnly
                            onClick={(e) => e.currentTarget.select()}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono text-primary outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer hover:bg-gray-100"
                          />
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          onClick={onCopy}
                          className="flex-1 bg-white border-gray-300 text-gray-700 hover:bg-gray-50 gap-2 h-10"
                        >
                          <Copy className="w-4 h-4" />
                          {copied ? 'Copied!' : 'Copy Link'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleOpenLink}
                          className="flex-1 bg-white border-gray-300 text-gray-700 hover:bg-gray-50 gap-2 h-10"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open Link
                        </Button>
                      </div>

                      {copied && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg"
                        >
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <p className="text-xs text-green-700 font-medium">Link copied to clipboard</p>
                        </motion.div>
                      )}
                    </div>

                    {/* Done Button */}
                    <Button
                      onClick={onClose}
                      size="lg"
                      className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm h-11"
                    >
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