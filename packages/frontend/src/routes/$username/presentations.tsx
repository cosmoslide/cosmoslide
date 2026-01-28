import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { userApi } from '@/lib/api';

interface Presentation {
  id: string;
  title: string;
  pdfKey: string;
  createdAt: string;
  thumbnailUrl?: string;
  description?: string;
}

export const Route = createFileRoute('/$username/presentations')({
  component: UserPresentationsPage,
});

function UserPresentationsPage() {
  const { username } = Route.useParams();
  const cleanUsername = username.replace(/^@/, '');

  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPresentations = async () => {
      try {
        const data = await userApi.getUserPresentations(cleanUsername);
        setPresentations(data.presentations || data || []);
      } catch (err) {
        setError('Failed to load presentations');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPresentations();
  }, [cleanUsername]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (presentations.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">No presentations yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {presentations.map((presentation) => (
        <Link
          key={presentation.id}
          to="/presentations/$id"
          params={{ id: presentation.id }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
        >
          <div className="aspect-video bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            {presentation.thumbnailUrl ? (
              <img
                src={presentation.thumbnailUrl}
                alt={presentation.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <svg
                className="w-16 h-16 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-medium text-gray-900 dark:text-white truncate">
              {presentation.title}
            </h3>
            {presentation.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                {presentation.description}
              </p>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              {new Date(presentation.createdAt).toLocaleDateString()}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
