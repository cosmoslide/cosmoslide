'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import NavigationHeader from './NavigationHeader';

interface CosmoPageProps {
  children: ReactNode;
}

export default function CosmoPage({ children }: CosmoPageProps) {
  return (
    <AuthProvider>
      <NavigationHeader />
      {children}
    </AuthProvider>
  );
}
