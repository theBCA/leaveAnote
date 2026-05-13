import { useEffect, useState } from 'react';
import type { NoteData } from '../types';
import { getNote } from '../services/noteService';

export function useNote(noteId: string | undefined) {
  const [note, setNote] = useState<NoteData | null>(null);
  const [loading, setLoading] = useState(Boolean(noteId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!noteId) {
        if (!cancelled) {
          setNote(null);
          setLoading(false);
          setError('Note not found');
        }
        return;
      }

      if (!cancelled) {
        setLoading(true);
      }

      try {
        const noteData = await getNote(noteId);
        if (cancelled) return;

        setNote(noteData);
        setError(noteData ? null : 'Note not found');
      } catch (loadError) {
        if (cancelled) return;
        setNote(null);
        setError(loadError instanceof Error ? loadError.message : 'Failed to load note.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [noteId]);

  return { note, loading, error, setNote };
}
