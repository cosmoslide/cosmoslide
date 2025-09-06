'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { userApi, authApi, searchApi } from '@/lib/api';
import NoteComposer from '@/components/NoteComposer';
import Timeline from '@/components/Timeline';

export default function UserProfile() {
  const params = useParams();
  const router = useRouter();
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

  const [user, setUser] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [followStatus, setFollowStatus] = useState<'none' | 'pending' | 'accepted'>('none');
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (username) {
      fetchUserProfile();
      checkCurrentUser();
    }
  }, [username]);

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

  const checkCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const me = await authApi.getMe();
        setCurrentUser(me);

        // Check follow status for this user
        if (me.username !== username) {
          // Use full handle for remote users, username for local users
          const targetIdentifier = isRemoteUser ? fullHandle : username;
          const status = await userApi.getFollowStatus(targetIdentifier);
          setFollowStatus(status.status || 'none');
        }
      }
    } catch (error) {
      // User not logged in, that's okay
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
          setUser((prev) => ({
            ...prev,
            followersCount: Math.max(0, prev.followersCount - 1),
          }));
        }
      } else {
        // Send follow request
        await userApi.followUser(targetIdentifier);
        // If the account is private, set to pending, otherwise accepted
        setFollowStatus(user.manuallyApprovesFollowers ? 'pending' : 'accepted');
        // Only increment if account is not private (immediate follow)
        if (!user.manuallyApprovesFollowers) {
          setUser((prev) => ({
            ...prev,
            followersCount: prev.followersCount + 1,
          }));
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

  const isOwnProfile = currentUser?.username === username;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="h-24 bg-gradient-to-r from-blue-500 to-purple-600"></div>

          {/* Profile Info */}
          <div className="px-6 pb-6">
            {/* Avatar and Follow Button */}
            <div className="flex items-end justify-between -mt-12 mb-4">
              <div className="w-20 h-20 rounded-full bg-white dark:bg-gray-700 border-4 border-white dark:border-gray-800 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-600 dark:text-gray-300">
                  {username[0]?.toUpperCase()}
                </span>
              </div>

              {!isOwnProfile && (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`px-6 py-2 rounded-full font-medium transition-colors ${
                    followStatus === 'accepted'
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                      : followStatus === 'pending'
                      ? 'bg-amber-500 text-white hover:bg-amber-600'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {followLoading 
                    ? '...' 
                    : followStatus === 'accepted' 
                    ? 'Following' 
                    : followStatus === 'pending'
                    ? 'Requested'
                    : 'Follow'}
                </button>
              )}

              {isOwnProfile && (
                <a
                  href="/settings"
                  className="px-6 py-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 font-medium transition-colors"
                >
                  Edit Profile
                </a>
              )}
            </div>

            {/* Name and Username */}
            <div className="mb-4">
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {user.displayName || username}
                </h1>
                {user.manuallyApprovesFollowers && (
                  <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    <svg 
                      className="w-3 h-3 mr-1" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Private
                  </div>
                )}
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                {isRemoteUser ? fullHandle : `@${username}`}
              </p>
              {isRemoteUser && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Federated from {domain}
                </p>
              )}
            </div>

            {/* Bio */}
            {user.bio && (
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {user.bio}
              </p>
            )}

            {/* Stats */}
            <div className="flex gap-6 text-sm">
              <div>
                <span className="font-bold text-gray-900 dark:text-white">
                  {user.postsCount || 0}
                </span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">
                  posts
                </span>
              </div>
              <a
                href={`/users/${username}/followers`}
                className="hover:underline cursor-pointer"
              >
                <span className="font-bold text-gray-900 dark:text-white">
                  {user.followersCount || 0}
                </span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">
                  followers
                </span>
              </a>
              <a
                href={`/users/${username}/following`}
                className="hover:underline cursor-pointer"
              >
                <span className="font-bold text-gray-900 dark:text-white">
                  {user.followingCount || 0}
                </span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">
                  following
                </span>
              </a>
            </div>

            {/* Joined Date */}
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Joined{' '}
              {new Date(user.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </div>
          </div>
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
            Posts
          </h2>
          <Timeline username={username} currentUserId={currentUser?.id} />
        </div>
      </div>
    </div>
  );
}
