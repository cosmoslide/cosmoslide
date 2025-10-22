import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Home Timeline - Cosmoslide',
  description: 'Your personalized feed on Cosmoslide',
  openGraph: {
    title: 'Home Timeline - Cosmoslide',
    description: 'Your personalized feed on Cosmoslide',
  },
}

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
