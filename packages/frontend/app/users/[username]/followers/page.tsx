'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { userApi } from '@/lib/api'
import UserCard from '@/components/UserCard'

export default function FollowersPage() {
  const params = useParams()
  const username = params.username as string
  
  const [followers, setFollowers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [offset, setOffset] = useState(0)
  
  const limit = 20

  useEffect(() => {
    if (username) {
      fetchFollowers()
    }
  }, [username])

  const fetchFollowers = async (loadMore = false) => {
    if (loadMore) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }
    
    try {
      const currentOffset = loadMore ? offset : 0
      const data = await userApi.getFollowers(username, limit, currentOffset)
      
      if (loadMore) {
        setFollowers(prev => [...prev, ...data.items])
      } else {
        setFollowers(data.items || [])
      }
      
      setHasMore(data.items?.length === limit)
      setOffset(currentOffset + limit)
    } catch (error) {
      setError('Failed to load followers')
      console.error(error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchFollowers(true)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href={`/users/${username}`} className="text-blue-600 hover:text-blue-500">
            Back to profile
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link 
            href={`/users/${username}`}
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            ← Back to @{username}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Followers
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            People following @{username}
          </p>
        </div>

        {/* Followers List */}
        <div className="space-y-2">
          {followers.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                No followers yet
              </p>
            </div>
          ) : (
            <>
              {followers.map((follower, index) => (
                <UserCard key={`${follower.username}-${index}`} user={follower} />
              ))}
              
              {hasMore && (
                <div className="pt-4 flex justify-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loadingMore ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}