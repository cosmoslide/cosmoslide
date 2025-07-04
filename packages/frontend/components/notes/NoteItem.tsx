'use client';

import { useState } from 'react';
import { notesApi } from '@/lib/api';

interface NoteItemProps {
  note: {
    id: string;
    content: string;
    contentWarning?: string;
    visibility: string;
    createdAt: string;
    author: {
      username: string;
      displayName: string;
      avatarUrl?: string;
      actor?: {
        preferredUsername: string;
        name?: string;
        icon?: { url: string };
      };
    };
    likesCount: number;
    sharesCount: number;
    repliesCount: number;
  };
  currentUserId?: string;
  onDeleted?: (noteId: string) => void;
}

export function NoteItem({ note, currentUserId, onDeleted }: NoteItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const isOwner = currentUserId && note.authorId === currentUserId;
  
  // Add defensive checks for author
  if (!note.author) {
    console.error('Note missing author:', note);
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <p className="text-red-600">Error: Note data is incomplete</p>
      </div>
    );
  }
  
  const authorName = note.author.actor?.name || note.author.displayName;
  const authorUsername = note.author.actor?.preferredUsername || note.author.username;
  const authorAvatar = note.author.actor?.icon?.url || note.author.avatarUrl;

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    setIsDeleting(true);
    try {
      await notesApi.delete(note.id);
      onDeleted?.(note.id);
    } catch (err) {
      console.error('Failed to delete note:', err);
      alert('Failed to delete note');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) {
      return date.toLocaleDateString();
    } else if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'just now';
    }
  };

  return (
    <article className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {authorAvatar ? (
            <img
              src={authorAvatar}
              alt={authorName}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
              <span className="text-gray-600 dark:text-gray-300 font-semibold">
                {authorName[0].toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {authorName}
              </span>
              <span className="ml-1 text-gray-500 dark:text-gray-400">
                @{authorUsername}
              </span>
              <span className="mx-1 text-gray-400">·</span>
              <time className="text-gray-500 dark:text-gray-400 text-sm">
                {formatDate(note.createdAt)}
              </time>
            </div>

            {isOwner && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                title="Delete note"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>

          {note.contentWarning && (
            <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded text-yellow-800 dark:text-yellow-200 text-sm">
              CW: {note.contentWarning}
            </div>
          )}

          <div className="mt-2 text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
            {note.content}
          </div>

          <div className="mt-3 flex items-center space-x-6 text-gray-500 dark:text-gray-400">
            <button className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm">{note.repliesCount}</span>
            </button>

            <button className="flex items-center space-x-1 hover:text-green-600 dark:hover:text-green-400 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-sm">{note.sharesCount}</span>
            </button>

            <button className="flex items-center space-x-1 hover:text-red-600 dark:hover:text-red-400 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-sm">{note.likesCount}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}