'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authApi } from '@/lib/api'

export default function Verify() {
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [needsUsername, setNeedsUsername] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setMessage('Invalid magic link')
      setVerifying(false)
      return
    }

    // Check if this is a new user by attempting to verify
    checkToken()
  }, [token])

  const checkToken = async () => {
    try {
      const data = await authApi.verifyToken(token!)
      localStorage.setItem('token', data.token)
      router.push('/dashboard')
    } catch (error: any) {
      // Check if error indicates new user needs username
      if (error.message?.includes('400')) {
        setNeedsUsername(true)
        setVerifying(false)
      } else {
        setMessage('Invalid or expired magic link')
        setVerifying(false)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // For new users, send username with verification
      const data = await authApi.verifyToken(token! + '&username=' + username + '&displayName=' + displayName)
      localStorage.setItem('token', data.token)
      router.push('/dashboard')
    } catch (error) {
      setMessage('Failed to complete signup')
    } finally {
      setLoading(false)
    }
  }

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Verifying your magic link...</p>
        </div>
      </div>
    )
  }

  if (!needsUsername) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-600">{message || 'Invalid magic link'}</p>
          <a href="/auth/signin" className="mt-4 inline-block text-blue-600 hover:text-blue-500">
            Back to sign in
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Complete your signup
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Choose your username and display name
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="username"
                pattern="[a-z0-9_]+"
                title="Only lowercase letters, numbers, and underscores"
              />
              <p className="mt-1 text-xs text-gray-500">Only lowercase letters, numbers, and underscores</p>
            </div>

            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Display name (optional)
              </label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Display Name"
              />
            </div>
          </div>

          {message && (
            <div className="text-sm text-red-600">
              {message}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || !username}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Complete Signup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}