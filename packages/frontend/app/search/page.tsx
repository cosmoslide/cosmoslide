'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import UserCard from '@/components/UserCard'
import NoteCard from '@/components/NoteCard'
import NavigationHeader from '@/components/NavigationHeader'
import { searchApi, authApi } from '@/lib/api'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  
  const [query, setQuery] = useState(initialQuery)
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [notes, setNotes] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [searchType, setSearchType] = useState<'all' | 'url'>('all')
  
  useEffect(() => {
    checkAuth()
    if (initialQuery) {
      handleSearch()
    }
  }, [initialQuery])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        const user = await authApi.getMe()
        setCurrentUser(user)
      }
    } catch (error) {
      // User not logged in
    }
  }

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()
    
    if (!query.trim()) return
    
    setLoading(true)
    setUsers([])
    setNotes([])

    try {
      const result = await searchApi.search(query)
      
      // Pass through the actor data with minimal transformation
      const transformedUsers = result.users.map((user: any) => ({
        ...user,
        username: user.preferredUsername || user.username,
        displayName: user.name || user.displayName,
        bio: user.summary || user.bio,
        followingCount: user.followingsCount || user.followingCount,
      }))
      
      setUsers(transformedUsers)
      setNotes(result.notes || [])
      
      // Detect if it's a URL search
      if (query.startsWith('http')) {
        setSearchType('url')
      } else {
        setSearchType('all')
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setQuery('')
    setUsers([])
    setNotes([])
  }

  const isUrlSearch = query.startsWith('http')
  const isFediverseHandle = query.includes('@') && query.split('@').length >= 2

  return (
    <>
      <NavigationHeader />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Search
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Search for federated users by their handle or profile URL
          </p>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by handle (@user@domain) or URL (https://domain/@user)"
                className="w-full px-4 py-3 pr-24 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                {query && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    title="Clear search"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                
                <button
                  type="submit"
                  disabled={!query.trim() || loading}
                  className="p-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Search Type Indicator */}
            {query && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {isUrlSearch ? (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Searching for federated user by URL
                  </span>
                ) : isFediverseHandle ? (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                    Searching for federated user by handle
                  </span>
                ) : (
                  <span>Enter a federated handle (@user@domain) or URL</span>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Search Results */}
        <div>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* No Query State */}
              {!query.trim() && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                      <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Discover Federated Users
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Connect with users from across the fediverse by searching for their profile URL
                    </p>
                  </div>
                  
                  {/* How it works */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-3">
                      How to Search
                    </h3>
                    <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                      <li className="flex items-start">
                        <span className="mr-2">1.</span>
                        <span>Copy a user's profile URL from another fediverse instance (e.g., Mastodon, Pleroma)</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">2.</span>
                        <span>Paste the full URL in the search box above</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">3.</span>
                        <span>Click search to find and follow the user</span>
                      </li>
                    </ul>
                  </div>
                  
                  {/* Examples */}
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Search Examples
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Fediverse handles:</p>
                        <div className="space-y-1">
                          <div className="font-mono text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 p-2 rounded">
                            @kodingwarrior@silicon.moe
                          </div>
                          <div className="font-mono text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 p-2 rounded">
                            @gargron@mastodon.social
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Profile URLs:</p>
                        <div className="space-y-1">
                          <div className="font-mono text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 p-2 rounded">
                            https://mastodon.social/@username
                          </div>
                          <div className="font-mono text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 p-2 rounded">
                            https://fosstodon.org/@developer
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* User Results */}
              {query.trim() && !loading && (
                <div className="space-y-4">
                  {users.length === 0 && notes.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        No results found
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        {isUrlSearch ? (
                          <>
                            Could not find a user at this URL.
                            <br />
                            Make sure the URL is correct and the instance is accessible.
                          </>
                        ) : (
                          "Please enter a complete federated user URL to search"
                        )}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Found Users */}
                      {users.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Found User{users.length > 1 ? 's' : ''}
                          </h3>
                          <div className="space-y-2">
                            {users.map((user, index) => (
                              <UserCard key={`${user.id}-${index}`} user={user} />
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Found Notes */}
                      {notes.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Related Posts
                          </h3>
                          <div className="space-y-4">
                            {notes.map((note) => (
                              <NoteCard
                                key={note.id}
                                note={note}
                                currentUserId={currentUser?.id}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
    </>
  )
}