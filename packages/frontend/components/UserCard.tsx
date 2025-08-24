'use client'

import ProfileLink from './ProfileLink'

interface UserCardProps {
  user: {
    username: string
    displayName?: string
    bio?: string
    followersCount?: number
    followingCount?: number
  }
}

export default function UserCard({ user }: UserCardProps) {
  if (!user || !user.username) {
    return null
  }
  
  return (
    <ProfileLink 
      username={user.username}
      className="block bg-white dark:bg-gray-800 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
    >
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span className="text-white font-semibold text-lg">
            {user.username[0]?.toUpperCase() || '?'}
          </span>
        </div>
        
        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-1">
            <p className="font-semibold text-gray-900 dark:text-white truncate">
              {user.displayName || user.username}
            </p>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            @{user.username}
          </p>
          
          {user.bio && (
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
              {user.bio}
            </p>
          )}
          
          {/* Stats */}
          <div className="mt-2 flex space-x-4 text-xs text-gray-500 dark:text-gray-400">
            {user.followersCount !== undefined && (
              <span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {user.followersCount}
                </span> followers
              </span>
            )}
            {user.followingCount !== undefined && (
              <span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {user.followingCount}
                </span> following
              </span>
            )}
          </div>
        </div>
      </div>
    </ProfileLink>
  )
}