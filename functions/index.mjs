import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { canManageNote, createControlToken, parseAndValidateCreatePayload, presentRecipientNote, validateManagedMessage } from './note-model.mjs';
import { grantsPremiumAi, hasPendingPremiumState } from './entitlement-model.mjs';

initializeApp();
const openAiApiKey = defineSecret('OPENAI_API_KEY');
const stripeCustomersCollection = process.env.STRIPE_CUSTOMERS_COLLECTION || 'customers';

const auth = getAuth();
const db = getFirestore();
const notesCollection = db.collection('notes');
const controlsCollection = db.collection('noteControls');

function sendJson(response, status, body) {
  response.set('Cache-Control', 'no-store');
  if (status === 204) {
    response.status(status).send();
    return;
  }
  response.status(status).json(body);
}

function applyCors(request, response) {
  const origin = request.get('origin') || '*';
  response.set('Access-Control-Allow-Origin', origin);
  response.set('Vary', 'Origin');
  response.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  response.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

function handlePreflight(request, response) {
  applyCors(request, response);
  response.status(204).send();
}

function readConfiguredOpenAiKey() {
  const value = openAiApiKey.value();
  if (!value || !value.trim()) {
    throw new Error('OPENAI_API_KEY secret is not configured for the api function.');
  }
  return value;
}

async function readJson(request) {
  if (!request.body) return {};
  if (typeof request.body === 'string') return JSON.parse(request.body);
  return request.body;
}

async function loadManagedNote(noteId, token) {
  const controlDoc = await controlsCollection.doc(token).get();
  if (!controlDoc.exists || controlDoc.get('noteId') !== noteId) {
    return null;
  }

  const noteDoc = await notesCollection.doc(noteId).get();
  if (!noteDoc.exists) return null;

  return { id: noteDoc.id, ...noteDoc.data() };
}

async function requireAuthenticatedUser(request) {
  const authHeader = request.get('authorization') || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    throw new Error('A signed-in Premium account is required.');
  }

  return auth.verifyIdToken(match[1]);
}

async function loadUserSubscriptions(uid) {
  const snapshot = await db.collection(stripeCustomersCollection).doc(uid).collection('subscriptions').get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function handleCreateNote(request, response) {
  const payload = parseAndValidateCreatePayload(await readJson(request));
  const senderToken = createControlToken();

  await notesCollection.doc(payload.id).set(payload);
  await controlsCollection.doc(senderToken).set({
    noteId: payload.id,
    createdAt: payload.createdAt,
  });

  sendJson(response, 201, {
    noteId: payload.id,
    senderToken,
  });
}

async function handleGetNote(_request, response, noteId) {
  const noteDoc = await notesCollection.doc(noteId).get();
  if (!noteDoc.exists) {
    sendJson(response, 404, { error: 'Note not found.' });
    return;
  }

  const note = { id: noteDoc.id, ...noteDoc.data() };
  const presented = presentRecipientNote(note, new Date());

  if (presented.status === 'revealed' && note.status === 'pending') {
    const revealedAt = new Date().toISOString();
    await notesCollection.doc(noteId).update({ status: 'revealed', revealedAt });
    presented.revealedAt = revealedAt;
  }

  sendJson(response, 200, presented);
}

async function handleMarkRead(_request, response, noteId) {
  const noteDoc = await notesCollection.doc(noteId).get();
  if (!noteDoc.exists) {
    sendJson(response, 404, { error: 'Note not found.' });
    return;
  }

  const note = { id: noteDoc.id, ...noteDoc.data() };
  const presented = presentRecipientNote(note, new Date());
  if (presented.status === 'pending') {
    sendJson(response, 409, { error: 'This note is still locked.' });
    return;
  }

  await notesCollection.doc(noteId).update({
    status: 'read',
    readAt: new Date().toISOString(),
  });

  sendJson(response, 204, {});
}

async function handleGetManagedNote(_request, response, noteId, token) {
  const note = await loadManagedNote(noteId, token);
  if (!note) {
    sendJson(response, 404, { error: 'Control link not found.' });
    return;
  }

  sendJson(response, 200, note);
}

async function handleUpdateManagedNote(request, response, noteId, token) {
  const note = await loadManagedNote(noteId, token);
  if (!note) {
    sendJson(response, 404, { error: 'Control link not found.' });
    return;
  }
  if (!canManageNote(note)) {
    sendJson(response, 409, { error: 'This note can no longer be edited.' });
    return;
  }

  const body = await readJson(request);
  const message = validateManagedMessage(body?.message);
  await notesCollection.doc(noteId).update({ message });

  sendJson(response, 200, { ...note, message });
}

async function handleDeleteManagedNote(_request, response, noteId, token) {
  const note = await loadManagedNote(noteId, token);
  if (!note) {
    sendJson(response, 404, { error: 'Control link not found.' });
    return;
  }
  if (!canManageNote(note)) {
    sendJson(response, 409, { error: 'This note can no longer be deleted.' });
    return;
  }

  await notesCollection.doc(noteId).delete();
  await controlsCollection.doc(token).delete();
  sendJson(response, 204, {});
}

async function handleAiGenerate(request, response) {
  let decodedToken;
  try {
    decodedToken = await requireAuthenticatedUser(request);
  } catch (error) {
    sendJson(response, 401, {
      error: error instanceof Error ? error.message : 'Authentication is required.',
    });
    return;
  }

  const subscriptions = await loadUserSubscriptions(decodedToken.uid);
  if (!subscriptions.some((subscription) => grantsPremiumAi(subscription))) {
    const hasPendingSubscription = subscriptions.some((subscription) => hasPendingPremiumState(subscription));
    sendJson(response, hasPendingSubscription ? 409 : 403, {
      error: hasPendingSubscription
        ? 'Your Premium subscription is not active yet. Finish checkout or update billing to unlock Luna.'
        : 'Premium AI access is required to use Luna.',
    });
    return;
  }

  const body = await readJson(request);
  let apiKey;
  try {
    apiKey = readConfiguredOpenAiKey();
  } catch (error) {
    sendJson(response, 503, { error: 'AI writing is not configured on the server.' });
    return;
  }

  const systemPrompt = [
    'You are Luna, a warm and concise message writer for LeaveANote.',
    'Write personal, human-sounding messages tailored to the recipient.',
    'Keep the result to 2-4 short paragraphs.',
    'Do not use markdown.',
    'Do not mention AI.',
  ].join(' ');

  const userPrompt = [
    `Occasion: ${body.occasionLabel || 'A personal note'}`,
    `Recipient: ${body.recipientName || 'someone special'}`,
    `Relationship: ${body.relationship || 'Personal'}`,
    `Tone: ${body.tone || 'heartfelt'}`,
    body.senderName ? `From: ${body.senderName}` : '',
    body.details ? `Details: ${body.details}` : '',
    '',
    'Write the message now.',
  ].filter(Boolean).join('\n');

  const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 600,
      temperature: 0.85,
    }),
  });

  if (!openAiResponse.ok) {
    const failure = await openAiResponse.json().catch(() => null);
    sendJson(response, openAiResponse.status, {
      error: failure?.error?.message || 'Failed to generate message.',
    });
    return;
  }

  const data = await openAiResponse.json();
  sendJson(response, 200, {
    message: data.choices?.[0]?.message?.content?.trim() || '',
  });
}

export const api = onRequest({ secrets: [openAiApiKey] }, async (request, response) => {
  try {
    applyCors(request, response);
    if (request.method === 'OPTIONS') {
      handlePreflight(request, response);
      return;
    }

    const pathname = new URL(request.url, 'https://leaveanote.local').pathname.replace(/^\/api/, '');
    const segments = pathname.split('/').filter(Boolean);

    if (request.method === 'POST' && segments.length === 1 && segments[0] === 'notes') {
      await handleCreateNote(request, response);
      return;
    }

    if (request.method === 'GET' && segments.length === 2 && segments[0] === 'notes') {
      await handleGetNote(request, response, segments[1]);
      return;
    }

    if (request.method === 'POST' && segments.length === 3 && segments[0] === 'notes' && segments[2] === 'read') {
      await handleMarkRead(request, response, segments[1]);
      return;
    }

    if (segments.length === 3 && segments[0] === 'manage') {
      const [, noteId, token] = segments;

      if (request.method === 'GET') {
        await handleGetManagedNote(request, response, noteId, token);
        return;
      }
      if (request.method === 'PUT') {
        await handleUpdateManagedNote(request, response, noteId, token);
        return;
      }
      if (request.method === 'DELETE') {
        await handleDeleteManagedNote(request, response, noteId, token);
        return;
      }
    }

    if (request.method === 'POST' && pathname === '/ai/generate') {
      await handleAiGenerate(request, response);
      return;
    }

    sendJson(response, 404, { error: 'Not found.' });
  } catch (error) {
    console.error(error);
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : 'Unexpected server error.',
    });
  }
});
