import { Lock } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface UserCardProps {
  user: {
    username?: string;
    preferredUsername?: string;
    displayName?: string;
    name?: string;
    bio?: string;
    summary?: string;
    followersCount?: number;
    followingCount?: number;
    followingsCount?: number;
    acct?: string;
    url?: string;
    manuallyApprovesFollowers?: boolean;
  };
}

export default function UserCard({ user }: UserCardProps) {
  if (!user) {
    return null;
  }

  const username = user.preferredUsername || user.username;
  const displayName = user.name || user.displayName || username;
  const bio = user.summary || user.bio;
  const followersCount = user.followersCount;
  const followingCount = user.followingsCount || user.followingCount;

  if (!username) {
    return null;
  }

  const acct = user.acct || `@${username}`;
  const isRemote = acct.split('@').length > 2;
  const profilePath = isRemote ? `/${acct}` : `/@${username}`;

  return (
    <a
      href={profilePath}
      className="block bg-card rounded-lg p-4 hover:bg-accent/50 transition-colors"
    >
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        <Avatar className="size-12">
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-lg">
            {username[0]?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-1">
            <p className="font-semibold truncate">{displayName}</p>
            {user.manuallyApprovesFollowers && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Lock className="size-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>Private Account</TooltipContent>
              </Tooltip>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{acct}</p>

          {bio && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {bio}
            </p>
          )}

          {/* Stats */}
          <div className="mt-2 flex space-x-4 text-xs text-muted-foreground">
            {followersCount !== undefined && (
              <span>
                <span className="font-semibold text-foreground">
                  {followersCount}
                </span>{' '}
                followers
              </span>
            )}
            {followingCount !== undefined && (
              <span>
                <span className="font-semibold text-foreground">
                  {followingCount}
                </span>{' '}
                following
              </span>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}
