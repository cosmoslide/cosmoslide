'use client';

import { useRouter } from 'next/navigation';

interface ProfileHeaderProps {
  user: any;
  currentUser: any;
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
  const router = useRouter();
  const isOwnProfile = currentUser?.username === username;

  return (
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
          <p className="text-gray-500 dark:text-gray-400">
            {isRemoteUser ? fullHandle : `@${username}`}
          </p>
          {isRemoteUser && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Federated from {user.domain}
            </p>
          )}
        </div>

        {/* Bio */}
        {user.bio && (
          <p className="text-gray-700 dark:text-gray-300 mb-4">{user.bio}</p>
        )}

        {/* Stats */}
        <div className="flex gap-6 text-sm">
          <div>
            <span className="font-bold text-gray-900 dark:text-white">
              {user.postsCount || 0}
            </span>
            <span className="text-gray-500 dark:text-gray-400 ml-1">posts</span>
          </div>
          <a
            href={`@${username}/followers`}
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
            href={`@${username}/following`}
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
  );
}
