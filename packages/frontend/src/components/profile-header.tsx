import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Lock, Copy, Check, Info } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { User } from '@/lib/types';

interface ProfileHeaderProps {
  user: User;
  currentUser: User | null;
  followStatus: 'none' | 'pending' | 'accepted';
  followLoading: boolean;
  onFollow: () => void;
  username: string;
  isRemoteUser: boolean;
  fullHandle: string;
}

export default function ProfileHeader({
  user,
  currentUser,
  followStatus,
  followLoading,
  onFollow,
  username,
  isRemoteUser,
  fullHandle,
}: ProfileHeaderProps) {
  const isOwnProfile = currentUser?.username === username;
  const [showCopied, setShowCopied] = useState(false);
  const [showRemoteFollowHelp, setShowRemoteFollowHelp] = useState(false);

  const getFederationDomain = () => {
    if (import.meta.env.VITE_FEDERATION_DOMAIN) {
      return import.meta.env.VITE_FEDERATION_DOMAIN;
    }

    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl) {
      try {
        const url = new URL(apiUrl);
        return url.hostname;
      } catch (e) {
        // If URL parsing fails, fall back to window location
      }
    }

    return typeof window !== 'undefined'
      ? window.location.hostname
      : 'localhost';
  };

  const federatedHandle = isRemoteUser
    ? fullHandle
    : `@${username}@${getFederationDomain()}`;

  const copyHandle = async () => {
    try {
      await navigator.clipboard.writeText(federatedHandle);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="h-24 bg-gradient-to-r from-blue-500 to-purple-600" />

      <div className="px-6 pb-6">
        <div className="flex items-end justify-between -mt-12 mb-4">
          <Avatar className="size-20 border-4 border-card">
            <AvatarImage
              src={
                user.actor?.icon?.url ||
                user.avatarUrl ||
                user.icon?.url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || username)}&size=128&background=random`
              }
              alt={user.displayName || username}
            />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-semibold">
              {(user.displayName || username)[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {!isOwnProfile && currentUser && (
            <Button
              onClick={onFollow}
              disabled={followLoading}
              variant={
                followStatus === 'accepted'
                  ? 'secondary'
                  : followStatus === 'pending'
                    ? 'outline'
                    : 'default'
              }
              className={cn(
                'rounded-full',
                followStatus === 'pending' &&
                  'border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950',
              )}
            >
              {followLoading
                ? '...'
                : followStatus === 'accepted'
                  ? 'Following'
                  : followStatus === 'pending'
                    ? 'Requested'
                    : 'Follow'}
            </Button>
          )}

          {isOwnProfile && (
            <Button asChild variant="secondary" className="rounded-full">
              <Link to="/settings">Edit Profile</Link>
            </Button>
          )}
        </div>

        <div className="mb-4">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold">
              {user.displayName || username}
            </h1>
            {user.manuallyApprovesFollowers && (
              <Badge variant="secondary">
                <Lock className="size-3 mr-1" />
                Private
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-2 mt-1">
            <p className="text-muted-foreground font-mono text-sm">
              {federatedHandle}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={copyHandle}
            >
              {showCopied ? (
                <Check className="size-4 text-green-600 dark:text-green-400" />
              ) : (
                <Copy className="size-4 text-muted-foreground" />
              )}
            </Button>
          </div>

          {isRemoteUser && (
            <p className="text-xs text-muted-foreground mt-1">
              Federated from {user.domain}
            </p>
          )}
        </div>

        {user.bio && (
          <div
            className="note-content text-muted-foreground mb-4"
            dangerouslySetInnerHTML={{ __html: user.bio }}
          />
        )}

        <div className="flex gap-6 text-sm">
          <div>
            <span className="font-bold">{user.postsCount || 0}</span>
            <span className="text-muted-foreground ml-1">posts</span>
          </div>
          <Link
            to="/$username/followers"
            params={{ username: `@${username}` }}
            className="hover:underline cursor-pointer"
          >
            <span className="font-bold">{user.followersCount || 0}</span>
            <span className="text-muted-foreground ml-1">followers</span>
          </Link>
          <Link
            to="/$username/following"
            params={{ username: `@${username}` }}
            className="hover:underline cursor-pointer"
          >
            <span className="font-bold">{user.followingCount || 0}</span>
            <span className="text-muted-foreground ml-1">following</span>
          </Link>
        </div>

        {user.createdAt && (
          <div className="mt-4 text-sm text-muted-foreground">
            Joined{' '}
            {new Date(user.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </div>
        )}

        {!isOwnProfile && (
          <div className="mt-4 pt-4 border-t">
            <button
              onClick={() => setShowRemoteFollowHelp(!showRemoteFollowHelp)}
              className="flex items-center text-sm text-primary hover:underline"
            >
              <Info className="size-4 mr-1" />
              Follow from another server
            </button>

            {showRemoteFollowHelp && (
              <div className="mt-3 p-3 bg-primary/5 rounded-lg text-sm">
                <p className="mb-2">
                  To follow this user from your own Mastodon, Misskey, or other
                  ActivityPub server:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
                  <li>
                    Copy the handle:{' '}
                    <code className="px-1 py-0.5 bg-muted rounded font-mono text-xs">
                      {federatedHandle}
                    </code>
                  </li>
                  <li>Open your server's search or follow dialog</li>
                  <li>Paste the handle and search</li>
                  <li>Click the follow button</li>
                </ol>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
