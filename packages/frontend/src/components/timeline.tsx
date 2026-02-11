import { useState, useEffect } from 'react';
import NoteCard from '@/components/note-card';
import { userApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { Note } from '@/lib/types';

interface TimelineProps {
  username: string;
  currentUserId?: string;
}

export default function Timeline({ username, currentUserId }: TimelineProps) {
  const [notes, setNotes] = useState<Note[]>([]);
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
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No posts yet</p>
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
          <Button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="rounded-full"
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  );
}
