'use client'

import { ReactNode } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'

interface CosmoPageProps {
  children: ReactNode
}

export default function CosmoPage({ children }: CosmoPageProps) {
  return <AuthProvider>{children}</AuthProvider>
}
