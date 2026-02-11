import { createFileRoute } from '@tanstack/react-router';
import { useState, useCallback } from 'react';
import {
  useSuspenseQuery,
  useQueryClient,
  queryOptions,
} from '@tanstack/react-query';
import { notesApi } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import NoteCard from '@/components/note-card';
import AppLayout from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { Note } from '@/lib/types';

const publicTimelineQueryOptions = (limit: number, offset: number) =>
  queryOptions({
    queryKey: ['timeline', 'public', limit, offset],
    queryFn: () => notesApi.getPublicTimeline(limit, offset),
  });

export const Route = createFileRoute('/timeline/public')({
  loader: ({ context }) => {
    return context.queryClient.ensureQueryData(
      publicTimelineQueryOptions(20, 0),
    );
  },
  component: PublicTimelinePage,
});

function PublicTimelinePage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [offset, setOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const limit = 20;

  const handleRepost = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['timeline', 'public'] });
  }, [queryClient]);

  const { data } = useSuspenseQuery(publicTimelineQueryOptions(limit, 0));

  const notes: Note[] =
    allNotes.length > 0 ? allNotes : (data?.notes as Note[]) || [];
  const hasMore = (data?.notes?.length || 0) === limit;

  const handleLoadMore = async () => {
    setLoadingMore(true);
    const newOffset = offset + limit;
    try {
      const moreData = await notesApi.getPublicTimeline(limit, newOffset);
      setAllNotes((prev) => [
        ...(prev.length > 0 ? prev : data?.notes || []),
        ...(moreData.notes || []),
      ]);
      setOffset(newOffset);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Public Timeline</h1>
        </div>

        {/* Timeline */}
        <div className="space-y-2">
          {notes.length === 0 ? (
            <div className="bg-card rounded-lg p-8 text-center border">
              <p className="text-muted-foreground">No public posts yet</p>
            </div>
          ) : (
            <>
              {notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  currentUserId={currentUser?.id}
                  onRepost={handleRepost}
                  isAuthenticated={!!currentUser}
                />
              ))}

              {hasMore && (
                <div className="pt-4 flex justify-center">
                  <Button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    variant="default"
                  >
                    {loadingMore ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
