"use client"

import { useState, useEffect } from "react"

export function useSubscription(apiBase: string, walletAddress: string | null) {
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function fetchSubscription() {
    if (!walletAddress) return
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/subscription/status?wallet=${walletAddress}`)
      const data = await res.json()
      setSubscription(data)
    } catch (err) {
      console.error("Subscription fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  async function updateSubscription() {
    if (!walletAddress) return
    try {
      await fetch(`${apiBase}/subscription/use-update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet_address: walletAddress }),
      })
      await fetchSubscription()
    } catch (err) {
      console.error("Subscription update error:", err)
    }
  }

  useEffect(() => {
    if (walletAddress) fetchSubscription()
  }, [walletAddress])

  return { subscription, fetchSubscription, updateSubscription, loading }
}
