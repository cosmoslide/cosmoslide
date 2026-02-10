import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface UploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (title: string, comment: string) => void;
  isUploading: boolean;
  defaultTitle?: string;
}

export default function UploadDialog({
  isOpen,
  onClose,
  onConfirm,
  isUploading,
  defaultTitle = '',
}: UploadDialogProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle(defaultTitle);
      setComment('');
    }
  }, [isOpen, defaultTitle]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) return;
    onConfirm(title.trim(), comment.trim());
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !isUploading && onClose()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publish Presentation</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dialog-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="dialog-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter presentation title"
              disabled={isUploading}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dialog-comment">
              Comment <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="dialog-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a note or description"
              rows={3}
              disabled={isUploading}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Comment will be appended to the title
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || isUploading}>
              {isUploading ? 'Publishing...' : 'Publish'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
