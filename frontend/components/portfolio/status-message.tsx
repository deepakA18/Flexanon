import React from 'react'
import { Loader2 } from 'lucide-react'

interface StatusMessageProps {
  status: string
}

export const StatusMessage: React.FC<StatusMessageProps> = ({ status }) => {
  if (!status) return null

  return (
    <div className="p-3 rounded-lg border border-blue-200 bg-blue-50">
      <div className="flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
        <p className="text-sm text-blue-700">{status}</p>
      </div>
    </div>
  )
}