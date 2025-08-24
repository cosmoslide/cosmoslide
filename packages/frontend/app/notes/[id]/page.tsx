'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { notesApi, authApi } from '@/lib/api'
import NoteComposer from '@/components/NoteComposer'

export default function NoteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const noteId = params.id as string
  
  const [note, setNote] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (noteId) {
      fetchNote()
      checkCurrentUser()
    }
  }, [noteId])

  const fetchNote = async () => {
    try {
      const data = await notesApi.getById(noteId)
      setNote(data)
    } catch (error) {
      setError('Failed to load note')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const checkCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        const user = await authApi.getMe()
        setCurrentUser(user)
      }
    } catch (error) {
      // User not logged in, that's okay
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this note?')) return
    
    setIsDeleting(true)
    try {
      await notesApi.delete(noteId)
      router.push(`/users/${note.author.username}`)
    } catch (error) {
      console.error('Failed to delete note:', error)
      setIsDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const visibilityIcon = {
    public: '🌍',
    unlisted: '🔓',
    followers: '👥',
    direct: '✉️'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !note) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Note not found'}</p>
          <Link href="/home" className="text-blue-600 hover:text-blue-500">
            Back to timeline
          </Link>
        </div>
      </div>
    )
  }

  const authorUsername = note.author?.username || note.author?.preferredUsername || 'unknown'
  const authorDisplayName = note.author?.displayName || note.author?.name || authorUsername
  const isOwner = currentUser && note.author?.id === currentUser.id

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            ← Back
          </button>
        </div>

        {/* Note Detail Card */}
        <article className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            {/* Author Info */}
            <div className="flex items-start space-x-3 mb-4">
              <Link href={`/users/${authorUsername}`} className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">
                    {authorUsername[0]?.toUpperCase() || '?'}
                  </span>
                </div>
              </Link>
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <Link href={`/users/${authorUsername}`} className="font-semibold text-gray-900 dark:text-white hover:underline">
                      {authorDisplayName}
                    </Link>
                    <p className="text-sm text-gray-500 dark:text-gray-400">@{authorUsername}</p>
                  </div>
                  
                  {isOwner && (
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="px-4 py-2 text-sm bg-red-600 text-white rounded-full hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Content Warning */}
            {note.contentWarning && (
              <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  ⚠️ Content Warning: {note.contentWarning}
                </p>
              </div>
            )}

            {/* Note Content */}
            <div className="mb-6">
              <p className="text-lg text-gray-900 dark:text-white whitespace-pre-wrap break-words">
                {note.content}
              </p>
            </div>

            {/* Metadata */}
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4">
              <time title={formatDate(note.createdAt)}>
                {formatDate(note.createdAt)}
              </time>
              <span className="flex items-center space-x-1">
                <span title={note.visibility}>{visibilityIcon[note.visibility] || ''}</span>
                <span className="capitalize">{note.visibility}</span>
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-6 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
                <span className="text-xl">💬</span>
                <span className="ml-1 text-sm">Reply</span>
              </button>
              <button className="text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 transition-colors">
                <span className="text-xl">🔄</span>
                <span className="ml-1 text-sm">Boost</span>
              </button>
              <button className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors">
                <span className="text-xl">❤️</span>
                <span className="ml-1 text-sm">Like</span>
              </button>
            </div>
          </div>
        </article>

        {/* Reply Composer */}
        {currentUser && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Reply to {authorDisplayName}
            </h3>
            <NoteComposer 
              placeholder={`Reply to @${authorUsername}...`}
              onNoteCreated={(newNote) => {
                // In the future, we'd add this as a reply
                console.log('Reply created:', newNote)
              }}
            />
          </div>
        )}

        {/* Replies Section */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Replies
          </h3>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No replies yet
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}