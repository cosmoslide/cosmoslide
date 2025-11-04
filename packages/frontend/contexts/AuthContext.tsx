'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { authApi } from '@/lib/api'

interface User {
  id: string
  username: string
  displayName?: string
  email?: string
  bio?: string
  avatarUrl?: string
  isLocked?: boolean
  defaultVisibility?: 'public' | 'unlisted' | 'followers' | 'direct'
  actor?: {
    manuallyApprovesFollowers?: boolean
    [key: string]: any
  }
}

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  signOut: () => void
  refreshUser: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUser = useCallback(async () => {
    if (typeof window === 'undefined') {
      setLoading(false)
      return
    }

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setUser(null)
        setLoading(false)
        return
      }

      const userData = await authApi.getMe()
      setUser(userData)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch user:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch user')
      setUser(null)
      localStorage.removeItem('token')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      fetchUser()
    }
  }, [fetchUser])

  const signOut = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
    }
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    setLoading(true)
    await fetchUser()
  }, [fetchUser])

  const value: AuthContextType = {
    user,
    loading,
    error,
    signOut,
    refreshUser,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    return {
      user: null,
      loading: true,
      error: null,
      signOut: () => {},
      refreshUser: async () => {},
      isAuthenticated: false,
    }
  }
  return context
}
