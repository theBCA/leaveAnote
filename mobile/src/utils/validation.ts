import type { PickedFile } from '../types';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateMessage(message: string): ValidationResult {
  if (!message || message.trim().length === 0) {
    return { isValid: false, error: 'Message cannot be empty' };
  }
  if (message.length > 5000) {
    return { isValid: false, error: 'Message must be less than 5000 characters' };
  }
  return { isValid: true };
}

export function validatePickedFile(file: PickedFile): ValidationResult {
  const maxSize = 10 * 1024 * 1024;

  if (file.size && file.size > maxSize) {
    return { isValid: false, error: `File ${file.name} is too large. Max size is 10MB` };
  }

  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/quicktime',
  ];

  if (file.type && !allowedTypes.includes(file.type)) {
    return { isValid: false, error: `File type ${file.type} is not supported` };
  }

  return { isValid: true };
}

export function validateUnlockTime(unlockTime: Date): ValidationResult {
  const now = new Date();

  if (unlockTime <= now) {
    return { isValid: false, error: 'Unlock time must be in the future' };
  }

  const maxFuture = new Date(now.getTime() + 10 * 365 * 24 * 60 * 60 * 1000);
  if (unlockTime > maxFuture) {
    return { isValid: false, error: 'Unlock time cannot be more than 10 years in the future' };
  }

  const minFuture = new Date(now.getTime() + 60 * 1000);
  if (unlockTime < minFuture) {
    return { isValid: false, error: 'Unlock time must be at least 1 minute in the future' };
  }

  return { isValid: true };
}

export function getFileType(mimeType: string): 'image' | 'video' | 'unknown' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'unknown';
}

export function validateSenderToken(token: string): ValidationResult {
  if (!token || token.trim().length === 0) {
    return { isValid: false, error: 'Token is required' };
  }
  const tokenRegex = /^[a-zA-Z0-9-]+$/;
  if (!tokenRegex.test(token)) {
    return { isValid: false, error: 'Invalid token format' };
  }
  return { isValid: true };
}

export function validateNoteId(noteId: string): ValidationResult {
  if (!noteId || noteId.trim().length === 0) {
    return { isValid: false, error: 'Note ID is required' };
  }
  return { isValid: true };
}
