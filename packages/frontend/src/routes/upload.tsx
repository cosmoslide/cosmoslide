import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { uploadApi } from '@/lib/api';
import { RequireAuth } from '@/components/RequireAuth';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CloudUpload } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/upload')({
  component: UploadPage,
});

function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [presentationResult, setPresentationResult] = useState<{
    id: string;
    title: string;
    url: string;
  } | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files?.[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
        setError(null);
      } else {
        setError('Only PDF files are allowed');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Only PDF files are allowed');
        e.target.value = '';
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    if (!title?.trim()) {
      setError('Please enter a title for the presentation');
      return;
    }

    setUploading(true);
    setError(null);
    setPresentationResult(null);

    try {
      // Combine title and comment
      const finalTitle = comment.trim()
        ? `${title} - ${comment.trim()}`
        : title;
      const result = await uploadApi.uploadPresentation(file, finalTitle);
      setPresentationResult({
        id: result.id,
        title: result.title,
        url: result.url,
      });
      setFile(null);
      setTitle('');
      setComment('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <AppLayout>
      <RequireAuth>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Upload Presentation</h1>
            <p className="mt-2 text-muted-foreground">
              Upload PDF presentations and share them on your timeline
            </p>
          </div>

          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <Label htmlFor="title">Presentation Title</Label>
                <Input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter presentation title"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="comment">
                  Comment{' '}
                  <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a note or description"
                  rows={3}
                  className="mt-2"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Comment will be appended to the title
                </p>
              </div>

              <div
                className={cn(
                  'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                  dragActive ? 'border-primary bg-primary/5' : 'border-border',
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <CloudUpload className="w-16 h-16 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex justify-center">
                      <Label htmlFor="file-upload" className="cursor-pointer">
                        <Button type="button" asChild>
                          <span>Choose PDF File</span>
                        </Button>
                      </Label>
                    </div>
                    <input
                      id="file-upload"
                      type="file"
                      accept=".pdf,application/pdf"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <p className="mt-2 text-sm text-muted-foreground">
                      or drag and drop a PDF file here
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Only PDF files are allowed (max 200MB)
                    </p>
                  </div>
                  {file && (
                    <div className="mt-4 p-3 bg-muted rounded">
                      <p className="text-sm">
                        <span className="font-medium">Selected:</span>{' '}
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleUpload}
                  disabled={!file || !title || uploading}
                  className="flex-1"
                >
                  {uploading ? 'Uploading...' : 'Upload Presentation'}
                </Button>
                {file && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setFile(null);
                      setTitle('');
                      setComment('');
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {presentationResult && (
                <Alert>
                  <AlertDescription>
                    <p className="font-medium mb-2">
                      Presentation uploaded successfully!
                    </p>
                    <p className="text-xs mb-1">
                      Title: {presentationResult.title}
                    </p>
                    <a
                      href={`/presentations/${presentationResult.id}`}
                      className="text-xs text-primary hover:underline break-all"
                    >
                      View Presentation: {presentationResult.url}
                    </a>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </RequireAuth>
    </AppLayout>
  );
}
