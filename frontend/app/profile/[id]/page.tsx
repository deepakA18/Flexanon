import ConnectWalletButton from "@/components/connect-wallet-button"
import NavDock from "@/components/portfolio/nav-dock"
import FlexAnonClient from "@/components/sections/flexanon-client"
import { Spotlight } from "@/components/ui/spotlight-new"

interface PageProps {
  params: { id: string }
}

export default async function Page({ params }: PageProps) {
  const { id } = params

  return (
    <div className="min-h-screen w-full bg-[#c6dfff] font-mono antialiased relative overflow-hidden flex items-center justify-center">
      <Spotlight />
      <div className="w-full  mx-auto px-4 flex flex-col space-y-10 py-12">
        <NavDock walletAddress={id} />
        <FlexAnonClient apiBase="https://flexanon-delta.vercel.app/api" />
      </div>
    </div>
  )
}
