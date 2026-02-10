import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { userApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { FileText } from 'lucide-react';

interface Presentation {
  id: string;
  title: string;
  pdfKey: string;
  createdAt: string;
  thumbnailUrl?: string;
  description?: string;
}

export const Route = createFileRoute('/$username/presentations')({
  component: UserPresentationsPage,
});

function UserPresentationsPage() {
  const { username } = Route.useParams();
  const cleanUsername = username.replace(/^@/, '');

  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPresentations = async () => {
      try {
        const data = await userApi.getUserPresentations(cleanUsername);
        setPresentations(data.presentations || data || []);
      } catch (err) {
        setError('Failed to load presentations');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPresentations();
  }, [cleanUsername]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (presentations.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No presentations yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {presentations.map((presentation) => (
        <Link
          key={presentation.id}
          to="/presentations/$id"
          params={{ id: presentation.id }}
        >
          <Card className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video bg-muted flex items-center justify-center">
              {presentation.thumbnailUrl ? (
                <img
                  src={presentation.thumbnailUrl}
                  alt={presentation.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <FileText className="w-16 h-16 text-muted-foreground" />
              )}
            </div>
            <CardContent className="p-4">
              <h3 className="font-medium text-foreground truncate">
                {presentation.title}
              </h3>
              {presentation.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {presentation.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(presentation.createdAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
