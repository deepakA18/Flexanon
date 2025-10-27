import { fetchSubscriptionStatus } from "@/lib/api-services"
import PlanStatusCard from "../ui/plan-status-card"
import ConnectWalletButton from "../connect-wallet-button"

interface NavDockProps {
  walletAddress: string
}

export default async function NavDock({ walletAddress }: NavDockProps) {
  let planData = null

  try {
    planData = await fetchSubscriptionStatus(walletAddress)
    console.log(planData)
  } catch (err) {
    console.error("Error fetching subscription data:", err)
  }

  return (
    <nav className="absolute top-0 flex flex-row justify-between w-full p-5 z-50">
      <div className="flex-1 text-xl font-bold text-white">FlexAnon</div>

      <div className="flex flex-row items-center gap-4">
        {/* @ts-expect-error Server Component - planData type mismatch with client component props */}
        {planData && <PlanStatusCard data={planData} />}
        <ConnectWalletButton />
      </div>
    </nav>
  )
}