'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Home() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Welcome to Cosmoslide
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
          A federated social platform powered by ActivityPub
        </p>
        <div className="flex gap-4 justify-center mb-8">
          {isLoggedIn ? (
            <>
              <Link
                href="/home"
                className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 transition-colors"
              >
                Go to Home Timeline
              </Link>
              <Link
                href="/timeline/public"
                className="rounded-lg border border-gray-300 px-6 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                View Public Timeline
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/timeline/public"
                className="rounded-lg border border-gray-300 px-6 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Browse Public Timeline
              </Link>
            </>
          )}
        </div>
        {!isLoggedIn && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            New here? <Link href="/auth/signup" className="text-blue-600 hover:underline">Create an account</Link>
          </p>
        )}
      </div>
    </main>
  )
}