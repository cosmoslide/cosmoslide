'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/signin')
      return
    }

    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const userData = await authApi.getMe()
      setUser(userData)
    } catch (error) {
      console.error('Failed to fetch user', error)
      localStorage.removeItem('token')
      router.push('/auth/signin')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = () => {
    localStorage.removeItem('token')
    router.push('/auth/signin')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Sign Out
            </button>
          </div>

          {/* User Info Card */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-600 dark:text-gray-300">
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {user?.displayName || user?.username}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">@{user?.username}</p>
                {user?.bio && (
                  <p className="mt-2 text-gray-700 dark:text-gray-300">{user.bio}</p>
                )}
                <div className="mt-4">
                  <a
                    href={`/users/${user?.username}`}
                    className="text-blue-600 hover:text-blue-500 text-sm"
                  >
                    View Public Profile →
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Feed Placeholder */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Activity Feed
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              Your activity feed will appear here once federation features are enabled.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}