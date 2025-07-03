'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

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

    fetchUser(token)
  }, [])

  const fetchUser = async (token: string) => {
    try {
      const response = await fetch('http://localhost:3000/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        localStorage.removeItem('token')
        router.push('/auth/signin')
      }
    } catch (error) {
      console.error('Failed to fetch user', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/')
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
        <div className="py-12">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                Logout
              </button>
            </div>
            
            {user && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Welcome, {user.displayName || user.username}!</h2>
                  <p className="text-gray-600 dark:text-gray-400">@{user.username}</p>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{user.postsCount || 0}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Posts</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{user.followersCount || 0}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Followers</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{user.followingCount || 0}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Following</p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Federation Info</h3>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <p>Actor ID: {user.actorId}</p>
                    <p>Inbox: {user.inboxUrl}</p>
                    <p>Outbox: {user.outboxUrl}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}