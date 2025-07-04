'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { NotesList } from '@/components/notes/NotesList'
import { apiRequest, notesApi } from '@/lib/api'

export default function UserProfile() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string
  
  const [user, setUser] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [notesLoading, setNotesLoading] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)

  useEffect(() => {
    if (username) {
      fetchUserProfile()
      fetchUserNotes()
      checkIfFollowing()
    }
  }, [username])

  const fetchUserProfile = async () => {
    try {
      // For now, we'll use a simple approach
      // In a real app, you'd have a dedicated endpoint for user profiles
      const token = localStorage.getItem('token')
      if (token) {
        const me = await apiRequest('/auth/me')
        setCurrentUser(me)
        if (me.username === username) {
          setUser(me)
        }
      }
      // TODO: Fetch other users' profiles once we have the endpoint
    } catch (error) {
      console.error('Failed to fetch user profile', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserNotes = async () => {
    setNotesLoading(true)
    try {
      const { notes } = await notesApi.getUserNotes(username, { limit: 20 })
      setNotes(notes)
    } catch (error) {
      console.error('Failed to fetch user notes', error)
    } finally {
      setNotesLoading(false)
    }
  }

  const checkIfFollowing = async () => {
    // TODO: Implement follow status check
  }

  const handleFollow = async () => {
    // TODO: Implement follow/unfollow functionality
    alert('Follow functionality coming soon!')
  }

  const handleNoteDeleted = (noteId: string) => {
    setNotes(notes.filter(note => note.id !== noteId))
    if (user && currentUser?.id === user.id) {
      setUser({ ...user, notesCount: Math.max(0, (user.notesCount || 0) - 1) })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const isOwnProfile = currentUser?.username === username

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

                {/* Actions */}
                <div className="ml-auto mt-16 flex items-center space-x-2">
                  {isOwnProfile ? (
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Back to Dashboard
                    </button>
                  ) : currentUser ? (
                    <button
                      onClick={handleFollow}
                      className={`px-4 py-2 text-sm rounded-md ${
                        isFollowing
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                  ) : null}
                </div>
              </div>

              {/* User info */}
              <div className="mt-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {user?.displayName || username}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">@{username}</p>
                
                {user?.bio && (
                  <p className="mt-2 text-gray-700 dark:text-gray-300">{user.bio}</p>
                )}

                {/* Stats */}
                <div className="flex items-center space-x-6 mt-4 text-sm">
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {notes.length}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 ml-1">Notes</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {user?.followersCount || 0}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 ml-1">Followers</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {user?.followingCount || 0}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 ml-1">Following</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* User's Notes */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Notes
            </h2>
            {notesLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <NotesList
                notes={notes}
                currentUserId={currentUser?.id}
                onNoteDeleted={handleNoteDeleted}
                emptyMessage={`@${username} hasn't posted any notes yet.`}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}