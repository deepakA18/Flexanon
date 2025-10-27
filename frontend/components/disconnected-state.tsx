import React from 'react'
import ConnectWalletButton from './connect-wallet-button'

export const DisconnectedState: React.FC = () => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        Connect your Solana wallet to get started
      </p>
      <ConnectWalletButton />
    </div>
  )
}