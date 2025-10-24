import { useState } from "react";

export function useSubscription(apiBase: string, walletAddress: string | null) {
  const [subscription, setSubscription] = useState<any>(null);

  const fetchSubscription = async () => {
    if (!walletAddress) return;
    const res = await fetch(`${apiBase}/subscription/status?wallet=${walletAddress}`);
    const data = await res.json();
    setSubscription(data);
  };

  const useUpdate = async () => {
    if (!walletAddress) return;
    await fetch(`${apiBase}/subscription/use-update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet_address: walletAddress }),
    });
    await fetchSubscription();
  };

  return { subscription, fetchSubscription, useUpdate };
}
