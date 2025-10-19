import type { Metadata } from 'next'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

async function fetchUserData(username: string) {
  try {
    // Remove @ prefix if present
    const cleanUsername = username.startsWith('@') ? username.substring(1) : username

    const response = await fetch(`${API_BASE_URL}/users/${cleanUsername}`, {
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
  params: { username: string }
}): Promise<Metadata> {
  const user = await fetchUserData(params.username)

  if (!user) {
    return {
      title: 'User Not Found - Cosmoslide',
      description: 'This user profile could not be found.',
    }
  }

  const displayName = user.displayName || user.name || user.username
  const username = user.username || user.preferredUsername
  const bio = user.bio || user.summary || `${displayName}'s profile on Cosmoslide`

  return {
    title: `${displayName} (@${username}) - Cosmoslide`,
    description: bio,
    openGraph: {
      title: `${displayName} (@${username})`,
      description: bio,
      type: 'profile',
      images: user.avatar ? [{ url: user.avatar }] : [],
    },
    twitter: {
      card: 'summary',
      title: `${displayName} (@${username})`,
      description: bio,
      images: user.avatar ? [user.avatar] : [],
    },
  }
}

export default function UserProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
