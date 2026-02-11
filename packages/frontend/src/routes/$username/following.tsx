import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { userApi } from '@/lib/api';
import UserCard from '@/components/user-card';
import AppLayout from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent } from '@/components/ui/card';

export const Route = createFileRoute('/$username/following')({
  component: FollowingPage,
});

function FollowingPage() {
  const { username: rawUsername } = Route.useParams();
  const decodedUsername = decodeURIComponent(rawUsername);
  const username = decodedUsername.startsWith('@')
    ? decodedUsername.split('@')[1] || ''
    : decodedUsername;

  const [following, setFollowing] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  useEffect(() => {
    if (username) {
      fetchFollowing();
    }
  }, [username]);

  const fetchFollowing = async (loadMore = false) => {
    if (loadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const currentOffset = loadMore ? offset : 0;
      const data = await userApi.getFollowing(username, limit, currentOffset);

      if (loadMore) {
        setFollowing((prev) => [...prev, ...data.items]);
      } else {
        setFollowing(data.items || []);
      }

      setHasMore(data.items?.length === limit);
      setOffset(currentOffset + limit);
    } catch (error) {
      setError('Failed to load following');
      console.error(error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchFollowing(true);
    }
  };

  return (
    <AppLayout>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="h-12 w-12" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Link
              to="/$username"
              params={{ username: `@${username}` }}
              className="text-primary hover:underline"
            >
              Back to profile
            </Link>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="mb-6">
            <Link
              to="/$username"
              params={{ username: `@${username}` }}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              ← Back to @{username}
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Following</h1>
            <p className="text-muted-foreground mt-1">
              People @{username} follows
            </p>
          </div>

          <div className="space-y-2">
            {following.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    Not following anyone yet
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {following.map((user: unknown, index) => (
                  <UserCard
                    key={`${(user as { username?: string }).username}-${index}`}
                    user={user as { username?: string }}
                  />
                ))}

                {hasMore && (
                  <div className="pt-4 flex justify-center">
                    <Button onClick={handleLoadMore} disabled={loadingMore}>
                      {loadingMore ? (
                        <>
                          <Spinner className="w-4 h-4 mr-2" />
                          Loading...
                        </>
                      ) : (
                        'Load More'
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
