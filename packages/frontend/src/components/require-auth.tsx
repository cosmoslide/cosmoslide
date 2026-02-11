import { useNavigate } from '@tanstack/react-router';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Spinner } from '@/components/ui/spinner';

interface RequireAuthProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const DefaultFallback = () => (
  <div className="flex justify-center items-center py-12">
    <Spinner className="size-8 text-primary" />
  </div>
);

export function RequireAuth({ children, fallback }: RequireAuthProps) {
  const navigate = useNavigate();
  const { loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate({ to: '/auth/signin' });
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading) {
    return <>{fallback ?? <DefaultFallback />}</>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
