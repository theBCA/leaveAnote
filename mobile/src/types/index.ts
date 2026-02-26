import { Timestamp } from 'firebase/firestore';

export type NoteStatus = 'pending' | 'revealed' | 'read';

export interface NoteData {
  id: string;
  message: string;
  unlockTime: Timestamp;
  createdAt: Timestamp;
  status: NoteStatus;
  senderToken: string;
  mediaUrls: string[];
  timezone: string;
  revealedAt?: Timestamp;
  readAt?: Timestamp;
}

export interface CreateNoteInput {
  message: string;
  unlockTime: Date;
  files: PickedFile[];
  timezone: string;
}

export interface ShareLinks {
  recipientLink: string;
  senderLink: string;
  qrCodeData: string;
}

export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

export interface PickedFile {
  uri: string;
  name: string;
  type: string;
  size?: number;
}
