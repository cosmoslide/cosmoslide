import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In - Cosmoslide',
  description: 'Sign in to Cosmoslide',
  openGraph: {
    title: 'Sign In - Cosmoslide',
    description: 'Sign in to Cosmoslide',
  },
}

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
