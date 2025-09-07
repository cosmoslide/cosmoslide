'use client';

import Link from 'next/link';
import { useState } from 'react';
import { notesApi } from '@/lib/api';

interface NoteCardProps {
  note: {
    id: string;
    content: string;
    contentWarning?: string;
    visibility: string;
    createdAt: string;
    isShared?: boolean;
    sharedBy?: {
      id: string;
      username: string;
      displayName?: string;
      preferredUsername?: string;
      name?: string;
    };
    sharedNote?: {
      id: string;
      content: string;
      contentWarning?: string;
      visibility: string;
      createdAt: string;
      author?: {
        id: string;
        username: string;
        displayName?: string;
        preferredUsername?: string;
        name?: string;
      };
    };
    author?: {
      id: string;
      username: string;
      displayName?: string;
      actor?: {
        preferredUsername: string;
        name?: string;
      };
    };
  };
  currentUserId?: string;
  onDelete?: (noteId: string) => void;
}

export default function NoteCard({
  note,
  currentUserId,
  onDelete,
}: NoteCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  
  // For shared posts, we need to handle the original content
  const displayNote = note.isShared && note.sharedNote ? note.sharedNote : note;
  const [showContent, setShowContent] = useState(!displayNote.contentWarning);

  // Get the author info (for shared posts, this is the original author)
  const authorUsername =
    displayNote.author?.username || displayNote.author?.preferredUsername || displayNote.author?.actor?.preferredUsername || 'unknown';
  const authorDisplayName =
    displayNote.author?.displayName || displayNote.author?.name || displayNote.author?.actor?.name || authorUsername;
  const authorAcct = displayNote.author?.acct || displayNote.author?.actor?.acct || `@${authorUsername}`;
  
  // Get sharer info if this is a shared post
  const sharerUsername = note.sharedBy?.username || note.sharedBy?.preferredUsername || '';
  const sharerDisplayName = note.sharedBy?.displayName || note.sharedBy?.name || sharerUsername;
  
  // Parse acct to determine if it's a remote actor
  // acct format: @username@domain for remote, @username for local
  const isRemoteAuthor = authorAcct.split('@').length > 2;
  
  // Build the profile path based on whether it's local or remote
  const authorProfilePath = isRemoteAuthor ? `/${authorAcct}` : `/@${authorUsername}`;
  const sharerProfilePath = sharerUsername ? `/@${sharerUsername}` : '';
  
  const authorHandle = authorAcct;
  
  const isOwner = currentUserId && (note.author?.id === currentUserId || note.sharedBy?.id === currentUserId);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;

    setIsDeleting(true);
    try {
      await notesApi.delete(note.id);
      if (onDelete) {
        onDelete(note.id);
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const visibilityIcon = {
    public: '🌍',
    unlisted: '🔓',
    followers: '👥',
    direct: '✉️',
  };

  return (
    <article className="bg-white dark:bg-gray-800 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
      {/* Shared post indicator */}
      {note.isShared && note.sharedBy && (
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-2 ml-12">
          <span className="text-green-600 dark:text-green-400">🔁</span>
          <a
            href={sharerProfilePath}
            className="hover:underline"
          >
            {sharerDisplayName} reblogged
          </a>
        </div>
      )}
      
      <div className="flex space-x-3">
        {/* Avatar */}
        <a href={authorProfilePath} className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-semibold text-lg">
              {authorUsername[0]?.toUpperCase() || '?'}
            </span>
          </div>
        </a>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-1 text-sm">
              <a
                href={authorProfilePath}
                className="font-semibold text-gray-900 dark:text-white hover:underline"
              >
                {authorDisplayName}
              </a>
              {note.author?.manuallyApprovesFollowers && (
                <svg 
                  className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                  title="Private Account"
                >
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              )}
              <span className="text-gray-500 dark:text-gray-400">
                {authorHandle}
              </span>
              <span className="text-gray-500 dark:text-gray-400">·</span>
              <time
                className="text-gray-500 dark:text-gray-400"
                title={new Date(displayNote.createdAt).toLocaleString()}
              >
                {formatDate(displayNote.createdAt)}
              </time>
              <span
                className="text-gray-500 dark:text-gray-400"
                title={displayNote.visibility}
              ></span>
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
          {displayNote.contentWarning && (
            <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                ⚠️ {displayNote.contentWarning}
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

          {/* Note Content - Clickable to go to detail page */}
          {showContent && (
            <Link
              href={`/notes/${displayNote.id}`}
              className="block mt-2 hover:opacity-90"
            >
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap break-words">
                {displayNote.content}
              </p>
            </Link>
          )}

          {/* Actions Bar */}
          <div className="flex items-center space-x-6 mt-3 text-sm">
            <button
              onClick={(e) => e.stopPropagation()}
              className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
              title="Reply"
            >
              💬
            </button>
            <button
              onClick={(e) => e.stopPropagation()}
              className="text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 transition-colors"
              title="Boost"
            >
              🔄
            </button>
            <button
              onClick={(e) => e.stopPropagation()}
              className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
              title="Like"
            >
              ❤️
            </button>
            <Link
              href={`/notes/${displayNote.id}`}
              className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors ml-auto"
              title="View details"
            >
              →
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
