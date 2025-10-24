"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Copy } from "lucide-react"
import { motion } from "framer-motion"

interface ShareLinkProps {
  link: string
  onCopy?: () => void
}

export default function ShareLink({ link, onCopy }: ShareLinkProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(link)
    setCopied(true)
    onCopy?.()
    setTimeout(() => setCopied(false), 2000)
  }

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
          <input
            type="text"
            value={link}
            readOnly
            className="flex-1 px-3 py-2 text-sm bg-white border border-green-200 rounded-md font-mono text-green-900 truncate"
          />
          <Button
            onClick={handleCopy}
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
  )
}
