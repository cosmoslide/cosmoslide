import type { Metadata } from 'next'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

async function fetchNoteData(id: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
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
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const note = await fetchNoteData(id)

  if (!note) {
    return {
      title: 'Note Not Found - Cosmoslide',
      description: 'This note could not be found.',
    }
  }

  const authorName = note.author?.displayName || note.author?.name || note.author?.username || 'Unknown'
  const authorUsername = note.author?.username || note.author?.preferredUsername || 'unknown'

  // Truncate content for description
  const contentPreview = note.content?.substring(0, 200) || 'A post on Cosmoslide'
  const fullContent = note.content || ''

  return {
    title: `${authorName} on Cosmoslide: "${contentPreview}${fullContent.length > 200 ? '...' : ''}"`,
    description: fullContent,
    openGraph: {
      title: `${authorName} (@${authorUsername})`,
      description: fullContent,
      type: 'article',
      publishedTime: note.createdAt,
      authors: [authorName],
      images: note.attachments?.map((a: { url: string }) => ({ url: a.url })) || [],
    },
    twitter: {
      card: note.attachments?.length > 0 ? 'summary_large_image' : 'summary',
      title: `${authorName} (@${authorUsername})`,
      description: contentPreview,
      images: note.attachments?.map((a: { url: string }) => a.url) || [],
    },
  }
}

export default function NoteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
