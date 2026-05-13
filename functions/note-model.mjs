import { randomBytes, randomUUID } from 'node:crypto';

const MAX_MESSAGE_LENGTH = 5000;
const MIN_FUTURE_MS = 60 * 1000;
const MAX_FUTURE_MS = 10 * 365 * 24 * 60 * 60 * 1000;

export function createControlToken() {
  return randomBytes(32).toString('hex');
}

export function parseAndValidateCreatePayload(payload, now = new Date()) {
  const message = typeof payload?.message === 'string' ? payload.message.trim() : '';
  if (!message) {
    throw new Error('Message cannot be empty.');
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    throw new Error('Message must be less than 5000 characters.');
  }

  const unlockTime = new Date(payload?.unlockTime);
  if (Number.isNaN(unlockTime.getTime())) {
    throw new Error('Unlock time is invalid.');
  }

  const diff = unlockTime.getTime() - now.getTime();
  if (diff < MIN_FUTURE_MS) {
    throw new Error('Unlock time must be at least 1 minute in the future.');
  }
  if (diff > MAX_FUTURE_MS) {
    throw new Error('Unlock time cannot be more than 10 years in the future.');
  }

  return {
    id: randomUUID(),
    message,
    unlockTime: unlockTime.toISOString(),
    createdAt: now.toISOString(),
    status: 'pending',
    timezone: typeof payload?.timezone === 'string' && payload.timezone.trim() ? payload.timezone : 'UTC',
    theme: typeof payload?.theme === 'string' ? payload.theme : 'classic',
    teaser: typeof payload?.teaser === 'string' && payload.teaser.trim() ? payload.teaser.trim().slice(0, 120) : undefined,
    senderName: typeof payload?.senderName === 'string' && payload.senderName.trim() ? payload.senderName.trim().slice(0, 50) : undefined,
  };
}

export function presentRecipientNote(note, now = new Date()) {
  const unlockTime = new Date(note.unlockTime);
  const isUnlocked = unlockTime.getTime() <= now.getTime();

  if (!isUnlocked) {
    return {
      id: note.id,
      unlockTime: note.unlockTime,
      createdAt: note.createdAt,
      status: 'pending',
      timezone: note.timezone,
      theme: note.theme,
      teaser: note.teaser,
      senderName: note.senderName,
    };
  }

  return {
    id: note.id,
    message: note.message,
    unlockTime: note.unlockTime,
    createdAt: note.createdAt,
    status: note.status === 'read' ? 'read' : 'revealed',
    timezone: note.timezone,
    revealedAt: note.revealedAt,
    readAt: note.readAt,
    theme: note.theme,
    teaser: note.teaser,
    senderName: note.senderName,
  };
}

export function canManageNote(note) {
  return note.status === 'pending';
}

export function validateManagedMessage(message) {
  const normalized = typeof message === 'string' ? message.trim() : '';
  if (!normalized) {
    throw new Error('Message cannot be empty.');
  }
  if (normalized.length > MAX_MESSAGE_LENGTH) {
    throw new Error('Message must be less than 5000 characters.');
  }
  return normalized;
}
