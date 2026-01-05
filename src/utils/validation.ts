import type { UploadedFile } from '../types';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates a message string
 */
export function validateMessage(message: string): ValidationResult {
  if (!message || message.trim().length === 0) {
    return { isValid: false, error: 'Message cannot be empty' };
  }

  if (message.length > 5000) {
    return { isValid: false, error: 'Message must be less than 5000 characters' };
  }

  return { isValid: true };
}

/**
 * Validates a file for upload
 */
export function validateFile(file: File): ValidationResult {
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (file.size > maxSize) {
    return { isValid: false, error: `File ${file.name} is too large. Max size is 10MB` };
  }

  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
  const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: `File type ${file.type} is not supported` };
  }

  return { isValid: true };
}

/**
 * Validates unlock time is in the future
 */
export function validateUnlockTime(unlockTime: Date): ValidationResult {
  const now = new Date();
  
  if (unlockTime <= now) {
    return { isValid: false, error: 'Unlock time must be in the future' };
  }

  // Maximum unlock time: 10 years in the future
  const maxFuture = new Date(now.getTime() + 10 * 365 * 24 * 60 * 60 * 1000);
  if (unlockTime > maxFuture) {
    return { isValid: false, error: 'Unlock time cannot be more than 10 years in the future' };
  }

  // Minimum unlock time: 1 minute in the future
  const minFuture = new Date(now.getTime() + 60 * 1000);
  if (unlockTime < minFuture) {
    return { isValid: false, error: 'Unlock time must be at least 1 minute in the future' };
  }

  return { isValid: true };
}

/**
 * Gets the file type (image or video)
 */
export function getFileType(file: File): 'image' | 'video' | 'unknown' {
  if (file.type.startsWith('image/')) {
    return 'image';
  }
  if (file.type.startsWith('video/')) {
    return 'video';
  }
  return 'unknown';
}

/**
 * Validates a sender token format
 */
export function validateSenderToken(token: string): ValidationResult {
  if (!token || token.trim().length === 0) {
    return { isValid: false, error: 'Token is required' };
  }

  // Basic token format validation (alphanumeric and hyphens)
  const tokenRegex = /^[a-zA-Z0-9-]+$/;
  if (!tokenRegex.test(token)) {
    return { isValid: false, error: 'Invalid token format' };
  }

  return { isValid: true };
}

/**
 * Validates note ID format
 */
export function validateNoteId(noteId: string): ValidationResult {
  if (!noteId || noteId.trim().length === 0) {
    return { isValid: false, error: 'Note ID is required' };
  }

  return { isValid: true };
}

