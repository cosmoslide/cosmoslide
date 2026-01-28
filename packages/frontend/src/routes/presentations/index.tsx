import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useState, useEffect, useRef } from 'react';
import { userApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export const Route = createFileRoute('/presentations/')({
  beforeLoad: () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw redirect({ to: '/auth/signin' });
    }
  },
  component: PresentationsPage,
});

function PresentationsPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [presentations, setPresentations] = useState<
    Array<{ id: string; title: string }>
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    color?: string;
  }>({ show: false, message: '', color: undefined });
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate({ to: '/auth/signin' });
      } else if (user) {
        fetchPresentations(user.username);
      }
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  useEffect(() => {
    return () => {
      if (toastTimeout.current) {
        clearTimeout(toastTimeout.current);
      }
    };
  }, []);

  async function fetchPresentations(username: string) {
    try {
      const data = await userApi.getUserPresentations(username);
      setPresentations(data || []);
    } catch (err) {
      setError('Failed to load presentations');
    }
  }

  function showToast(message: string, color = 'bg-green-600') {
    setToast({ show: true, message, color });
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => {
      setToast((t) => ({ ...t, show: false }));
    }, 1800);
  }

  if (authLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div
        className={`fixed z-50 left-1/2 -translate-x-1/2 bottom-8 px-6 py-3 rounded shadow-lg text-white text-sm font-medium transition-opacity duration-500 ${toast.color || 'bg-green-600'} ${toast.show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ minWidth: 180 }}
        aria-live="polite"
        role="status"
      >
        {toast.message}
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Presentations
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Here are your uploaded PDF presentations.
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          {presentations.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              No presentations uploaded yet
            </p>
          ) : (
            <div className="space-y-2">
              {presentations.map((presentation) => (
                <div
                  key={presentation.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <svg
                      className="w-5 h-5 text-red-500 mr-2 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                    </svg>
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      {presentation.title}
                    </span>
                  </div>
                  <div className="flex gap-2 ml-3">
                    <a
                      href={`/presentations/${presentation.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      View
                    </a>
                    <button
                      type="button"
                      className="px-3 py-1 text-sm bg-violet-100 dark:bg-violet-700 text-violet-800 dark:text-violet-100 rounded hover:bg-violet-200 dark:hover:bg-violet-600 focus:outline-none transition-colors shadow-sm border border-violet-200 dark:border-violet-600"
                      onClick={async () => {
                        const url = `${window.location.origin}/presentations/${presentation.id}`;
                        try {
                          await navigator.clipboard.writeText(url);
                          showToast(
                            'URL copied to clipboard!',
                            'bg-violet-600',
                          );
                        } catch {
                          showToast('Failed to copy URL', 'bg-red-600');
                        }
                      }}
                    >
                      <svg
                        className="inline w-4 h-4 mr-1 -mt-0.5 text-violet-500 dark:text-violet-200"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                      </svg>
                      Copy URL
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
