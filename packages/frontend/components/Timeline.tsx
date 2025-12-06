'use client';

import { useState, useEffect } from 'react';
import NoteCard from './NoteCard';
import { userApi } from '@/lib/api';

interface TimelineProps {
  username: string;
  currentUserId?: string;
}

export default function Timeline({ username, currentUserId }: TimelineProps) {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const limit = 20;

  useEffect(() => {
    fetchNotes();
  }, [username]);

  const fetchNotes = async (loadMore = false) => {
    if (loadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setOffset(0);
    }

    try {
      const currentOffset = loadMore ? offset : 0;
      const data = await userApi.getUserNotes(username, limit, currentOffset);

      if (loadMore) {
        setNotes((prev) => [...prev, ...(data.notes || [])]);
      } else {
        setNotes(data.notes || []);
      }

      setHasMore((data.notes?.length || 0) === limit);
      setOffset(currentOffset + limit);
    } catch (error) {
      setError('Failed to load notes');
      console.error(error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleDelete = (noteId: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== noteId));
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchNotes(true);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">No posts yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          currentUserId={currentUserId}
          onDelete={handleDelete}
        />
      ))}

      {hasMore && (
        <div className="pt-4 flex justify-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
