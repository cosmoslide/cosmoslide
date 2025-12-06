'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { userApi, searchApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import CosmoPage from '@/components/CosmoPage';
import NoteComposer from '@/components/NoteComposer';
import Timeline from '@/components/Timeline';
import ProfileHeader from '@/components/ProfileHeader';
import ProfileTabs from '@/components/ProfileTabs';
import type { User } from '@/lib/types';

export default function UserProfile() {
  return (
    <CosmoPage>
      <UserProfileContent />
    </CosmoPage>
  );
}

function UserProfileContent() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const rawUsername = decodeURIComponent(params.username as string);

  // Parse username - could be @alice or @alice@mastodon.social
  let username = '';
  let domain = '';

  if (rawUsername.startsWith('@')) {
    const parts = rawUsername.substring(1).split('@');
    username = parts[0];
    domain = parts[1] || '';
  } else {
    username = rawUsername;
  }

  const isRemoteUser = !!domain;
  const fullHandle = domain ? `@${username}@${domain}` : `@${username}`;

  const [user, setUser] = useState<User | null>(null);
  const [followStatus, setFollowStatus] = useState<'none' | 'pending' | 'accepted'>('none');
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (username) {
      fetchUserProfile();
    }
  }, [username]);

  useEffect(() => {
    // Only check follow status for other users (not own profile)
    // For remote users, always check
    // For local users, check if it's not the current user
    if (currentUser && username) {
      if (isRemoteUser || currentUser.username !== username) {
        checkFollowStatus();
      }
    }
  }, [currentUser, username, isRemoteUser]);

  const fetchUserProfile = async () => {
    try {
      if (isRemoteUser) {
        // For remote users, we need to search for them first
        const searchResult = await searchApi.search(fullHandle);
        if (searchResult.users && searchResult.users.length > 0) {
          const remoteUser = searchResult.users[0];
          setUser({
            ...remoteUser,
            username: remoteUser.preferredUsername || remoteUser.username,
            displayName: remoteUser.name || remoteUser.displayName,
            bio: remoteUser.summary || remoteUser.bio,
            isRemote: true,
            domain
          });
        } else {
          setError('User not found');
        }
      } else {
        // For local users, use the normal profile endpoint
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
      // Use full handle for remote users, username for local users
      const targetIdentifier = isRemoteUser ? fullHandle : username;
      const status = await userApi.getFollowStatus(targetIdentifier);
      setFollowStatus(status.status || 'none');
    } catch (error) {
      // Failed to check follow status
      console.error('Failed to check follow status:', error);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      router.push('/auth/signin');
      return;
    }

    setFollowLoading(true);
    try {
      // Use full handle for remote users, username for local users
      const targetIdentifier = isRemoteUser ? fullHandle : username;
      
      if (followStatus === 'accepted' || followStatus === 'pending') {
        // Unfollow or cancel request
        await userApi.unfollowUser(targetIdentifier);
        setFollowStatus('none');
        // Only decrement if it was accepted (not pending)
        if (followStatus === 'accepted') {
          setUser((prev) => prev ? ({
            ...prev,
            followersCount: Math.max(0, (prev.followersCount ?? 0) - 1),
          }) : null);
        }
      } else {
        // Send follow request
        await userApi.followUser(targetIdentifier);
        // If the account is private, set to pending, otherwise accepted
        setFollowStatus(user.manuallyApprovesFollowers ? 'pending' : 'accepted');
        // Only increment if account is not private (immediate follow)
        if (!user.manuallyApprovesFollowers) {
          setUser((prev) => prev ? ({
            ...prev,
            followersCount: (prev.followersCount ?? 0) + 1,
          }) : null);
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
          <a href="/" className="text-blue-600 hover:text-blue-500">
            Back to home
          </a>
        </div>
      </div>
    );
  }

  // Only local users can be "own profile" - remote users are never own profile
  const isOwnProfile = !isRemoteUser && currentUser?.username === username;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Profile Card */}
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

        {/* Tab Navigation */}
        <div className="mt-6">
          <ProfileTabs username={username} />
        </div>

        {/* Note Composer for own profile */}
        {isOwnProfile && (
          <div className="mt-6">
            <NoteComposer
              onNoteCreated={() => {
                // Refresh the timeline when a new note is created
                window.location.reload();
              }}
            />
          </div>
        )}

        {/* User Timeline */}
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
