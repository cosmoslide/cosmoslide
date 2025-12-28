'use client';

import { useState, useEffect, useCallback } from 'react';
import { notesApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Note, NoteVisibility } from '@/lib/types';

interface NoteComposerProps {
  onNoteCreated?: (note: Note) => void;
  placeholder?: string;
}

export default function NoteComposer({
  onNoteCreated,
  placeholder = "What's happening?",
}: NoteComposerProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<
    'public' | 'unlisted' | 'followers' | 'direct'
  >('public');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preview state
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  useEffect(() => {
    if (user?.defaultVisibility) {
      setVisibility(user.defaultVisibility);
    }
  }, [user]);

  // Debounced preview fetching
  useEffect(() => {
    if (!showPreview || !content.trim()) {
      setPreviewHtml('');
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingPreview(true);
      try {
        const { html } = await notesApi.preview(content);
        setPreviewHtml(html);
      } catch (err) {
        console.error('Preview failed:', err);
        setPreviewHtml('<p class="text-red-500">Preview failed</p>');
      } finally {
        setIsLoadingPreview(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [content, showPreview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const note = await notesApi.create({
        content: content.trim(),
        contentType: 'text/markdown',
        visibility,
      });

      setContent('');
      setShowPreview(false);
      setPreviewHtml('');
      if (onNoteCreated) {
        onNoteCreated(note);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingChars = 500 - content.length;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4"
    >
      <div className="space-y-3">
        {/* Write/Preview tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setShowPreview(false)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              !showPreview
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              showPreview
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Preview
          </button>
        </div>

        {/* Editor or Preview */}
        {!showPreview ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            maxLength={500}
            rows={3}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            disabled={isSubmitting}
          />
        ) : (
          <div className="min-h-[76px] px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg">
            {isLoadingPreview ? (
              <p className="text-gray-500 dark:text-gray-400 italic">
                Loading preview...
              </p>
            ) : previewHtml ? (
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            ) : (
              <p className="text-gray-400 dark:text-gray-500 italic">
                Nothing to preview
              </p>
            )}
          </div>
        )}

        {/* Markdown help */}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Markdown:{' '}
          <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">
            **bold**
          </code>{' '}
          <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">
            *italic*
          </code>{' '}
          <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">
            [link](url)
          </code>{' '}
          <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">
            `code`
          </code>
        </div>

        {error && (
          <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as NoteVisibility)}
              className="text-sm px-3 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 dark:text-gray-300"
              disabled={isSubmitting}
            >
              <option value="public">Public</option>
              <option value="unlisted">Unlisted</option>
              <option value="followers">Followers only</option>
              <option value="direct">Direct</option>
            </select>

            <span
              className={`text-sm ${remainingChars < 50 ? 'text-orange-500' : 'text-gray-500 dark:text-gray-400'}`}
            >
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
  );
}
