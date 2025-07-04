'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { NoteComposer } from '@/components/notes/NoteComposer'
import { NotesList } from '@/components/notes/NotesList'
import { apiRequest, notesApi } from '@/lib/api'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [notesLoading, setNotesLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/signin')
      return
    }

    fetchUser()
    fetchHomeTimeline()
  }, [])

  const fetchUser = async () => {
    try {
      const userData = await apiRequest('/auth/me')
      setUser(userData)
    } catch (error) {
      console.error('Failed to fetch user', error)
      localStorage.removeItem('token')
      router.push('/auth/signin')
    } finally {
      setLoading(false)
    }
  }

  const fetchHomeTimeline = async () => {
    setNotesLoading(true)
    try {
      const { notes } = await notesApi.getHomeTimeline({ limit: 20 })
      setNotes(notes)
    } catch (error) {
      console.error('Failed to fetch timeline', error)
    } finally {
      setNotesLoading(false)
    }
  }

  const handleNoteCreated = (newNote: any) => {
    // Add the new note to the beginning of the timeline
    setNotes([newNote, ...notes])
    // Update user's notes count
    if (user) {
      setUser({ ...user, notesCount: (user.notesCount || 0) + 1 })
    }
  }

  const handleNoteDeleted = (noteId: string) => {
    setNotes(notes.filter(note => note.id !== noteId))
    if (user) {
      setUser({ ...user, notesCount: Math.max(0, (user.notesCount || 0) - 1) })
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Home</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Welcome back, {user?.displayName || user?.username}!
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push(`/users/${user?.username}`)}
                  className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  Logout
                </button>
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{user?.notesCount || 0}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Notes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{user?.followersCount || 0}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{user?.followingCount || 0}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Following</p>
              </div>
            </div>
          </div>

          {/* Note Composer */}
          <div className="mb-6">
            <NoteComposer onNoteCreated={handleNoteCreated} />
          </div>

          {/* Timeline */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Home Timeline
            </h2>
            {notesLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <NotesList
                notes={notes}
                currentUserId={user?.id}
                onNoteDeleted={handleNoteDeleted}
                emptyMessage="No notes in your timeline yet. Follow some users or create your first note!"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}