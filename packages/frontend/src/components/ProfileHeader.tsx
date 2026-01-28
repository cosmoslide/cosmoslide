import { Link } from '@tanstack/react-router';
import { useState } from 'react';
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="h-24 bg-gradient-to-r from-blue-500 to-purple-600"></div>

      <div className="px-6 pb-6">
        <div className="flex items-end justify-between -mt-12 mb-4">
          <div className="w-20 h-20 rounded-full bg-white dark:bg-gray-700 border-4 border-white dark:border-gray-800 overflow-hidden">
            <img
              src={
                user.actor?.icon?.url ||
                user.avatarUrl ||
                user.icon?.url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || username)}&size=128&background=random`
              }
              alt={user.displayName || username}
              className="w-full h-full object-cover"
            />
          </div>

          {!isOwnProfile && (
            <button
              onClick={onFollow}
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
            <Link
              to="/settings"
              className="px-6 py-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 font-medium transition-colors"
            >
              Edit Profile
            </Link>
          )}
        </div>

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
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Private
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 mt-1">
            <p className="text-gray-500 dark:text-gray-400 font-mono text-sm">
              {federatedHandle}
            </p>
            <button
              onClick={copyHandle}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors relative"
              title="Copy handle"
            >
              {showCopied ? (
                <svg
                  className="w-4 h-4 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 text-gray-500 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              )}
            </button>
          </div>

          {isRemoteUser && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Federated from {user.domain}
            </p>
          )}
        </div>

        {user.bio && (
          <p className="text-gray-700 dark:text-gray-300 mb-4">{user.bio}</p>
        )}

        <div className="flex gap-6 text-sm">
          <div>
            <span className="font-bold text-gray-900 dark:text-white">
              {user.postsCount || 0}
            </span>
            <span className="text-gray-500 dark:text-gray-400 ml-1">posts</span>
          </div>
          <Link
            to="/$username/followers"
            params={{ username: `@${username}` }}
            className="hover:underline cursor-pointer"
          >
            <span className="font-bold text-gray-900 dark:text-white">
              {user.followersCount || 0}
            </span>
            <span className="text-gray-500 dark:text-gray-400 ml-1">
              followers
            </span>
          </Link>
          <Link
            to="/$username/following"
            params={{ username: `@${username}` }}
            className="hover:underline cursor-pointer"
          >
            <span className="font-bold text-gray-900 dark:text-white">
              {user.followingCount || 0}
            </span>
            <span className="text-gray-500 dark:text-gray-400 ml-1">
              following
            </span>
          </Link>
        </div>

        {user.createdAt && (
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Joined{' '}
            {new Date(user.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </div>
        )}

        {!isOwnProfile && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowRemoteFollowHelp(!showRemoteFollowHelp)}
              className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Follow from another server
            </button>

            {showRemoteFollowHelp && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  To follow this user from your own Mastodon, Misskey, or other
                  ActivityPub server:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-2">
                  <li>
                    Copy the handle:{' '}
                    <code className="px-1 py-0.5 bg-white dark:bg-gray-800 rounded font-mono text-xs">
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
    </div>
  );
}
