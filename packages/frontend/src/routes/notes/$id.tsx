import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProfileLink from '@/components/ProfileLink';
import { notesApi } from '@/lib/api';
import NoteComposer from '@/components/NoteComposer';
import AppLayout from '@/components/AppLayout';

export const Route = createFileRoute('/notes/$id')({
  component: NoteDetailPage,
});

function NoteDetailPage() {
  const { id: noteId } = Route.useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [note, setNote] = useState<{
    id: string;
    content: string;
    contentWarning?: string;
    visibility: string;
    createdAt: string;
    sharesCount?: number;
    isReposted?: boolean;
    author?: {
      id?: string;
      username?: string;
      preferredUsername?: string;
      displayName?: string;
      name?: string;
      icon?: { url?: string };
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReposted, setIsReposted] = useState(false);
  const [sharesCount, setSharesCount] = useState(0);
  const [isReposting, setIsReposting] = useState(false);

  useEffect(() => {
    if (noteId) {
      fetchNote();
    }
  }, [noteId]);

  const fetchNote = async () => {
    try {
      const data = await notesApi.getById(noteId);
      setNote(data);
      setIsReposted(data.isReposted || false);
      setSharesCount(data.sharesCount || 0);
    } catch (error) {
      setError('Failed to load note');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRepost = async () => {
    if (!currentUser || isReposting) return;

    setIsReposting(true);
    const wasReposted = isReposted;

    // Optimistic update
    setIsReposted(!wasReposted);
    setSharesCount((prev) => (wasReposted ? Math.max(0, prev - 1) : prev + 1));

    try {
      if (wasReposted) {
        await notesApi.undoRepost(noteId);
      } else {
        await notesApi.repost(noteId);
      }
    } catch (error) {
      // Revert on error
      setIsReposted(wasReposted);
      setSharesCount((prev) =>
        wasReposted ? prev + 1 : Math.max(0, prev - 1),
      );
      console.error('Failed to repost:', error);
    } finally {
      setIsReposting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;

    setIsDeleting(true);
    try {
      await notesApi.delete(noteId);
      const author = note?.author as { username?: string } | undefined;
      navigate({
        to: '/$username',
        params: { username: `@${author?.username || ''}` },
      });
    } catch (error) {
      console.error('Failed to delete note:', error);
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const visibilityIcon: Record<string, string> = {
    public: '🌍',
    unlisted: '🔓',
    followers: '👥',
    direct: '✉️',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">
            {error || 'Note not found'}
          </p>
          <Link to="/home" className="text-blue-600 hover:text-blue-500">
            Back to timeline
          </Link>
        </div>
      </div>
    );
  }

  const author = note.author;
  const authorUsername =
    author?.username || author?.preferredUsername || 'unknown';
  const authorDisplayName =
    author?.displayName || author?.name || authorUsername;
  const isOwner = currentUser && author?.id === currentUser.id;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate({ to: '/home' })}
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            ← Back
          </button>
        </div>

        <article className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex items-start space-x-3 mb-4">
              <ProfileLink username={authorUsername} className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  {author?.icon?.url ? (
                    <img
                      src={author.icon.url}
                      alt={authorUsername}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <span className="text-white font-semibold text-lg">
                      {authorUsername[0]?.toUpperCase() || '?'}
                    </span>
                  )}
                </div>
              </ProfileLink>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <ProfileLink
                      username={authorUsername}
                      className="font-semibold text-gray-900 dark:text-white hover:underline"
                    >
                      {authorDisplayName}
                    </ProfileLink>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      @{authorUsername}
                    </p>
                  </div>

                  {isOwner && (
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="px-4 py-2 text-sm bg-red-600 text-white rounded-full hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {note.contentWarning && (
              <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  ⚠️ Content Warning: {note.contentWarning}
                </p>
              </div>
            )}

            <div className="mb-6">
              <div
                className="note-content text-lg text-gray-900 dark:text-white whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{ __html: note.content }}
              />
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4">
              <time title={formatDate(note.createdAt)}>
                {formatDate(note.createdAt)}
              </time>
              <span className="flex items-center space-x-1">
                <span title={note.visibility}>
                  {visibilityIcon[note.visibility] || ''}
                </span>
                <span className="capitalize">{note.visibility}</span>
              </span>
            </div>

            <div className="flex items-center space-x-6 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
                <span className="text-xl">💬</span>
                <span className="ml-1 text-sm">Reply</span>
              </button>
              <button
                onClick={handleRepost}
                disabled={!currentUser || isReposting}
                className={`flex items-center transition-colors ${
                  isReposted
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400'
                } ${!currentUser ? 'opacity-50 cursor-default' : ''}`}
                title={isReposted ? 'Undo boost' : 'Boost'}
              >
                <span className="text-xl">🔄</span>
                <span className="ml-1 text-sm">
                  {isReposted ? 'Boosted' : 'Boost'}
                  {sharesCount > 0 && ` (${sharesCount})`}
                </span>
              </button>
              <button className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors">
                <span className="text-xl">❤️</span>
                <span className="ml-1 text-sm">Like</span>
              </button>
            </div>
          </div>
        </article>

        {currentUser && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Reply to {authorDisplayName}
            </h3>
            <NoteComposer
              placeholder={`Reply to @${authorUsername}...`}
              onNoteCreated={(newNote) =>
                console.log('Reply created:', newNote)
              }
            />
          </div>
        )}

        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Replies
          </h3>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">No replies yet</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
