import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Upload Presentation - Cosmoslide',
  description: 'Share your presentations with the fediverse',
  openGraph: {
    title: 'Upload Presentation - Cosmoslide',
    description: 'Share your presentations with the fediverse',
  },
}

export default function UploadLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
