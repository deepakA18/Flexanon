import FlexAnonClient from "@/components/sections/flexanon-client"

interface PageProps {
  params: { id: string }
}

export default async function Page({ params }: PageProps) {
  const { id } = params

  return (
    <div className="min-h-screen flex items-center justify-center ">
      <FlexAnonClient id={id} />
    </div>
  )
}
