'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { userApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import CosmoPage from '@/components/CosmoPage';
import NavigationHeader from '@/components/NavigationHeader';

export default function SettingsPage() {
  return (
    <CosmoPage>
      <SettingsPageContent />
    </CosmoPage>
  );
}

function SettingsPageContent() {
  const router = useRouter();
  const {
    user: currentUser,
    loading: authLoading,
    isAuthenticated,
    refreshUser,
  } = useAuth();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    email: '',
    defaultVisibility: 'public' as
      | 'public'
      | 'unlisted'
      | 'followers'
      | 'direct',
  });
  const [privacySettings, setPrivacySettings] = useState({
    isLocked: false,
  });
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/auth/signin');
      } else if (currentUser) {
        setFormData({
          displayName: currentUser.displayName || '',
          bio: currentUser.bio || '',
          email: currentUser.email || '',
          defaultVisibility: currentUser.defaultVisibility || 'public',
        });
        if (currentUser.actor) {
          setPrivacySettings({
            isLocked: currentUser.actor.manuallyApprovesFollowers || false,
          });
        }
      }
    }
  }, [authLoading, isAuthenticated, currentUser, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await userApi.updateProfile(formData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });

      // Refresh user data from auth context
      await refreshUser();
    } catch (error) {
      console.error('Failed to update profile:', error);
      setMessage({
        type: 'error',
        text: 'Failed to update profile. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePrivacyToggle = async (setting: 'isLocked') => {
    setSavingPrivacy(true);
    setMessage(null);

    try {
      const newValue = !privacySettings[setting];
      const result = await userApi.updatePrivacySettings({
        [setting]: newValue,
      });

      setPrivacySettings((prev) => ({
        ...prev,
        [setting]: result.isLocked,
      }));

      setMessage({
        type: 'success',
        text: `Account is now ${result.isLocked ? 'private' : 'public'}`,
      });

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
      setMessage({
        type: 'error',
        text: 'Failed to update privacy settings',
      });
    } finally {
      setSavingPrivacy(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Settings
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage your account settings and preferences
            </p>
          </div>

          {/* Profile Settings Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Profile Information
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Display Name */}
              <div>
                <label
                  htmlFor="displayName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Display Name
                </label>
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your display name"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  This is how others will see your name
                </p>
              </div>

              {/* Username (read-only) */}
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={`/@${currentUser.username}`}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Your username cannot be changed
                </p>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Used for notifications and account recovery
                </p>
              </div>

              {/* Bio */}
              <div>
                <label
                  htmlFor="bio"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Tell us about yourself..."
                  maxLength={500}
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {formData.bio.length}/500 characters
                </p>
              </div>

              {/* Default Post Visibility */}
              <div>
                <label
                  htmlFor="defaultVisibility"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Default Post Visibility
                </label>
                <select
                  id="defaultVisibility"
                  name="defaultVisibility"
                  value={formData.defaultVisibility}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="public">
                    🌍 Public - Visible to everyone
                  </option>
                  <option value="unlisted">
                    🔓 Unlisted - Not shown in public timelines
                  </option>
                  <option value="followers">
                    👥 Followers only - Only visible to followers
                  </option>
                  <option value="direct">
                    ✉️ Direct - Only visible to mentioned users
                  </option>
                </select>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Choose the default visibility for your new posts
                </p>
              </div>

              {/* Success/Error Message */}
              {message && (
                <div
                  className={`p-4 rounded-lg ${
                    message.type === 'success'
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                      : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                  }`}
                >
                  {message.text}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4">
                <button
                  type="button"
                  onClick={() => router.push(`/@${currentUser.username}`)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Privacy Settings Card */}
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Privacy Settings
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Follow Requests Link */}
              <Link
                href="/follow-requests"
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mr-3">
                    <svg
                      className="w-5 h-5 text-blue-600 dark:text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      Follow Requests
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Manage pending follow requests
                    </p>
                  </div>
                </div>
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Private Account
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Require approval for new followers
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handlePrivacyToggle('isLocked')}
                  disabled={savingPrivacy}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    privacySettings.isLocked
                      ? 'bg-blue-600'
                      : 'bg-gray-200 dark:bg-gray-700'
                  } ${savingPrivacy ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`${
                      privacySettings.isLocked
                        ? 'translate-x-6'
                        : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Show Online Status
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Let others see when you're online
                  </p>
                </div>
                <button
                  type="button"
                  className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition-transform" />
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-red-200 dark:border-red-900">
            <div className="px-6 py-4 border-b border-red-200 dark:border-red-900">
              <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">
                Danger Zone
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Delete Account
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Permanently delete your account and all data
                  </p>
                </div>
                <button
                  type="button"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
