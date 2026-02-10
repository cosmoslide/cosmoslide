import { useState, useEffect } from 'react';
import { notesApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import type { Note, NoteVisibility } from '@/lib/types';

interface NoteComposerProps {
  onNoteCreated?: (note: Note) => void;
  placeholder?: string;
}

export default function NoteComposer({
  onNoteCreated,
  placeholder = "What's happening?",
}: NoteComposerProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<NoteVisibility>('public');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preview state
  const [activeTab, setActiveTab] = useState('write');
  const [previewHtml, setPreviewHtml] = useState('');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  useEffect(() => {
    if (user?.defaultVisibility) {
      setVisibility(user.defaultVisibility);
    }
  }, [user]);

  // Debounced preview fetching
  useEffect(() => {
    if (activeTab !== 'preview' || !content.trim()) {
      setPreviewHtml('');
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingPreview(true);
      try {
        const { html } = await notesApi.preview(content);
        setPreviewHtml(html);
      } catch (err) {
        console.error('Preview failed:', err);
        setPreviewHtml('<p class="text-red-500">Preview failed</p>');
      } finally {
        setIsLoadingPreview(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [content, activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const note = await notesApi.create({
        content: content.trim(),
        contentType: 'text/markdown',
        visibility,
      });

      setContent('');
      setActiveTab('write');
      setPreviewHtml('');
      if (onNoteCreated) {
        onNoteCreated(note);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingChars = 500 - content.length;

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit}>
        <div className="space-y-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="write">Write</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="write" className="mt-3">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={placeholder}
                maxLength={500}
                rows={3}
                className="resize-none"
                disabled={isSubmitting}
              />
            </TabsContent>

            <TabsContent value="preview" className="mt-3">
              <div className="min-h-[76px] px-3 py-2 bg-muted border rounded-md">
                {isLoadingPreview ? (
                  <p className="text-muted-foreground italic">
                    Loading preview...
                  </p>
                ) : previewHtml ? (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                ) : (
                  <p className="text-muted-foreground italic">
                    Nothing to preview
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Markdown help */}
          <div className="text-xs text-muted-foreground">
            Markdown: <code className="bg-muted px-1 rounded">**bold**</code>{' '}
            <code className="bg-muted px-1 rounded">*italic*</code>{' '}
            <code className="bg-muted px-1 rounded">[link](url)</code>{' '}
            <code className="bg-muted px-1 rounded">`code`</code>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Select
                value={visibility}
                onValueChange={(value) =>
                  setVisibility(value as NoteVisibility)
                }
                disabled={isSubmitting}
              >
                <SelectTrigger className="w-[150px] h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="unlisted">Unlisted</SelectItem>
                  <SelectItem value="followers">Followers only</SelectItem>
                  <SelectItem value="direct">Direct</SelectItem>
                </SelectContent>
              </Select>

              <span
                className={`text-sm ${remainingChars < 50 ? 'text-orange-500' : 'text-muted-foreground'}`}
              >
                {remainingChars}
              </span>
            </div>

            <Button
              type="submit"
              disabled={!content.trim() || isSubmitting || remainingChars < 0}
              className="rounded-full"
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
