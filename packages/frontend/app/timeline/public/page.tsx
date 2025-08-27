'use client'

import { useState, useEffect } from 'react'
import { notesApi } from '@/lib/api'
import NoteCard from '@/components/NoteCard'
import NavigationHeader from '@/components/NavigationHeader'
import Link from 'next/link'

export default function PublicTimelinePage() {
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [offset, setOffset] = useState(0)
  
  const limit = 20

  useEffect(() => {
    fetchTimeline()
  }, [])

  const fetchTimeline = async (loadMore = false) => {
    if (loadMore) {
      setLoadingMore(true)
    } else {
      setLoading(true)
      setOffset(0)
    }
    
    try {
      const currentOffset = loadMore ? offset : 0
      const data = await notesApi.getPublicTimeline(limit, currentOffset)
      
      if (loadMore) {
        setNotes(prev => [...prev, ...(data.notes || [])])
      } else {
        setNotes(data.notes || [])
      }
      
      setHasMore((data.notes?.length || 0) === limit)
      setOffset(currentOffset + limit)
    } catch (error) {
      setError('Failed to load timeline')
      console.error(error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchTimeline(true)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <>
      <NavigationHeader />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Public Timeline
          </h1>
          
          {/* Navigation Tabs */}
          <div className="flex space-x-6 border-b border-gray-200 dark:border-gray-700">
            <Link 
              href="/home"
              className="pb-3 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              For You
            </Link>
            <button className="pb-3 px-1 border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 font-medium">
              Public
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-2">
          {error ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <button 
                onClick={() => fetchTimeline()}
                className="mt-4 text-blue-600 hover:text-blue-500"
              >
                Try again
              </button>
            </div>
          ) : notes.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                No public posts yet
              </p>
            </div>
          ) : (
            <>
              {notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                />
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
    </>
  )
}