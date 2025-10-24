'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { userApi, uploadApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import CosmoPage from '@/components/CosmoPage';
import NavigationHeader from '@/components/NavigationHeader';

export default function PresentationsPage() {
  return (
    <CosmoPage>
      <PresentationsPageContent />
    </CosmoPage>
  );
}

function PresentationsPageContent() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [presentations, setPresentations] = useState<any[]>([]);
  const [previewFile, setPreviewFile] = useState<{ key: string; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/auth/signin');
      } else if (user) {
        fetchPresentations(user.username);
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  async function fetchPresentations(username: string) {
    try {
      const data = await userApi.getUserPresentations(username);
      setPresentations(data || []);
    } catch (err) {
      setError('Failed to load presentations');
    }
  }

  const handlePreview = async (pdfKey: string) => {
    try {
      // Use uploadApi.getFileUrl for preview
      const url = await uploadApi.getFileUrl(pdfKey);
      setPreviewFile({ key: pdfKey, url });
    } catch (err: any) {
      setError(err.message || 'Preview failed');
    }
  };

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
      <NavigationHeader />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Presentations</h1>
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
                    <svg className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                    </svg>
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      {presentation.title}
                    </span>
                  </div>
                  <div className="flex gap-2 ml-3">
                    <button
                      onClick={() => handlePreview(presentation.pdfKey)}
                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Preview
                    </button>
                    <a
                      href={presentation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                    >
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {previewFile && (
          <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={() => setPreviewFile(null)}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {previewFile.key}
                </h3>
                <div className="flex gap-2">
                  <a
                    href={previewFile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    Open in New Tab
                  </a>
                  <button
                    onClick={() => setPreviewFile(null)}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-700 dark:text-gray-400"
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <iframe
                  src={previewFile.url}
                  className="w-full h-full min-h-[600px] border-0"
                  title={previewFile.key}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
