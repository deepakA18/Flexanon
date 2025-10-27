import React from 'react'
import type {SubscriptionData} from "@/lib/api-services"

interface SubscriptionStatusProps {
  subscription: SubscriptionData | null
}


export const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({ subscription }) => {
  if (!subscription) return null

  return (
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
  )
}