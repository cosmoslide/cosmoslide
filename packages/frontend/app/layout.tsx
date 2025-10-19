import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Cosmoslide',
  description: 'A federated platform for sharing slides and connecting with others',
  openGraph: {
    title: 'Cosmoslide',
    description: 'A federated platform for sharing slides and connecting with others',
    type: 'website',
    locale: 'en_US',
    siteName: 'Cosmoslide',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cosmoslide',
    description: 'A federated platform for sharing slides and connecting with others',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  )
}