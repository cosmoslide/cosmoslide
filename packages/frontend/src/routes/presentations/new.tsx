import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useRef } from 'react';
import {
  MarkdownEditor,
  MarkdownPreview,
  PageSizeControls,
  usePdfExport,
} from '@cosmoslide/editor';
import type { PageSize } from '@cosmoslide/editor';
import { uploadApi } from '@/lib/api';
import { RequireAuth } from '@/components/RequireAuth';
import UploadDialog from '@/components/UploadDialog';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const DEFAULT_PAGE_SIZE: PageSize = {
  width: 254,
  height: 143,
  margin: 10,
};

const INITIAL_MARKDOWN = `# New Presentation

Start typing your content here...

---page---

# Second Slide

Add more content...
`;

export const Route = createFileRoute('/presentations/new')({
  component: EditorPage,
});

function EditorPage() {
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [markdown, setMarkdown] = useState(INITIAL_MARKDOWN);
  const [pageSize, setPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    exportPdf,
    isExporting,
    error: exportError,
  } = usePdfExport(iframeRef, { filename: 'presentation', pageSize });

  const handleDownload = async () => {
    const blob = await exportPdf();
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'presentation.pdf';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleUpload = async (title: string, comment: string) => {
    setIsUploading(true);
    setError(null);

    try {
      const blob = await exportPdf();
      if (!blob) {
        throw new Error('Failed to generate PDF');
      }

      // Combine title and comment
      const finalTitle = comment ? `${title} - ${comment}` : title;

      const file = new File([blob], `${title}.pdf`, {
        type: 'application/pdf',
      });
      const result = await uploadApi.uploadPresentation(file, finalTitle);

      setShowUploadDialog(false);
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
        <div className="h-[calc(100vh-4rem)] lg:h-screen flex flex-col bg-muted">
          {/* Header with controls */}
          <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
            <h1 className="text-xl font-semibold text-foreground">
              Create Slide
            </h1>

            <div className="flex items-center gap-4 flex-wrap">
              <PageSizeControls pageSize={pageSize} onChange={setPageSize} />

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={handleDownload}
                  disabled={isExporting}
                >
                  {isExporting ? 'Exporting...' : 'Download PDF'}
                </Button>
                <Button
                  onClick={() => setShowUploadDialog(true)}
                  disabled={isExporting}
                >
                  Publish
                </Button>
              </div>
            </div>
          </header>

          {/* Error display */}
          {(error || exportError) && (
            <Alert
              variant="destructive"
              className="rounded-none border-x-0 border-t-0"
            >
              <AlertDescription>{error || exportError}</AlertDescription>
            </Alert>
          )}

          {/* Editor panels */}
          <main className="flex flex-1 overflow-hidden">
            <div className="flex-1 flex flex-col border-r border-border">
              <div className="px-4 py-2 bg-muted border-b border-border text-sm font-medium text-foreground">
                MARKDOWN
              </div>
              <div className="flex-1 overflow-hidden">
                <MarkdownEditor value={markdown} onChange={setMarkdown} />
              </div>
            </div>
            <div className="flex-1 flex flex-col">
              <div className="px-4 py-2 bg-muted border-b border-border text-sm font-medium text-foreground">
                PREVIEW
              </div>
              <div className="flex-1 overflow-hidden p-4 bg-muted">
                <MarkdownPreview
                  ref={iframeRef}
                  markdown={markdown}
                  pageSize={pageSize}
                />
              </div>
            </div>
          </main>

          {/* Footer with syntax help */}
          <footer className="px-4 py-2 bg-card border-t border-border text-center text-sm text-muted-foreground">
            Use{' '}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
              ---page---
            </code>{' '}
            to create page breaks
          </footer>

          <UploadDialog
            isOpen={showUploadDialog}
            onClose={() => setShowUploadDialog(false)}
            onConfirm={handleUpload}
            isUploading={isUploading}
            defaultTitle="My Presentation"
          />
        </div>
      </RequireAuth>
    </AppLayout>
  );
}
