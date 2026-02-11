import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { RequireAuth } from '@/components/require-auth';
import { followRequestApi } from '@/lib/api';
import AppLayout from '@/components/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import { Settings, UserPlus, Lock, LockOpen, AlertCircle } from 'lucide-react';

interface FollowRequest {
  username: string;
  displayName: string;
  bio: string;
  followersCount: number;
  followingCount: number;
}

export const Route = createFileRoute('/follow-requests')({
  component: FollowRequestsPage,
});

function FollowRequestsPage() {
  const { user: currentUser } = useAuth();
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingUsers, setProcessingUsers] = useState<Set<string>>(
    new Set(),
  );
  const [isAccountPrivate, setIsAccountPrivate] = useState(false);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.actor) {
        setIsAccountPrivate(
          currentUser.actor.manuallyApprovesFollowers || false,
        );
      }
      fetchFollowRequests();
    }
  }, [currentUser]);

  const fetchFollowRequests = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const requests = await followRequestApi.getFollowRequests(
        currentUser.username,
      );
      setFollowRequests(requests || []);
    } catch (error) {
      console.error('Failed to fetch follow requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requesterUsername: string) => {
    if (!currentUser) return;
    setProcessingUsers((prev) => new Set(prev).add(requesterUsername));
    try {
      await followRequestApi.acceptFollowRequest(
        currentUser.username,
        requesterUsername,
      );
      setFollowRequests((prev) =>
        prev.filter((req) => req.username !== requesterUsername),
      );
    } catch (error) {
      console.error('Failed to accept follow request:', error);
    } finally {
      setProcessingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(requesterUsername);
        return newSet;
      });
    }
  };

  const handleReject = async (requesterUsername: string) => {
    if (!currentUser) return;
    setProcessingUsers((prev) => new Set(prev).add(requesterUsername));
    try {
      await followRequestApi.rejectFollowRequest(
        currentUser.username,
        requesterUsername,
      );
      setFollowRequests((prev) =>
        prev.filter((req) => req.username !== requesterUsername),
      );
    } catch (error) {
      console.error('Failed to reject follow request:', error);
    } finally {
      setProcessingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(requesterUsername);
        return newSet;
      });
    }
  };

  return (
    <AppLayout>
      <RequireAuth>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold">Follow Requests</h1>
              <Button variant="ghost" size="icon" asChild>
                <Link to="/settings">
                  <Settings className="w-6 h-6" />
                </Link>
              </Button>
            </div>
            <p className="text-muted-foreground">
              People who want to follow you
            </p>

            {!loading && (
              <Badge
                variant={isAccountPrivate ? 'default' : 'secondary'}
                className="mt-4"
              >
                {isAccountPrivate ? (
                  <Lock className="w-4 h-4 mr-1.5" />
                ) : (
                  <LockOpen className="w-4 h-4 mr-1.5" />
                )}
                Account is {isAccountPrivate ? 'Private' : 'Public'}
              </Badge>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner className="h-12 w-12" />
            </div>
          ) : (
            <>
              {!isAccountPrivate && (
                <Alert className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium mb-1">
                      Your account is currently public
                    </p>
                    <p>
                      Anyone can follow you without approval. To require
                      approval for new followers, enable "Private Account" in{' '}
                      <Link
                        to="/settings"
                        className="underline hover:no-underline"
                      >
                        Settings
                      </Link>
                      .
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              {followRequests.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                      <UserPlus className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      No pending follow requests
                    </h3>
                    <p className="text-muted-foreground">
                      {isAccountPrivate
                        ? "When someone requests to follow you, they'll appear here"
                        : 'Follow requests only appear when your account is private'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {followRequests.map((request) => (
                    <Card key={request.username}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 flex items-start space-x-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(request.displayName || request.username)}&size=128`}
                                alt={request.displayName || request.username}
                              />
                              <AvatarFallback>
                                {(request.displayName ||
                                  request.username)[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <Link
                                to="/$username"
                                params={{ username: `@${request.username}` }}
                                className="group"
                              >
                                <h3 className="font-semibold group-hover:text-primary">
                                  {request.displayName || request.username}
                                </h3>
                                <p className="text-muted-foreground text-sm">
                                  @{request.username}
                                </p>
                              </Link>
                              {request.bio && (
                                <p className="mt-2 text-sm line-clamp-2">
                                  {request.bio}
                                </p>
                              )}
                              <div className="flex items-center space-x-4 mt-3 text-sm text-muted-foreground">
                                <span>
                                  <span className="font-semibold text-foreground">
                                    {request.followersCount}
                                  </span>{' '}
                                  followers
                                </span>
                                <span>
                                  <span className="font-semibold text-foreground">
                                    {request.followingCount}
                                  </span>{' '}
                                  following
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <Button
                              onClick={() => handleAccept(request.username)}
                              disabled={processingUsers.has(request.username)}
                              size="sm"
                            >
                              {processingUsers.has(request.username) ? (
                                <Spinner className="h-4 w-4" />
                              ) : (
                                'Accept'
                              )}
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={() => handleReject(request.username)}
                              disabled={processingUsers.has(request.username)}
                              size="sm"
                            >
                              {processingUsers.has(request.username) ? (
                                <Spinner className="h-4 w-4" />
                              ) : (
                                'Reject'
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </RequireAuth>
    </AppLayout>
  );
}
