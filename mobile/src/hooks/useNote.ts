import { useState, useEffect } from 'react';
import { subscribeToNote } from '../services/noteService';
import type { NoteData } from '../types';

export function useNote(noteId?: string) {
  const [note, setNote] = useState<NoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!noteId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToNote(noteId, (noteData) => {
      setNote(noteData);
      setLoading(false);
      if (!noteData) {
        setError('Note not found');
      }
    });

    return () => unsubscribe();
  }, [noteId]);

  return { note, loading, error };
}
