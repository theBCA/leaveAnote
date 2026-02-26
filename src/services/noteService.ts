import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  deleteDoc,
  onSnapshot,
  Timestamp,
  type Unsubscribe
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import type { NoteData, CreateNoteInput, NoteStatus } from '../types';
import { generateUniqueId, generateToken } from '../utils/helpers';
import { encryptMessage, decryptMessage } from '../utils/encryption';

const NOTES_COLLECTION = 'notes';

export async function createNote(input: CreateNoteInput): Promise<{
  noteId: string;
  senderToken: string;
}> {
  const noteId = generateUniqueId();
  const senderToken = generateToken();
  
  // Encrypt the message
  const encryptedMessage = await encryptMessage(input.message);
  
  // Upload files to Firebase Storage
  const mediaUrls: string[] = [];
  for (const file of input.files) {
    const fileRef = ref(storage, `notes/${noteId}/${file.name}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    mediaUrls.push(url);
  }
  
  // Create note document
  const noteData: Omit<NoteData, 'id'> = {
    message: encryptedMessage,
    unlockTime: Timestamp.fromDate(input.unlockTime),
    createdAt: Timestamp.now(),
    status: 'pending',
    senderToken,
    mediaUrls,
    timezone: input.timezone,
  };
  
  await setDoc(doc(db, NOTES_COLLECTION, noteId), noteData);
  
  return { noteId, senderToken };
}

export async function getNote(noteId: string): Promise<NoteData | null> {
  const noteDoc = await getDoc(doc(db, NOTES_COLLECTION, noteId));
  
  if (!noteDoc.exists()) {
    return null;
  }
  
  const data = noteDoc.data() as Omit<NoteData, 'id'>;
  
  // Decrypt the message
  const decryptedMessage = await decryptMessage(data.message);
  
  return {
    id: noteDoc.id,
    ...data,
    message: decryptedMessage,
  };
}

export function subscribeToNote(
  noteId: string, 
  callback: (note: NoteData | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, NOTES_COLLECTION, noteId), async (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    
    const data = snapshot.data() as Omit<NoteData, 'id'>;
    const decryptedMessage = await decryptMessage(data.message);
    
    callback({
      id: snapshot.id,
      ...data,
      message: decryptedMessage,
    });
  });
}

export async function updateNoteStatus(
  noteId: string, 
  status: NoteStatus
): Promise<void> {
  const updateData: Partial<NoteData> = { status };
  
  if (status === 'revealed') {
    updateData.revealedAt = Timestamp.now();
  } else if (status === 'read') {
    updateData.readAt = Timestamp.now();
  }
  
  await updateDoc(doc(db, NOTES_COLLECTION, noteId), updateData);
}

export async function updateNoteContent(
  noteId: string,
  senderToken: string,
  message: string,
  files: File[]
): Promise<void> {
  // Verify sender token
  const note = await getNote(noteId);
  if (!note || note.senderToken !== senderToken) {
    throw new Error('Unauthorized');
  }
  
  if (note.status !== 'pending') {
    throw new Error('Cannot edit note that has been revealed');
  }
  
  // Encrypt new message
  const encryptedMessage = await encryptMessage(message);
  
  // Upload new files
  const mediaUrls: string[] = [...note.mediaUrls];
  for (const file of files) {
    const fileRef = ref(storage, `notes/${noteId}/${file.name}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    mediaUrls.push(url);
  }
  
  await updateDoc(doc(db, NOTES_COLLECTION, noteId), {
    message: encryptedMessage,
    mediaUrls,
  });
}

export async function deleteNote(noteId: string, senderToken: string): Promise<void> {
  // Verify sender token
  const note = await getNote(noteId);
  if (!note || note.senderToken !== senderToken) {
    throw new Error('Unauthorized');
  }
  
  // Delete media files
  for (const url of note.mediaUrls) {
    try {
      const fileRef = ref(storage, url);
      await deleteObject(fileRef);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }
  
  // Delete note document
  await deleteDoc(doc(db, NOTES_COLLECTION, noteId));
}

export async function verifySenderToken(noteId: string, token: string): Promise<boolean> {
  const note = await getNote(noteId);
  return note?.senderToken === token;
}
