import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProfileLink from '@/components/ProfileLink';
import { notesApi } from '@/lib/api';
import NoteComposer from '@/components/NoteComposer';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MessageCircle,
  Repeat2,
  Heart,
  Trash2,
  Globe,
  Lock,
  Users,
  Mail,
} from 'lucide-react';

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

  const visibilityConfig: Record<
    string,
    { icon: React.ReactNode; label: string }
  > = {
    public: { icon: <Globe className="w-4 h-4" />, label: 'Public' },
    unlisted: { icon: <Lock className="w-4 h-4" />, label: 'Unlisted' },
    followers: { icon: <Users className="w-4 h-4" />, label: 'Followers' },
    direct: { icon: <Mail className="w-4 h-4" />, label: 'Direct' },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || 'Note not found'}</p>
          <Button asChild variant="link">
            <Link to="/home">Back to timeline</Link>
          </Button>
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
  const visibilityInfo =
    visibilityConfig[note.visibility] || visibilityConfig.public;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: '/home' })}
          >
            ← Back
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start space-x-3 mb-4">
              <ProfileLink username={authorUsername} className="flex-shrink-0">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={author?.icon?.url} alt={authorUsername} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {authorUsername[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
              </ProfileLink>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <ProfileLink
                      username={authorUsername}
                      className="font-semibold text-foreground hover:underline"
                    >
                      {authorDisplayName}
                    </ProfileLink>
                    <p className="text-sm text-muted-foreground">
                      @{authorUsername}
                    </p>
                  </div>

                  {isOwner && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {note.contentWarning && (
              <Alert className="mb-4">
                <AlertDescription>
                  ⚠️ Content Warning: {note.contentWarning}
                </AlertDescription>
              </Alert>
            )}

            <div className="mb-6">
              <div
                className="note-content text-lg text-foreground whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{ __html: note.content }}
              />
            </div>

            <Separator className="my-4" />

            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <time title={formatDate(note.createdAt)}>
                {formatDate(note.createdAt)}
              </time>
              <Badge variant="secondary" className="flex items-center gap-1">
                {visibilityInfo.icon}
                <span>{visibilityInfo.label}</span>
              </Badge>
            </div>

            <Separator className="my-4" />

            <div className="flex items-center space-x-6">
              <Button variant="ghost" size="sm">
                <MessageCircle className="w-4 h-4 mr-2" />
                Reply
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRepost}
                disabled={!currentUser || isReposting}
                className={
                  isReposted ? 'text-green-600 dark:text-green-400' : ''
                }
              >
                <Repeat2 className="w-4 h-4 mr-2" />
                {isReposted ? 'Boosted' : 'Boost'}
                {sharesCount > 0 && ` (${sharesCount})`}
              </Button>
              <Button variant="ghost" size="sm">
                <Heart className="w-4 h-4 mr-2" />
                Like
              </Button>
            </div>
          </CardContent>
        </Card>

        {currentUser && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
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
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Replies
          </h3>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No replies yet</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
