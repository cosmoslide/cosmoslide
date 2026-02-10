import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { authApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { UserCircle, AlertCircle, Loader2 } from 'lucide-react';

const verifySearchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute('/auth/verify')({
  validateSearch: verifySearchSchema,
  component: VerifyPage,
});

function VerifyPage() {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [needsUsername, setNeedsUsername] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const { token } = Route.useSearch();

  useEffect(() => {
    if (!token) {
      setMessage('Invalid magic link');
      setVerifying(false);
      return;
    }

    // Check if this is a new user by attempting to verify
    checkToken();
  }, [token]);

  const checkToken = async () => {
    try {
      const data = await authApi.verifyToken(token!);
      localStorage.setItem('token', data.access_token);
      await refreshUser();
      navigate({ to: '/home' });
    } catch (error: unknown) {
      // Check if error indicates new user needs username
      if (
        error instanceof Error &&
        (error.message?.includes('Username is required') ||
          error.message?.includes('username'))
      ) {
        setNeedsUsername(true);
        setVerifying(false);
      } else {
        setMessage('Invalid or expired magic link');
        setVerifying(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // For new users, send username with verification
      const data = await authApi.verifyToken(token!, username, displayName);
      localStorage.setItem('token', data.access_token);
      await refreshUser();
      navigate({ to: '/home' });
    } catch {
      setMessage('Failed to complete account setup');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <div className="text-center space-y-4">
          <Spinner className="h-12 w-12 mx-auto" />
          <p className="text-muted-foreground">Verifying your magic link...</p>
        </div>
      </div>
    );
  }

  if (!needsUsername) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
        <div className="max-w-md w-full">
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {message || 'Invalid magic link'}
                </AlertDescription>
              </Alert>
              <Link to="/auth/signin">
                <Button variant="link">Back to sign in</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
      <div className="max-w-md w-full">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-extrabold">
            Complete your account setup
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose your username and display name
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5" />
              Account Setup
            </CardTitle>
            <CardDescription>
              Set up your profile to get started on Cosmoslide
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) =>
                    setUsername(
                      e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                    )
                  }
                  placeholder="username"
                  pattern="[a-z0-9_]+"
                  title="Only lowercase letters, numbers, and underscores"
                />
                <p className="text-xs text-muted-foreground">
                  Only lowercase letters, numbers, and underscores
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Display name (optional)</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Display Name"
                />
              </div>

              {message && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={loading || !username}
                className="w-full"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Creating account...' : 'Complete Setup'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
