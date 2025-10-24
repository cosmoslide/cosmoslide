'use client'

import { useState, useEffect } from 'react'
import { notesApi } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

interface NoteComposerProps {
  onNoteCreated?: (note: any) => void
  placeholder?: string
}

export default function NoteComposer({
  onNoteCreated,
  placeholder = "What's happening?"
}: NoteComposerProps) {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'unlisted' | 'followers' | 'direct'>('public')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.defaultVisibility) {
      setVisibility(user.defaultVisibility)
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) return
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      const note = await notesApi.create({
        content: content.trim(),
        visibility
      })
      
      setContent('')
      if (onNoteCreated) {
        onNoteCreated(note)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create note')
    } finally {
      setIsSubmitting(false)
    }
  }

  const remainingChars = 500 - content.length

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <div className="space-y-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          maxLength={500}
          rows={3}
          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          disabled={isSubmitting}
        />
        
        {error && (
          <div className="text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as any)}
              className="text-sm px-3 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 dark:text-gray-300"
              disabled={isSubmitting}
            >
              <option value="public">🌍 Public</option>
              <option value="unlisted">🔓 Unlisted</option>
              <option value="followers">👥 Followers only</option>
              <option value="direct">✉️ Direct</option>
            </select>
            
            <span className={`text-sm ${remainingChars < 50 ? 'text-orange-500' : 'text-gray-500 dark:text-gray-400'}`}>
              {remainingChars}
            </span>
          </div>
          
          <button
            type="submit"
            disabled={!content.trim() || isSubmitting || remainingChars < 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </form>
  )
}