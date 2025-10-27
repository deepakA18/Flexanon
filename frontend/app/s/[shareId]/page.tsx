import ShareablePortfolio from "@/components/portfolio/shareable-portfolio"
interface PageProps {
  params: {
    shareId: string
  }
}

export default function SharePage({ params }: PageProps) {
  return <div className="bg-[#c6dfff] w-full">
    <ShareablePortfolio shareId={params.shareId} />
  </div>
}

// Metadata for SEO and social sharing
export async function generateMetadata({ params }: PageProps) {
  const shareId = params.shareId

  return {
    title: `Shared Portfolio - FlexAnon`,
    description: 'View this cryptographically verified crypto portfolio shared via FlexAnon with zero-knowledge proofs',
    openGraph: {
      title: 'Shared Crypto Portfolio | FlexAnon',
      description: 'Zero-knowledge verified cryptocurrency holdings',
      type: 'website',
      images: [
        {
          url: '/og-image.png', // Add your OG image
          width: 1200,
          height: 630,
          alt: 'FlexAnon Shared Portfolio',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Shared Crypto Portfolio',
      description: 'Zero-knowledge verified cryptocurrency holdings',
      images: ['/og-image.png'],
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

// Optional: Generate static params for known share IDs (if you want SSG)
// export async function generateStaticParams() {
//   // Fetch list of share IDs from your API
//   return [
//     { shareId: 'example1' },
//     { shareId: 'example2' },
//   ]
// }