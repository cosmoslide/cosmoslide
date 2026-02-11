import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, lazy, Suspense } from 'react';
import { uploadApi } from '@/lib/api';

const SlideEditor = lazy(() =>
  import('@cosmoslide/editor').then((m) => ({ default: m.SlideEditor })),
);
import { RequireAuth } from '@/components/require-auth';
import UploadDialog from '@/components/upload-dialog';
import AppLayout from '@/components/app-layout';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const Route = createFileRoute('/presentations/new')({
  component: EditorPage,
});

function EditorPage() {
  const navigate = useNavigate();
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);

  const handlePublish = (blob: Blob) => {
    setPendingBlob(blob);
    setShowUploadDialog(true);
  };

  const handleUpload = async (title: string, comment: string) => {
    if (!pendingBlob) return;

    setIsUploading(true);
    setError(null);

    try {
      const finalTitle = comment ? `${title} - ${comment}` : title;
      const file = new File([pendingBlob], `${title}.pdf`, {
        type: 'application/pdf',
      });
      const result = await uploadApi.uploadPresentation(file, finalTitle);

      setShowUploadDialog(false);
      setPendingBlob(null);
      navigate({ to: `/presentations/${result.id}` });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AppLayout>
      <RequireAuth>
        <div className="h-[calc(100vh-4rem)] lg:h-screen">
          {error && (
            <Alert
              variant="destructive"
              className="rounded-none border-x-0 border-t-0"
            >
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Suspense
            fallback={
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Loading editor...
              </div>
            }
          >
            <SlideEditor onPublish={handlePublish} />
          </Suspense>

          <UploadDialog
            isOpen={showUploadDialog}
            onClose={() => {
              setShowUploadDialog(false);
              setPendingBlob(null);
            }}
            onConfirm={handleUpload}
            isUploading={isUploading}
            defaultTitle="My Presentation"
          />
        </div>
      </RequireAuth>
    </AppLayout>
  );
}
