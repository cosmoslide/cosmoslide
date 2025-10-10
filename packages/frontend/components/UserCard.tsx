'use client'

import ProfileLink from './ProfileLink'

interface UserCardProps {
  user: {
    username?: string
    preferredUsername?: string
    displayName?: string
    name?: string
    bio?: string
    summary?: string
    followersCount?: number
    followingCount?: number
    followingsCount?: number
    acct?: string
    url?: string
    manuallyApprovesFollowers?: boolean
  }
}

export default function UserCard({ user }: UserCardProps) {
  if (!user) {
    return null
  }
  
  // Extract username and display name from various possible fields
  const username = user.preferredUsername || user.username
  const displayName = user.name || user.displayName || username
  const bio = user.summary || user.bio
  const followersCount = user.followersCount
  const followingCount = user.followingsCount || user.followingCount
  
  if (!username) {
    return null
  }
  
  // Parse acct to determine if it's a remote actor
  // acct format: @username@domain for remote, @username for local
  const acct = user.acct || `@${username}`
  const isRemote = acct.split('@').length > 2 // @username@domain has 3 parts when split
  
  // Build the profile link - acct already has @ prefix
  const profilePath = isRemote ? `/${acct}` : `/@${username}`
  
  return (
    <a 
      href={profilePath}
      className="block bg-white dark:bg-gray-800 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
    >
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span className="text-white font-semibold text-lg">
            {username[0]?.toUpperCase() || '?'}
          </span>
        </div>
        
        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-1">
            <p className="font-semibold text-gray-900 dark:text-white truncate">
              {displayName}
            </p>
            {user.manuallyApprovesFollowers && (
              <svg
                className="w-4 h-4 text-gray-500 dark:text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <title>Private Account</title>
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {acct}
          </p>
          
          {bio && (
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
              {bio}
            </p>
          )}
          
          {/* Stats */}
          <div className="mt-2 flex space-x-4 text-xs text-gray-500 dark:text-gray-400">
            {followersCount !== undefined && (
              <span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {followersCount}
                </span> followers
              </span>
            )}
            {followingCount !== undefined && (
              <span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {followingCount}
                </span> following
              </span>
            )}
          </div>
        </div>
      </div>
    </a>
  )
}