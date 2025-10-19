import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Search - Cosmoslide',
  description: 'Search for users and posts on Cosmoslide',
  openGraph: {
    title: 'Search - Cosmoslide',
    description: 'Search for users and posts on Cosmoslide',
  },
}

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
