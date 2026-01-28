import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import {
  useSuspenseQuery,
  useQueryClient,
  queryOptions,
} from '@tanstack/react-query';
import { notesApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import NoteComposer from '@/components/NoteComposer';
import NoteCard from '@/components/NoteCard';
import NavigationHeader from '@/components/NavigationHeader';
import TimelineTabs from '@/components/TimelineTabs';
import type { Note } from '@/lib/types';

const homeTimelineQueryOptions = queryOptions({
  queryKey: ['timeline', 'home'],
  queryFn: () => notesApi.getHomeTimeline(),
});

export const Route = createFileRoute('/home')({
  beforeLoad: async () => {
    // Check authentication on client side
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (!token) {
        throw redirect({ to: '/auth/signin' });
      }
    }
  },
  loader: ({ context }) => {
    return context.queryClient.ensureQueryData(homeTimelineQueryOptions);
  },
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    user: currentUser,
    loading: authLoading,
    isAuthenticated,
  } = useAuth();
  const { data } = useSuspenseQuery(homeTimelineQueryOptions);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate({ to: '/auth/signin' });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const notes: Note[] = data?.notes || [];

  const handleNoteCreated = useCallback(async () => {
    // After creating a note, refresh the timeline to get it from the timeline service
    await queryClient.invalidateQueries({ queryKey: ['timeline', 'home'] });
  }, [queryClient]);

  const handleDelete = useCallback(
    (noteId: string) => {
      queryClient.setQueryData(
        ['timeline', 'home'],
        (old: { notes: Note[] } | undefined) => ({
          ...old,
          notes: (old?.notes || []).filter((note) => note.id !== noteId),
        }),
      );
    },
    [queryClient],
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['timeline', 'home'] });
    setRefreshing(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <NavigationHeader />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Home
                </h1>
                {refreshing && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white disabled:opacity-50"
                  title="Refresh timeline"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
                {currentUser && (
                  <Link
                    to="/$username"
                    params={{ username: `@${currentUser.username}` }}
                    className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    @{currentUser.username}
                  </Link>
                )}
              </div>
            </div>

            {/* Navigation Tabs */}
            <TimelineTabs activeTab="home" />
          </div>

          {/* Note Composer */}
          <div className="mb-6">
            <NoteComposer onNoteCreated={handleNoteCreated} />
          </div>

          {/* Timeline */}
          <div className="space-y-2">
            {notes.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Your timeline is empty
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Follow some users to see their posts here!
                </p>
                <Link
                  to="/search"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  Find people to follow
                </Link>
              </div>
            ) : (
              <>
                {notes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    currentUserId={currentUser?.id}
                    onDelete={handleDelete}
                  />
                ))}

                {/* Timeline Info */}
                <div className="mt-8 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  <p>You're all caught up!</p>
                  <button
                    onClick={handleRefresh}
                    className="mt-2 text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Refresh timeline
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
