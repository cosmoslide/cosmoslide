import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
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
import { Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const searchSchema = z.object({
  invitation: z.string().optional(),
});

export const Route = createFileRoute('/auth/signup')({
  validateSearch: searchSchema,
  component: SignUpPage,
});

function SignUpPage() {
  const navigate = useNavigate();
  const { invitation } = Route.useSearch();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Send magic link request with invitation code
      await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/magic-link`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, invitationCode: invitation }),
        },
      ).then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || 'Failed to send magic link');
        }
      });

      setMessage({
        type: 'success',
        text: 'Check your email for a magic link to complete your signup!',
      });
      setEmail('');
    } catch (error) {
      console.error('Signup error:', error);
      setMessage({
        type: 'error',
        text:
          error instanceof Error ? error.message : 'Failed to send signup link',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
        <div className="max-w-md w-full">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Invitation Required</CardTitle>
              <CardDescription>
                You need an invitation link to sign up for Cosmoslide.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                variant="link"
                onClick={() => navigate({ to: '/auth/signin' })}
              >
                Already have an account? Sign in
              </Button>
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
          <h1 className="text-3xl font-bold">Welcome to Cosmoslide</h1>
          <p className="mt-2 text-muted-foreground">
            You've been invited to join! Enter your email to get started.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Create Your Account
            </CardTitle>
            <CardDescription>
              We'll send you a magic link to complete your signup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                />
              </div>

              {message && (
                <Alert
                  variant={
                    message.type === 'success' ? 'default' : 'destructive'
                  }
                >
                  {message.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>{message.text}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={loading || !email}
                className="w-full"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Sending...' : 'Continue with Email'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="link"
                onClick={() => navigate({ to: '/auth/signin' })}
              >
                Already have an account? Sign in
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
