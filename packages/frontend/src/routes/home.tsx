import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notesApi } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { RequireAuth } from '@/components/require-auth';
import NoteComposer from '@/components/note-composer';
import NoteCard from '@/components/note-card';
import AppLayout from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { RefreshCw, Search, Package } from 'lucide-react';
import type { Note } from '@/lib/types';

export const Route = createFileRoute('/home')({
  component: HomePage,
});

function HomePage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['timeline', 'home'],
    queryFn: () => notesApi.getHomeTimeline(),
    enabled: typeof window !== 'undefined', // Only fetch on client
  });
  const [refreshing, setRefreshing] = useState(false);

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

  const handleRepost = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['timeline', 'home'] });
  }, [queryClient]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['timeline', 'home'] });
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  return (
    <AppLayout>
      <RequireAuth>
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold">Home</h1>
                {refreshing && <Spinner className="h-5 w-5" />}
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  title="Refresh timeline"
                >
                  <RefreshCw className="h-5 w-5" />
                </Button>
                {currentUser && (
                  <Link
                    to="/$username"
                    params={{ username: `@${currentUser.username}` }}
                    className="text-sm text-primary hover:underline"
                  >
                    @{currentUser.username}
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Note Composer */}
          <div className="mb-6">
            <NoteComposer onNoteCreated={handleNoteCreated} />
          </div>

          {/* Timeline */}
          <div className="space-y-2">
            {notes.length === 0 ? (
              <div className="bg-card rounded-lg p-8 text-center border">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Package className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Your timeline is empty
                </h3>
                <p className="text-muted-foreground mb-4">
                  Follow some users to see their posts here!
                </p>
                <Button asChild>
                  <Link to="/search">
                    <Search className="w-5 h-5 mr-2" />
                    Find people to follow
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                {notes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    currentUserId={currentUser?.id}
                    onDelete={handleDelete}
                    onRepost={handleRepost}
                    isAuthenticated={!!currentUser}
                  />
                ))}

                {/* Timeline Info */}
                <div className="mt-8 py-8 text-center text-sm text-muted-foreground">
                  <p>You're all caught up!</p>
                  <Button
                    variant="link"
                    onClick={handleRefresh}
                    className="mt-2"
                  >
                    Refresh timeline
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </RequireAuth>
    </AppLayout>
  );
}
