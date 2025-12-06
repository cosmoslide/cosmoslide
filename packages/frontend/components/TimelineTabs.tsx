'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface TimelineTabsProps {
  activeTab: 'home' | 'public';
}

export default function TimelineTabs({ activeTab }: TimelineTabsProps) {
  const { isAuthenticated } = useAuth();

  // Hide tabs completely when not authenticated (only one tab would be visible)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex space-x-6 border-b border-gray-200 dark:border-gray-700">
      <Link
        href="/home"
        className={`pb-3 px-1 border-b-2 transition-colors ${
          activeTab === 'home'
            ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-medium'
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
        }`}
      >
        For You
      </Link>
      <Link
        href="/timeline/public"
        className={`pb-3 px-1 border-b-2 transition-colors ${
          activeTab === 'public'
            ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-medium'
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
        }`}
      >
        Public
      </Link>
    </div>
  );
}
