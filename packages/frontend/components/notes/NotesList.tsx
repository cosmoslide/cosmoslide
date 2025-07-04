'use client';

import { NoteItem } from './NoteItem';

interface NotesListProps {
  notes: any[];
  currentUserId?: string;
  onNoteDeleted?: (noteId: string) => void;
  emptyMessage?: string;
}

export function NotesList({ 
  notes, 
  currentUserId, 
  onNoteDeleted,
  emptyMessage = 'No notes yet' 
}: NotesListProps) {
  if (notes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <NoteItem
          key={note.id}
          note={note}
          currentUserId={currentUserId}
          onDeleted={onNoteDeleted}
        />
      ))}
    </div>
  );
}