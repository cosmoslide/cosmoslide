'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface ProfileTabsProps {
  username: string;
}

export default function ProfileTabs({ username }: ProfileTabsProps) {
  const pathname = usePathname();
  const isNotesTab = pathname === `/@${username}`;
  const isPresentationsTab = pathname === `/@${username}/presentations`;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex -mb-px">
          <Link
            href={`/@${username}`}
            className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm ${
              isNotesTab
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Notes
          </Link>
          <Link
            href={`/@${username}/presentations`}
            className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm ${
              isPresentationsTab
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Presentations
          </Link>
        </nav>
      </div>
    </div>
  );
}
