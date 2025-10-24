import ConnectWalletButton from "@/components/connect-wallet-button"
import FlexAnonClient from "@/components/sections/flexanon-client"

interface PageProps {
  params: { id: string }
}

export default async function Page({ params }: PageProps) {
  const { id } = params

  return (
    <div className="min-h-screen flex items-center justify-center ">
<FlexAnonClient apiBase="https://flexanon-delta.vercel.app/api" />
      <ConnectWalletButton />
    </div>
  )
}
