
import React from 'react'

interface WalletDisplayProps {
  walletAddress: string | null
}
export const WalletDisplay: React.FC<WalletDisplayProps> = ({ walletAddress }) => {
  return (
    <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
      <p className="text-xs text-muted-foreground mb-1">Connected Wallet</p>
      <p className="text-sm  text-foreground truncate">{walletAddress}</p>
    </div>
  )
}