import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { userApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { RequireAuth } from '@/components/RequireAuth';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Edit, FileText, Copy } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/presentations/')({
  component: PresentationsPage,
});

function PresentationsPage() {
  const { user } = useAuth();
  const [presentations, setPresentations] = useState<
    Array<{ id: string; title: string }>
  >([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchPresentations(user.username);
    }
  }, [user]);

  async function fetchPresentations(username: string) {
    try {
      const data = await userApi.getUserPresentations(username);
      setPresentations(data || []);
    } catch (err) {
      setError('Failed to load presentations');
    }
  }

  const handleCopyUrl = async (presentationId: string) => {
    const url = `${window.location.origin}/presentations/${presentationId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('URL copied to clipboard!');
    } catch {
      toast.error('Failed to copy URL');
    }
  };

  return (
    <AppLayout>
      <RequireAuth>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">
              My Presentations
            </h1>
            <p className="mt-2 text-muted-foreground">
              Here are your uploaded PDF presentations.
            </p>
            <div className="flex gap-3 mt-4">
              <Button variant="secondary" asChild>
                <Link to="/upload">
                  <Upload className="w-5 h-5 mr-2" />
                  Upload PDF
                </Link>
              </Button>
              <Button asChild>
                <Link to="/presentations/new">
                  <Edit className="w-5 h-5 mr-2" />
                  Create from Markdown
                </Link>
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardContent className="p-6">
              {presentations.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No presentations uploaded yet
                </p>
              ) : (
                <div className="space-y-2">
                  {presentations.map((presentation) => (
                    <div
                      key={presentation.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        <FileText className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
                        <span className="text-sm text-foreground truncate">
                          {presentation.title}
                        </span>
                      </div>
                      <div className="flex gap-2 ml-3">
                        <Button size="sm" asChild>
                          <a
                            href={`/presentations/${presentation.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View
                          </a>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyUrl(presentation.id)}
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copy URL
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </RequireAuth>
    </AppLayout>
  );
}
