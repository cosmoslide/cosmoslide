'use client';

import { useState } from 'react';
import { notesApi } from '@/lib/api';

interface NoteComposerProps {
  onNoteCreated?: (note: any) => void;
}

export function NoteComposer({ onNoteCreated }: NoteComposerProps) {
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'unlisted' | 'followers' | 'direct'>('public');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const note = await notesApi.create({
        content: content.trim(),
        visibility,
      });
      
      setContent('');
      onNoteCreated?.(note);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create note');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="mb-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={3}
          maxLength={500}
          disabled={isSubmitting}
        />
        <div className="text-right text-sm text-gray-500 dark:text-gray-400 mt-1">
          {content.length}/500
        </div>
      </div>

      {error && (
        <div className="mb-4 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as any)}
          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSubmitting}
        >
          <option value="public">Public</option>
          <option value="unlisted">Unlisted</option>
          <option value="followers">Followers only</option>
          <option value="direct">Direct</option>
        </select>

        <button
          type="submit"
          disabled={!content.trim() || isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Posting...' : 'Post'}
        </button>
      </div>
    </form>
  );
}