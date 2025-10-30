"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { fetchSubscriptionStatus } from "@/lib/api-services"
import PlanStatusCard from "../ui/plan-status-card"
import ConnectWalletButton from "../connect-wallet-button"
import Image from "next/image"
import { logo } from "@/public"

interface NavDockProps {
  walletAddress: string
}

export default function NavDock({ walletAddress }: NavDockProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [planData, setPlanData] = useState<any>(null)

  // fetch plan data client-side (you can also pass it from parent)
  useState(() => {
    fetchSubscriptionStatus(walletAddress)
      .then((res) => setPlanData(res))
      .catch((err) => console.error("Error fetching plan:", err))
  })

  return (
    <nav className="fixed top-0 left-0 w-full   z-50 ">
      <div className="flex items-center justify-between px-5 py-3 md:px-10">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Image
            src={logo}
            alt="Logo"
            height={50}
            width={50}
            className="rounded-md object-contain"
            priority
          />
          <span className="text-lg font-semibold tracking-wide">FLEXANON</span>
        </div>

        {/* Desktop Menu */}
       

        {/* Right Controls */}
        <div className="hidden md:flex items-center gap-4">
          {planData && <PlanStatusCard data={planData} />}
          <ConnectWalletButton />
        </div>

        {/* Mobile Menu Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden "
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </Button>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="flex flex-col items-start gap-4 px-6 pb-5 bg-white border-t border-gray-800 md:hidden animate-in fade-in slide-in-from-top-2">
          

          <div className="mt-4 flex flex-col gap-3 w-full">
            {planData && <PlanStatusCard data={planData} />}
            <ConnectWalletButton />
          </div>
        </div>
      )}
    </nav>
  )
}
