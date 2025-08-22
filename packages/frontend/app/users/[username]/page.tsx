'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { userApi, authApi } from '@/lib/api'

export default function UserProfile() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string
  
  const [user, setUser] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [followLoading, setFollowLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (username) {
      fetchUserProfile()
      checkCurrentUser()
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

  const checkCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        const me = await authApi.getMe()
        setCurrentUser(me)
        
        // Check if following this user
        if (me.username !== username) {
          const followStatus = await userApi.getFollowStatus(username)
          setIsFollowing(followStatus.isFollowing)
        }
      }
    } catch (error) {
      // User not logged in, that's okay
    }
  }

  const handleFollow = async () => {
    if (!currentUser) {
      router.push('/auth/signin')
      return
    }

    setFollowLoading(true)
    try {
      if (isFollowing) {
        await userApi.unfollowUser(username)
        setIsFollowing(false)
        setUser(prev => ({
          ...prev,
          followersCount: Math.max(0, prev.followersCount - 1)
        }))
      } else {
        await userApi.followUser(username)
        setIsFollowing(true)
        setUser(prev => ({
          ...prev,
          followersCount: prev.followersCount + 1
        }))
      }
    } catch (error) {
      console.error('Failed to update follow status', error)
    } finally {
      setFollowLoading(false)
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
          <p className="text-red-600 mb-4">{error || 'User not found'}</p>
          <a href="/" className="text-blue-600 hover:text-blue-500">
            Back to home
          </a>
        </div>
      </div>
    )
  }

  const isOwnProfile = currentUser?.username === username

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="h-24 bg-gradient-to-r from-blue-500 to-purple-600"></div>
          
          {/* Profile Info */}
          <div className="px-6 pb-6">
            {/* Avatar and Follow Button */}
            <div className="flex items-end justify-between -mt-12 mb-4">
              <div className="w-20 h-20 rounded-full bg-white dark:bg-gray-700 border-4 border-white dark:border-gray-800 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-600 dark:text-gray-300">
                  {username[0]?.toUpperCase()}
                </span>
              </div>
              
              {!isOwnProfile && (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`px-6 py-2 rounded-full font-medium transition-colors ${
                    isFollowing
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
              
              {isOwnProfile && (
                <a
                  href="/dashboard"
                  className="px-6 py-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 font-medium transition-colors"
                >
                  Edit Profile
                </a>
              )}
            </div>
            
            {/* Name and Username */}
            <div className="mb-4">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {user.displayName || username}
              </h1>
              <p className="text-gray-500 dark:text-gray-400">@{username}</p>
            </div>
            
            {/* Bio */}
            {user.bio && (
              <p className="text-gray-700 dark:text-gray-300 mb-4">{user.bio}</p>
            )}
            
            {/* Stats */}
            <div className="flex gap-6 text-sm">
              <div>
                <span className="font-bold text-gray-900 dark:text-white">
                  {user.postsCount || 0}
                </span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">posts</span>
              </div>
              <div>
                <span className="font-bold text-gray-900 dark:text-white">
                  {user.followersCount || 0}
                </span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">followers</span>
              </div>
              <div>
                <span className="font-bold text-gray-900 dark:text-white">
                  {user.followingCount || 0}
                </span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">following</span>
              </div>
            </div>
            
            {/* Joined Date */}
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Joined {new Date(user.createdAt).toLocaleDateString('en-US', { 
                month: 'long',
                year: 'numeric' 
              })}
            </div>
          </div>
        </div>
        
        {/* Activity Placeholder */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No posts yet
          </p>
        </div>
      </div>
    </div>
  )
}