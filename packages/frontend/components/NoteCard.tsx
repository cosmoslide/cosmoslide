'use client'

import Link from 'next/link'
import { useState } from 'react'
import { notesApi } from '@/lib/api'

interface NoteCardProps {
  note: {
    id: string
    content: string
    contentWarning?: string
    visibility: string
    createdAt: string
    author?: {
      id: string
      username: string
      displayName?: string
      actor?: {
        preferredUsername: string
        name?: string
      }
    }
  }
  currentUserId?: string
  onDelete?: (noteId: string) => void
}

export default function NoteCard({ note, currentUserId, onDelete }: NoteCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showContent, setShowContent] = useState(!note.contentWarning)

  const authorUsername = note.author?.username || note.author?.actor?.preferredUsername || 'unknown'
  const authorDisplayName = note.author?.displayName || note.author?.actor?.name || authorUsername
  const isOwner = currentUserId && note.author?.id === currentUserId

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this note?')) return
    
    setIsDeleting(true)
    try {
      await notesApi.delete(note.id)
      if (onDelete) {
        onDelete(note.id)
      }
    } catch (error) {
      console.error('Failed to delete note:', error)
      setIsDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSecs < 60) return 'just now'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  const visibilityIcon = {
    public: '🌍',
    unlisted: '🔓',
    followers: '👥',
    direct: '✉️'
  }

  return (
    <article className="bg-white dark:bg-gray-800 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      <div className="flex space-x-3">
        {/* Avatar */}
        <Link href={`/users/${authorUsername}`} className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-semibold text-lg">
              {authorUsername[0]?.toUpperCase() || '?'}
            </span>
          </div>
        </Link>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-1 text-sm">
              <Link href={`/users/${authorUsername}`} className="font-semibold text-gray-900 dark:text-white hover:underline">
                {authorDisplayName}
              </Link>
              <span className="text-gray-500 dark:text-gray-400">@{authorUsername}</span>
              <span className="text-gray-500 dark:text-gray-400">·</span>
              <time className="text-gray-500 dark:text-gray-400" title={new Date(note.createdAt).toLocaleString()}>
                {formatDate(note.createdAt)}
              </time>
              <span className="text-gray-500 dark:text-gray-400" title={note.visibility}>
                {visibilityIcon[note.visibility] || ''}
              </span>
            </div>
            
            {isOwner && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                title="Delete note"
              >
                {isDeleting ? '...' : '🗑️'}
              </button>
            )}
          </div>
          
          {/* Content Warning */}
          {note.contentWarning && (
            <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                ⚠️ {note.contentWarning}
              </p>
              {!showContent && (
                <button
                  onClick={() => setShowContent(true)}
                  className="mt-1 text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Show content
                </button>
              )}
            </div>
          )}
          
          {/* Note Content */}
          {showContent && (
            <div className="mt-2">
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap break-words">
                {note.content}
              </p>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}