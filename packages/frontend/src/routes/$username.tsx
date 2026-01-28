import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { userApi, searchApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import NoteComposer from '@/components/NoteComposer';
import Timeline from '@/components/Timeline';
import ProfileHeader from '@/components/ProfileHeader';
import ProfileTabs from '@/components/ProfileTabs';
import type { User } from '@/lib/types';

export const Route = createFileRoute('/$username')({
  component: UserProfile,
});

function UserProfile() {
  const { username: rawUsername } = Route.useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const decodedUsername = decodeURIComponent(rawUsername);

  // Parse username - could be @alice or @alice@mastodon.social
  let username = '';
  let domain = '';

  if (decodedUsername.startsWith('@')) {
    const parts = decodedUsername.substring(1).split('@');
    username = parts[0] || '';
    domain = parts[1] || '';
  } else {
    username = decodedUsername;
  }

  const isRemoteUser = !!domain;
  const fullHandle = domain ? `@${username}@${domain}` : `@${username}`;

  const [user, setUser] = useState<User | null>(null);
  const [followStatus, setFollowStatus] = useState<
    'none' | 'pending' | 'accepted'
  >('none');
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (username) {
      fetchUserProfile();
    }
  }, [username]);

  useEffect(() => {
    if (currentUser && username) {
      if (isRemoteUser || currentUser.username !== username) {
        checkFollowStatus();
      }
    }
  }, [currentUser, username, isRemoteUser]);

  const fetchUserProfile = async () => {
    try {
      if (isRemoteUser) {
        const searchResult = await searchApi.search(fullHandle);
        if (searchResult.users?.length > 0) {
          const remoteUser = searchResult.users[0];
          setUser({
            ...remoteUser,
            username: remoteUser.preferredUsername || remoteUser.username,
            displayName: remoteUser.name || remoteUser.displayName,
            bio: remoteUser.summary || remoteUser.bio,
            isRemote: true,
            domain,
          });
        } else {
          setError('User not found');
        }
      } else {
        const userData = await userApi.getProfile(username);
        setUser(userData);
      }
    } catch (error) {
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    try {
      const targetIdentifier = isRemoteUser ? fullHandle : username;
      const status = await userApi.getFollowStatus(targetIdentifier);
      setFollowStatus(status.status || 'none');
    } catch (error) {
      console.error('Failed to check follow status:', error);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      navigate({ to: '/auth/signin' });
      return;
    }

    setFollowLoading(true);
    try {
      const targetIdentifier = isRemoteUser ? fullHandle : username;

      if (followStatus === 'accepted' || followStatus === 'pending') {
        await userApi.unfollowUser(targetIdentifier);
        setFollowStatus('none');
        if (followStatus === 'accepted') {
          setUser((prev) =>
            prev
              ? {
                  ...prev,
                  followersCount: Math.max(0, (prev.followersCount ?? 0) - 1),
                }
              : null,
          );
        }
      } else {
        await userApi.followUser(targetIdentifier);
        setFollowStatus(
          user?.manuallyApprovesFollowers ? 'pending' : 'accepted',
        );
        if (!user?.manuallyApprovesFollowers) {
          setUser((prev) =>
            prev
              ? { ...prev, followersCount: (prev.followersCount ?? 0) + 1 }
              : null,
          );
        }
      }
    } catch (error) {
      console.error('Failed to update follow status', error);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'User not found'}</p>
          <Link to="/" className="text-blue-600 hover:text-blue-500">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = !isRemoteUser && currentUser?.username === username;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <ProfileHeader
          user={user}
          currentUser={currentUser}
          followStatus={followStatus}
          followLoading={followLoading}
          onFollow={handleFollow}
          username={username}
          isRemoteUser={isRemoteUser}
          fullHandle={fullHandle}
        />

        <div className="mt-6">
          <ProfileTabs username={username} />
        </div>

        {isOwnProfile && (
          <div className="mt-6">
            <NoteComposer onNoteCreated={() => window.location.reload()} />
          </div>
        )}

        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Notes
          </h2>
          <Timeline
            username={isRemoteUser ? fullHandle : username}
            currentUserId={currentUser?.id}
          />
        </div>
      </div>
    </div>
  );
}
