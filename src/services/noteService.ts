import { ApiError, apiRequest } from './apiClient';
import { fromNoteApi, type CreateNoteResponse } from './noteTransform';
import type { CreateNoteInput, NoteData } from '../types';

interface NotePayload {
  id: string;
  message?: string;
  unlockTime: string;
  createdAt: string;
  status: NoteData['status'];
  timezone: string;
  revealedAt?: string;
  readAt?: string;
  theme?: NoteData['theme'];
  teaser?: string;
  senderName?: string;
}

export async function createNote(input: CreateNoteInput): Promise<CreateNoteResponse> {
  if (input.files.length > 0) {
    throw new Error('Attachments are temporarily unavailable in the production-safe web release.');
  }

  return apiRequest<CreateNoteResponse>('/api/notes', {
    method: 'POST',
    body: JSON.stringify({
      message: input.message,
      unlockTime: input.unlockTime.toISOString(),
      timezone: input.timezone,
      theme: input.theme,
      teaser: input.teaser,
      senderName: input.senderName,
    }),
  });
}

export async function getNote(noteId: string): Promise<NoteData | null> {
  try {
    const payload = await apiRequest<NotePayload>(`/api/notes/${noteId}`);
    return fromNoteApi(payload);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function getManagedNote(noteId: string, token: string): Promise<NoteData> {
  const payload = await apiRequest<NotePayload>(`/api/manage/${noteId}/${token}`);
  return fromNoteApi(payload);
}

export async function markNoteRead(noteId: string): Promise<void> {
  await apiRequest(`/api/notes/${noteId}/read`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function updateManagedNote(
  noteId: string,
  token: string,
  message: string,
): Promise<NoteData> {
  const payload = await apiRequest<NotePayload>(`/api/manage/${noteId}/${token}`, {
    method: 'PUT',
    body: JSON.stringify({ message }),
  });
  return fromNoteApi(payload);
}

export async function deleteManagedNote(noteId: string, token: string): Promise<void> {
  await apiRequest(`/api/manage/${noteId}/${token}`, {
    method: 'DELETE',
    body: JSON.stringify({}),
  });
}
