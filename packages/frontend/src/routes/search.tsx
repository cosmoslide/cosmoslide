import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import UserCard from '@/components/UserCard';
import NoteCard from '@/components/NoteCard';
import NavigationHeader from '@/components/NavigationHeader';
import { searchApi } from '@/lib/api';

const searchSchema = z.object({
  q: z.string().optional(),
});

type SearchTab = 'all' | 'users' | 'posts';

export const Route = createFileRoute('/search')({
  validateSearch: searchSchema,
  beforeLoad: async () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (!token) {
        throw redirect({ to: '/auth/signin' });
      }
    }
  },
  component: SearchPage,
});

function SearchPage() {
  const { q: initialQuery } = Route.useSearch();
  const { user: currentUser } = useAuth();

  const [query, setQuery] = useState(initialQuery || '');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<Array<Record<string, unknown>>>([]);
  const [notes, setNotes] = useState<Array<Record<string, unknown>>>([]);
  const [activeTab, setActiveTab] = useState<SearchTab>('all');

  useEffect(() => {
    if (initialQuery) {
      handleSearch();
    }
  }, [initialQuery]);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!query.trim()) return;

    setLoading(true);
    setUsers([]);
    setNotes([]);

    try {
      const result = await searchApi.search(query);

      // Pass through the actor data with minimal transformation
      const transformedUsers = result.users.map(
        (user: {
          preferredUsername?: string;
          username?: string;
          name?: string;
          displayName?: string;
          summary?: string;
          bio?: string;
          followingsCount?: number;
          followingCount?: number;
        }) => ({
          ...user,
          username: user.preferredUsername || user.username,
          displayName: user.name || user.displayName,
          bio: user.summary || user.bio,
          followingCount: user.followingsCount || user.followingCount,
        }),
      );

      setUsers(transformedUsers);
      setNotes(result.notes || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setUsers([]);
    setNotes([]);
  };

  const getSearchType = () => {
    if (query.startsWith('http')) {
      if (
        query.includes('/notes/') ||
        query.includes('/statuses/') ||
        query.includes('/p/')
      ) {
        return 'note';
      }
      return 'actor';
    }
    if (query.includes('@')) {
      return 'actor';
    }
    return 'general';
  };

  const searchType = getSearchType();

  // Filter results based on active tab
  const filteredUsers = activeTab === 'posts' ? [] : users;
  const filteredNotes = activeTab === 'users' ? [] : notes;

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
              Search for users and posts across the fediverse
            </p>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by @handle, URL, or post link..."
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
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={!query.trim() || loading}
                    className="p-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Search Type Indicator */}
              {query && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {searchType === 'actor' && (
                    <span className="flex items-center">
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
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      Searching for user profile
                    </span>
                  )}
                  {searchType === 'note' && (
                    <span className="flex items-center">
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
                          d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                        />
                      </svg>
                      Searching for post
                    </span>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Results Tabs */}
          {(users.length > 0 || notes.length > 0) && !loading && (
            <div className="flex space-x-1 bg-gray-200 dark:bg-gray-800 p-1 rounded-lg mb-6">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                All
                {users.length + notes.length > 0 && (
                  <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full">
                    {users.length + notes.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'users'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Users
                {users.length > 0 && (
                  <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full">
                    {users.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('posts')}
                className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'posts'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Posts
                {notes.length > 0 && (
                  <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full">
                    {notes.length}
                  </span>
                )}
              </button>
            </div>
          )}

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
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Discover Federated Content
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Search for users and posts from across the fediverse
                    </p>
                  </div>
                )}

                {/* Results */}
                {query.trim() && !loading && (
                  <div className="space-y-4">
                    {filteredUsers.length === 0 &&
                    filteredNotes.length === 0 ? (
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                          No results found
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          Try searching with a different query
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* User Results */}
                        {filteredUsers.length > 0 && (
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              Users
                            </h3>
                            <div className="space-y-2">
                              {filteredUsers.map((user, index) => (
                                <UserCard
                                  key={`${user.id}-${index}`}
                                  user={user}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Note Results */}
                        {filteredNotes.length > 0 && (
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              Posts
                            </h3>
                            <div className="space-y-4">
                              {filteredNotes.map((note) => (
                                <NoteCard
                                  key={String(note.id)}
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
  );
}
