'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authApi, notesApi } from '@/lib/api'
import NoteComposer from '@/components/NoteComposer'
import NoteCard from '@/components/NoteCard'
import NavigationHeader from '@/components/NavigationHeader'
import Link from 'next/link'

export default function HomePage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [offset, setOffset] = useState(0)
  
  const limit = 20

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/signin')
        return
      }
      
      const user = await authApi.getMe()
      setCurrentUser(user)
      await fetchTimeline()
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/auth/signin')
    }
  }

  const fetchTimeline = async (loadMore = false) => {
    if (loadMore) {
      setLoadingMore(true)
    } else {
      setLoading(true)
      setOffset(0)
    }
    
    try {
      const currentOffset = loadMore ? offset : 0
      const data = await notesApi.getHomeTimeline(limit, currentOffset)
      
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

  const handleNoteCreated = (newNote: any) => {
    // Add the new note to the top of the timeline
    setNotes(prev => [newNote, ...prev])
  }

  const handleDelete = (noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId))
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
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Home
            </h1>
            {currentUser && (
              <Link 
                href={`/@${currentUser.username}`}
                className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                @{currentUser.username}
              </Link>
            )}
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex space-x-6 border-b border-gray-200 dark:border-gray-700">
            <button className="pb-3 px-1 border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 font-medium">
              For You
            </button>
            <Link 
              href="/timeline/public"
              className="pb-3 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Public
            </Link>
          </div>
        </div>

        {/* Note Composer */}
        <div className="mb-6">
          <NoteComposer onNoteCreated={handleNoteCreated} />
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
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Your timeline is empty
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Follow some users to see their posts here!
              </p>
            </div>
          ) : (
            <>
              {notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  currentUserId={currentUser?.id}
                  onDelete={handleDelete}
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