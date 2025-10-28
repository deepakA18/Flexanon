import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle2, Copy, RefreshCw, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface ShareLinkDisplayProps {
  shareUrl: string
  copied: boolean
  refreshing: boolean
  onCopy: () => void
  onRefresh: () => Promise<void>
}

export const ShareLinkDisplay: React.FC<ShareLinkDisplayProps> = ({
  shareUrl,
  copied,
  refreshing,
  onCopy,
  onRefresh
}) => {
  return (
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
            className="flex-1 px-3 py-2 text-xs rounded-md  text-green-900 truncate"
          />
          <Button
            onClick={onCopy}
            size="sm"
            variant="outline"
            className="border-green-200 hover:bg-green-100 bg-white"
          >
            <Copy className="w-4 h-4" />
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
        <Button
          onClick={onRefresh}
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
  )
}