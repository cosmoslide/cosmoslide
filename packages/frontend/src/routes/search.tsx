import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { RequireAuth } from '@/components/require-auth';
import UserCard from '@/components/user-card';
import NoteCard from '@/components/note-card';
import AppLayout from '@/components/app-layout';
import { searchApi } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Search, X, User, MessageSquare } from 'lucide-react';
import type { Note } from '@/lib/types';

const searchSchema = z.object({
  q: z.string().optional(),
});

type SearchTab = 'all' | 'users' | 'posts';

export const Route = createFileRoute('/search')({
  validateSearch: searchSchema,
  component: SearchPage,
});

function SearchPage() {
  const { q: initialQuery } = Route.useSearch();
  const { user: currentUser } = useAuth();

  const [query, setQuery] = useState(initialQuery || '');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<Array<Record<string, unknown>>>([]);
  const [notes, setNotes] = useState<Note[]>([]);
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
    <AppLayout>
      <RequireAuth>
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Search Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Search</h1>
            <p className="text-muted-foreground mb-6">
              Search for users and posts across the fediverse
            </p>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="relative">
                <Input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by @handle, URL, or post link..."
                  className="pr-24"
                  autoFocus
                />

                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                  {query && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleClear}
                      title="Clear search"
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}

                  <Button
                    type="submit"
                    disabled={!query.trim() || loading}
                    size="icon"
                    className="h-8 w-8"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Search Type Indicator */}
              {query && (
                <div className="text-sm text-muted-foreground">
                  {searchType === 'actor' && (
                    <span className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      Searching for user profile
                    </span>
                  )}
                  {searchType === 'note' && (
                    <span className="flex items-center">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Searching for post
                    </span>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Results Tabs */}
          {(users.length > 0 || notes.length > 0) && !loading && (
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as SearchTab)}
              className="mb-6"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">
                  All
                  {users.length + notes.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {users.length + notes.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="users">
                  Users
                  {users.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {users.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="posts">
                  Posts
                  {notes.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {notes.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* Search Results */}
          <div>
            {loading ? (
              <div className="flex justify-center py-12">
                <Spinner className="h-12 w-12" />
              </div>
            ) : (
              <>
                {/* No Query State */}
                {!query.trim() && (
                  <div className="bg-card rounded-lg p-8 text-center border">
                    <h3 className="text-lg font-semibold mb-2">
                      Discover Federated Content
                    </h3>
                    <p className="text-muted-foreground">
                      Search for users and posts from across the fediverse
                    </p>
                  </div>
                )}

                {/* Results */}
                {query.trim() && !loading && (
                  <div className="space-y-4">
                    {filteredUsers.length === 0 &&
                    filteredNotes.length === 0 ? (
                      <div className="bg-card rounded-lg p-8 text-center border">
                        <h3 className="font-semibold mb-2">No results found</h3>
                        <p className="text-muted-foreground">
                          Try searching with a different query
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* User Results */}
                        {filteredUsers.length > 0 && (
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Users</h3>
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
                            <h3 className="text-lg font-semibold">Posts</h3>
                            <div className="space-y-4">
                              {filteredNotes.map((note) => (
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
      </RequireAuth>
    </AppLayout>
  );
}
