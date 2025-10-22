import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Settings - Cosmoslide',
  description: 'Manage your Cosmoslide account settings',
  openGraph: {
    title: 'Settings - Cosmoslide',
    description: 'Manage your Cosmoslide account settings',
  },
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
