import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { notesApi } from '@/lib/api';
import {
  MessageCircle,
  Repeat2,
  Heart,
  Trash2,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// Extended Actor type that includes optional fields that may come from API
interface NoteAuthor {
  id?: string;
  userId?: string | null;
  username?: string;
  displayName?: string;
  preferredUsername?: string;
  name?: string;
  acct?: string;
  icon?: {
    url?: string;
    mediaType?: string;
  };
  manuallyApprovesFollowers?: boolean;
}

interface NoteData {
  id: string;
  content: string;
  contentWarning?: string;
  visibility: string;
  createdAt: string;
  author?: NoteAuthor;
}

interface NoteCardNote extends NoteData {
  isShared?: boolean;
  sharedBy?: {
    id: string;
    username?: string;
    displayName?: string;
    preferredUsername?: string;
    name?: string;
  };
  sharedNote?: NoteData;
  sharesCount?: number;
  isReposted?: boolean;
}

interface NoteCardProps {
  note: NoteCardNote;
  currentUserId?: string;
  onDelete?: (noteId: string) => void;
  onRepost?: (noteId: string, reposted: boolean) => void;
  isAuthenticated?: boolean;
}

export default function NoteCard({
  note,
  currentUserId,
  onDelete,
  onRepost,
  isAuthenticated,
}: NoteCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  // For shared posts, we need to handle the original content
  const displayNote = note.isShared && note.sharedNote ? note.sharedNote : note;

  // Repost state
  const targetNoteId = displayNote.id;
  const [isReposted, setIsReposted] = useState(note.isReposted || false);
  const [sharesCount, setSharesCount] = useState(note.sharesCount || 0);
  const [isReposting, setIsReposting] = useState(false);

  const handleRepost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated || isReposting) return;

    setIsReposting(true);
    const wasReposted = isReposted;

    // Optimistic update
    setIsReposted(!wasReposted);
    setSharesCount((prev) => (wasReposted ? Math.max(0, prev - 1) : prev + 1));

    try {
      if (wasReposted) {
        await notesApi.undoRepost(targetNoteId);
      } else {
        await notesApi.repost(targetNoteId);
      }
      onRepost?.(targetNoteId, !wasReposted);
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
  const [showContent, setShowContent] = useState(!displayNote.contentWarning);

  // Get the author info (for shared posts, this is the original author)
  const authorUsername =
    displayNote.author?.username ||
    displayNote.author?.preferredUsername ||
    'unknown';
  const authorDisplayName =
    displayNote.author?.displayName ||
    displayNote.author?.name ||
    authorUsername;
  const authorAcct = displayNote.author?.acct || `@${authorUsername}`;

  // Get sharer info if this is a shared post
  const sharerUsername =
    note.sharedBy?.username || note.sharedBy?.preferredUsername || '';
  const sharerDisplayName =
    note.sharedBy?.displayName || note.sharedBy?.name || sharerUsername;

  // Parse acct to determine if it's a remote actor
  const isRemoteAuthor = authorAcct.split('@').length > 2;

  // Build the profile path based on whether it's local or remote
  const authorProfilePath = isRemoteAuthor
    ? `/${authorAcct}`
    : `/@${authorUsername}`;
  const sharerProfilePath = sharerUsername ? `/@${sharerUsername}` : '';

  const authorHandle = authorAcct;

  const isOwner =
    currentUserId &&
    (note.author?.userId === currentUserId ||
      note.sharedBy?.id === currentUserId);

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

  return (
    <article className="bg-card rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer">
      {/* Shared post indicator */}
      {note.isShared && note.sharedBy && (
        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2 ml-12">
          <Repeat2 className="size-4 text-green-600 dark:text-green-400" />
          <a href={sharerProfilePath} className="hover:underline">
            {sharerDisplayName} shared
          </a>
        </div>
      )}

      <div className="flex space-x-3">
        {/* Avatar */}
        <a href={authorProfilePath} className="flex-shrink-0">
          <Avatar className="size-12">
            {displayNote.author?.icon?.url ? (
              <AvatarImage
                src={displayNote.author.icon.url}
                alt={displayNote.author.username}
              />
            ) : null}
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-lg">
              {authorUsername[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
        </a>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-1 text-sm">
              <a
                href={authorProfilePath}
                className="font-semibold hover:underline"
              >
                {authorDisplayName}
              </a>
              {note.author?.manuallyApprovesFollowers && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Lock className="size-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>Private Account</TooltipContent>
                </Tooltip>
              )}
              <span className="text-muted-foreground">{authorHandle}</span>
              <span className="text-muted-foreground">&middot;</span>
              <time
                className="text-muted-foreground"
                title={new Date(displayNote.createdAt).toLocaleString()}
              >
                {formatDate(displayNote.createdAt)}
              </time>
            </div>

            {isOwner && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete note</TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Content Warning */}
          {displayNote.contentWarning && (
            <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                <Badge
                  variant="outline"
                  className="mr-2 border-yellow-500 text-yellow-700 dark:text-yellow-300"
                >
                  CW
                </Badge>
                {displayNote.contentWarning}
              </p>
              {!showContent && (
                <Button
                  variant="link"
                  size="sm"
                  className="mt-1 h-auto p-0"
                  onClick={() => setShowContent(true)}
                >
                  Show content
                </Button>
              )}
            </div>
          )}

          {/* Note Content - Clickable to go to detail page */}
          {showContent && (
            <Link
              to="/notes/$id"
              params={{ id: displayNote.id }}
              className="block mt-2 hover:opacity-90"
            >
              <div
                className="note-content whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{ __html: displayNote.content }}
              />
            </Link>
          )}

          {/* Actions Bar */}
          <div className="flex items-center space-x-1 mt-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-muted-foreground hover:text-primary"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MessageCircle className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reply</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-8 px-2 gap-1',
                    isReposted
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-muted-foreground hover:text-green-600 dark:hover:text-green-400',
                    !isAuthenticated && 'opacity-50 cursor-default',
                  )}
                  onClick={handleRepost}
                  disabled={!isAuthenticated || isReposting}
                >
                  <Repeat2 className="size-4" />
                  {sharesCount > 0 && (
                    <span className="text-xs">{sharesCount}</span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isReposted ? 'Undo boost' : 'Boost'}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Heart className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Like</TooltipContent>
            </Tooltip>

            <div className="flex-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-muted-foreground hover:text-primary"
                  asChild
                >
                  <Link to="/notes/$id" params={{ id: displayNote.id }}>
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>View details</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </article>
  );
}
