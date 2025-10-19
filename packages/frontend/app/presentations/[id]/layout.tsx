import type { Metadata } from 'next'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

async function fetchPresentationData(id: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/presentations/${id}`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  const presentation = await fetchPresentationData(params.id)

  if (!presentation) {
    return {
      title: 'Presentation Not Found - Cosmoslide',
      description: 'This presentation could not be found.',
    }
  }

  const title = presentation.title || 'Untitled Presentation'
  const description = `View "${title}" on Cosmoslide`

  return {
    title: `${title} - Cosmoslide`,
    description: description,
    openGraph: {
      title: title,
      description: description,
      type: 'article',
      images: presentation.thumbnailUrl ? [{ url: presentation.thumbnailUrl }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: presentation.thumbnailUrl ? [presentation.thumbnailUrl] : [],
    },
  }
}

export default function PresentationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
