import test from 'node:test';
import assert from 'node:assert/strict';
import { canManageNote, parseAndValidateCreatePayload, presentRecipientNote, validateManagedMessage } from '../functions/note-model.mjs';

test('parseAndValidateCreatePayload creates a normalized note payload', () => {
  const now = new Date('2026-05-13T12:00:00.000Z');
  const result = parseAndValidateCreatePayload({
    message: '  Hello there  ',
    unlockTime: '2026-05-13T13:05:00.000Z',
    timezone: 'Europe/Berlin',
    theme: 'classic',
    teaser: '  soon  ',
    senderName: '  Alex  ',
  }, now);

  assert.equal(result.message, 'Hello there');
  assert.equal(result.unlockTime, '2026-05-13T13:05:00.000Z');
  assert.equal(result.timezone, 'Europe/Berlin');
  assert.equal(result.teaser, 'soon');
  assert.equal(result.senderName, 'Alex');
  assert.equal(result.status, 'pending');
});

test('parseAndValidateCreatePayload rejects near-immediate unlock times', () => {
  const now = new Date('2026-05-13T12:00:00.000Z');
  assert.throws(
    () => parseAndValidateCreatePayload({
      message: 'Hello',
      unlockTime: '2026-05-13T12:00:30.000Z',
    }, now),
    /at least 1 minute/,
  );
});

test('presentRecipientNote hides the message before unlock time', () => {
  const note = {
    id: 'note-1',
    message: 'Secret',
    unlockTime: '2026-05-13T14:00:00.000Z',
    createdAt: '2026-05-13T12:00:00.000Z',
    status: 'pending',
    timezone: 'UTC',
    theme: 'classic',
  };

  const presented = presentRecipientNote(note, new Date('2026-05-13T13:00:00.000Z'));
  assert.equal(presented.status, 'pending');
  assert.equal('message' in presented, false);
});

test('presentRecipientNote reveals the message after unlock time', () => {
  const note = {
    id: 'note-1',
    message: 'Secret',
    unlockTime: '2026-05-13T12:30:00.000Z',
    createdAt: '2026-05-13T12:00:00.000Z',
    status: 'pending',
    timezone: 'UTC',
    theme: 'classic',
  };

  const presented = presentRecipientNote(note, new Date('2026-05-13T13:00:00.000Z'));
  assert.equal(presented.status, 'revealed');
  assert.equal(presented.message, 'Secret');
});

test('canManageNote only allows edits while pending', () => {
  assert.equal(canManageNote({ status: 'pending' }), true);
  assert.equal(canManageNote({ status: 'revealed' }), false);
  assert.equal(canManageNote({ status: 'read' }), false);
});

test('validateManagedMessage trims and validates message content', () => {
  assert.equal(validateManagedMessage('  Updated message  '), 'Updated message');
  assert.throws(() => validateManagedMessage('   '), /cannot be empty/i);
});
