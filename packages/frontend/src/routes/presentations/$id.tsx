import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect, lazy, Suspense } from 'react';
import { uploadApi } from '@/lib/api';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Download, ArrowLeft } from 'lucide-react';

const PresentationViewer = lazy(
  () => import('@/components/PresentationViewer'),
);

interface PresentationData {
  id: string;
  title: string;
  url: string;
  pdfKey: string;
  noteId: string | null;
  userId: string;
  createdAt: string;
}

export const Route = createFileRoute('/presentations/$id')({
  component: PresentationPage,
});

function PresentationPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const [presentation, setPresentation] = useState<PresentationData | null>(
    null,
  );
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPresentation();
  }, [id]);

  const fetchPresentation = async () => {
    try {
      setLoading(true);
      const data = await uploadApi.getPresentation(id);
      setPresentation(data);

      const s3Base = (import.meta.env.VITE_S3_PUBLIC_URL || '').replace(
        /\/$/,
        '',
      );
      const s3Key = (data.pdfKey || '').replace(/^\//, '');
      const directUrl = s3Base && s3Key ? `${s3Base}/${s3Key}` : null;
      if (directUrl) {
        setPdfUrl(directUrl);
        setDownloadUrl(directUrl);
      } else {
        const proxyUrl = await uploadApi.getFileUrl(data.pdfKey);
        setPdfUrl(proxyUrl);
        setDownloadUrl(proxyUrl);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to load presentation',
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Spinner className="h-12 w-12" />
          <p className="mt-4 text-muted-foreground">Loading presentation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">{error}</p>
          <Button onClick={() => navigate({ to: '/upload' })} className="mt-4">
            Back to Upload
          </Button>
        </div>
      </div>
    );
  }

  if (!presentation) {
    return null;
  }

  return (
    <AppLayout>
      <div className="bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-foreground truncate">
                {presentation.title}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {downloadUrl && (
                <Button size="sm" asChild>
                  <a
                    href={downloadUrl}
                    download={presentation.title || 'presentation.pdf'}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </a>
                </Button>
              )}
              <Button
                size="sm"
                variant="secondary"
                onClick={() => navigate({ to: '/upload' })}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {pdfUrl && (
          <Suspense
            fallback={
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <Spinner className="h-12 w-12" />
                  <p className="mt-4 text-muted-foreground">
                    Loading viewer...
                  </p>
                </div>
              </div>
            }
          >
            <PresentationViewer pdfUrl={pdfUrl} title={presentation.title} />
          </Suspense>
        )}
      </div>
    </AppLayout>
  );
}
