'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { NotesList } from '@/components/notes/NotesList'
import { apiRequest, notesApi } from '@/lib/api'

export default function PublicTimeline() {
  const [notes, setNotes] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchPublicTimeline()
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const userData = await apiRequest('/auth/me')
        setCurrentUser(userData)
      } catch (error) {
        console.error('Failed to fetch user', error)
      }
    }
  }

  const fetchPublicTimeline = async () => {
    setLoading(true)
    try {
      const { notes } = await notesApi.getPublicTimeline({ limit: 50 })
      setNotes(notes)
    } catch (error) {
      console.error('Failed to fetch public timeline', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNoteDeleted = (noteId: string) => {
    setNotes(notes.filter(note => note.id !== noteId))
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Public Timeline</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  See what everyone is talking about
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {currentUser ? (
                  <>
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      Home
                    </button>
                    <button
                      onClick={() => router.push(`/users/${currentUser.username}`)}
                      className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      Profile
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => router.push('/auth/signin')}
                      className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => router.push('/auth/signup')}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <NotesList
                notes={notes}
                currentUserId={currentUser?.id}
                onNoteDeleted={handleNoteDeleted}
                emptyMessage="No public notes yet."
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}