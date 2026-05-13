import type { NoteData, NoteStatus } from '../types';

interface NoteApiPayload {
  id: string;
  message?: string;
  unlockTime: string;
  createdAt: string;
  status: NoteStatus;
  timezone: string;
  revealedAt?: string;
  readAt?: string;
  theme?: NoteData['theme'];
  teaser?: string;
  senderName?: string;
}

export interface CreateNoteResponse {
  noteId: string;
  senderToken: string;
}

export function fromNoteApi(payload: NoteApiPayload): NoteData {
  return {
    id: payload.id,
    message: payload.message,
    unlockTime: new Date(payload.unlockTime),
    createdAt: new Date(payload.createdAt),
    status: payload.status,
    timezone: payload.timezone,
    revealedAt: payload.revealedAt ? new Date(payload.revealedAt) : undefined,
    readAt: payload.readAt ? new Date(payload.readAt) : undefined,
    theme: payload.theme,
    teaser: payload.teaser,
    senderName: payload.senderName,
  };
}
