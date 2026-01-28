import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import {
  useSuspenseQuery,
  useQueryClient,
  queryOptions,
} from '@tanstack/react-query';
import { notesApi } from '@/lib/api';
import NoteCard from '@/components/NoteCard';
import NavigationHeader from '@/components/NavigationHeader';
import TimelineTabs from '@/components/TimelineTabs';
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
  const [offset, setOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const limit = 20;

  const { data } = useSuspenseQuery(publicTimelineQueryOptions(limit, 0));

  const notes = allNotes.length > 0 ? allNotes : data?.notes || [];
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
    <>
      <NavigationHeader />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Public Timeline
            </h1>

            {/* Navigation Tabs */}
            <TimelineTabs activeTab="public" />
          </div>

          {/* Timeline */}
          <div className="space-y-2">
            {notes.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  No public posts yet
                </p>
              </div>
            ) : (
              <>
                {notes.map((note) => (
                  <NoteCard key={note.id} note={note} />
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
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
