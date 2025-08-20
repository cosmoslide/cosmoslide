'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { userApi } from '@/lib/api'

export default function UserProfile() {
  const params = useParams()
  const username = params.username as string
  
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (username) {
      fetchUserProfile()
    }
  }, [username])

  const fetchUserProfile = async () => {
    try {
      const userData = await userApi.getProfile(username)
      setUser(userData)
    } catch (error) {
      setError('Failed to load user profile')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-600">{error || 'User not found'}</p>
          <a href="/" className="mt-4 inline-block text-blue-600 hover:text-blue-500">
            Back to home
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          {/* Profile Header */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden mb-6">
            {/* Cover image placeholder */}
            <div className="h-32 bg-gradient-to-r from-blue-400 to-purple-500"></div>
            
            <div className="px-6 pb-6">
              <div className="flex items-start -mt-12">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 rounded-full bg-gray-300 dark:bg-gray-600 border-4 border-white dark:border-gray-800 flex items-center justify-center">
                    <span className="text-3xl font-bold text-gray-600 dark:text-gray-300">
                      {username[0]?.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* User info */}
              <div className="mt-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {user.displayName || username}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">@{username}</p>
                
                {user.bio && (
                  <p className="mt-2 text-gray-700 dark:text-gray-300">{user.bio}</p>
                )}

                {/* Basic info */}
                <div className="flex items-center space-x-6 mt-4 text-sm text-gray-600 dark:text-gray-400">
                  <div>
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Placeholder for future content */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <p className="text-gray-600 dark:text-gray-400 text-center">
              User activity will appear here
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}