import {
  createFileRoute,
  redirect,
  Link,
  useNavigate,
} from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { followRequestApi } from '@/lib/api';

interface FollowRequest {
  username: string;
  displayName: string;
  bio: string;
  followersCount: number;
  followingCount: number;
}

export const Route = createFileRoute('/follow-requests')({
  beforeLoad: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (!token) {
        throw redirect({ to: '/auth/signin' });
      }
    }
  },
  component: FollowRequestsPage,
});

function FollowRequestsPage() {
  const navigate = useNavigate();
  const {
    user: currentUser,
    loading: authLoading,
    isAuthenticated,
  } = useAuth();
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingUsers, setProcessingUsers] = useState<Set<string>>(
    new Set(),
  );
  const [isAccountPrivate, setIsAccountPrivate] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate({ to: '/auth/signin' });
      } else if (currentUser) {
        if (currentUser.actor) {
          setIsAccountPrivate(
            currentUser.actor.manuallyApprovesFollowers || false,
          );
        }
        fetchFollowRequests();
      }
    }
  }, [authLoading, isAuthenticated, currentUser, navigate]);

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Follow Requests
            </h1>
            <Link
              to="/settings"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </Link>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            People who want to follow you
          </p>

          {!loading && (
            <div
              className={`mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${isAccountPrivate ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
            >
              <svg
                className="w-4 h-4 mr-1.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isAccountPrivate ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                  />
                )}
              </svg>
              Account is {isAccountPrivate ? 'Private' : 'Public'}
            </div>
          )}
        </div>

        {authLoading || loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {!isAccountPrivate && (
              <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                <div className="flex">
                  <svg
                    className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2 mt-0.5"
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
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                      Your account is currently public
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-300">
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
                  </div>
                </div>
              </div>
            )}

            {followRequests.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No pending follow requests
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {isAccountPrivate
                    ? "When someone requests to follow you, they'll appear here"
                    : 'Follow requests only appear when your account is private'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {followRequests.map((request) => (
                  <div
                    key={request.username}
                    className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Link
                          to="/$username"
                          params={{ username: `@${request.username}` }}
                          className="group"
                        >
                          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            {request.displayName || request.username}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            @{request.username}
                          </p>
                        </Link>
                        {request.bio && (
                          <p className="mt-2 text-gray-700 dark:text-gray-300 text-sm">
                            {request.bio}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
                          <span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {request.followersCount}
                            </span>{' '}
                            followers
                          </span>
                          <span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {request.followingCount}
                            </span>{' '}
                            following
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleAccept(request.username)}
                          disabled={processingUsers.has(request.username)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {processingUsers.has(request.username) ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            'Accept'
                          )}
                        </button>
                        <button
                          onClick={() => handleReject(request.username)}
                          disabled={processingUsers.has(request.username)}
                          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {processingUsers.has(request.username) ? (
                            <div className="w-4 h-4 border-2 border-gray-600 dark:border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            'Reject'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
