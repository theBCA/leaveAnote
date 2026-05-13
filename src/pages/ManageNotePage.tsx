import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { useCountdown } from '../hooks/useCountdown';
import { deleteManagedNote, getManagedNote, updateManagedNote } from '../services/noteService';
import { formatDateTime, formatCountdown, copyToClipboard } from '../utils/helpers';
import { validateMessage } from '../utils/validation';
import type { NoteData } from '../types';
import InlineNotice from '../components/InlineNotice';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ManageNotePage() {
  const { noteId, token } = useParams<{ noteId: string; token: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<NoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editMessage, setEditMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const unlockTime = note?.unlockTime;
  const countdown = useCountdown(unlockTime);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!noteId || !token) {
        if (!cancelled) {
          setError('Invalid control link.');
          setLoading(false);
        }
        return;
      }

      try {
        const managedNote = await getManagedNote(noteId, token);
        if (cancelled) return;

        setNote(managedNote);
        setError(null);
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError instanceof Error ? loadError.message : 'Failed to load your note.');
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
  }, [noteId, token]);

  const handleDelete = async () => {
    if (!noteId || !token) return;

    try {
      await deleteManagedNote(noteId, token);
      navigate('/', { replace: true });
    } catch (deleteError) {
      console.error('Error deleting note:', deleteError);
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete note.');
    }
  };

  const handleSaveEdit = async () => {
    if (!noteId || !token || !note) return;

    const validation = validateMessage(editMessage);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid message');
      return;
    }

    try {
      const updatedNote = await updateManagedNote(noteId, token, editMessage);
      setNote(updatedNote);
      setIsEditing(false);
      setStatusMessage('Note updated successfully.');
      setError(null);
    } catch (saveError) {
      console.error('Error updating note:', saveError);
      setError(saveError instanceof Error ? saveError.message : 'Failed to update note.');
    }
  };

  const handleCopyLink = async () => {
    const recipientLink = `${window.location.origin}/note/${noteId}`;
    const success = await copyToClipboard(recipientLink);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading your control panel..." />;
  }

  if (error && !note) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">This private control link is invalid or expired.</p>
          <button onClick={() => navigate('/')} className="btn-primary">Go to Home</button>
        </motion.div>
      </div>
    );
  }

  if (!note) return null;

  const recipientLink = `${window.location.origin}/note/${noteId}`;
  const canEdit = note.status === 'pending';

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Note Control Panel</h1>
          <p className="text-gray-600">Manage your scheduled message from this private link.</p>
        </motion.div>

        <div className="space-y-4 mb-6">
          {error && <InlineNotice tone="error" message={error} />}
          {statusMessage && <InlineNotice tone="success" message={statusMessage} />}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Status</h2>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
              note.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              note.status === 'revealed' ? 'bg-blue-100 text-blue-800' :
              'bg-green-100 text-green-800'
            }`}>
              {note.status === 'pending' ? 'Pending' : note.status === 'revealed' ? 'Revealed' : 'Read'}
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Created</p>
              <p className="font-semibold text-gray-900">{formatDateTime(note.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Unlock Time</p>
              <p className="font-semibold text-gray-900">{formatDateTime(note.unlockTime, note.timezone)}</p>
            </div>
            {note.status === 'pending' && !countdown.isExpired && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600 mb-1">Time Remaining</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {formatCountdown(countdown)}
                </p>
              </div>
            )}
            {note.revealedAt && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Revealed At</p>
                <p className="font-semibold text-gray-900">{formatDateTime(note.revealedAt)}</p>
              </div>
            )}
            {note.readAt && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Read At</p>
                <p className="font-semibold text-gray-900">{formatDateTime(note.readAt)}</p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Share</h2>

          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
              <QRCodeSVG value={recipientLink} size={150} level="H" />
            </div>

            <div className="flex-1 w-full">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Recipient Link</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={recipientLink}
                  readOnly
                  className="input-field flex-1 text-sm"
                  onClick={(e) => e.currentTarget.select()}
                />
                <button onClick={handleCopyLink} className="btn-secondary">
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Message</h2>
            {canEdit && !isEditing && (
              <button
                onClick={() => {
                  setEditMessage(note.message || '');
                  setStatusMessage(null);
                  setIsEditing(true);
                }}
                className="btn-secondary"
              >
                Edit
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <textarea
                value={editMessage}
                onChange={(e) => setEditMessage(e.target.value)}
                className="input-field min-h-[200px]"
                maxLength={5000}
              />
              <div className="flex gap-2">
                <button onClick={handleSaveEdit} className="btn-primary">Save Changes</button>
                <button
                  onClick={() => {
                    setEditMessage(note.message || '');
                    setError(null);
                    setIsEditing(false);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-gray-800 whitespace-pre-wrap">{note.message}</p>
            </div>
          )}
        </motion.div>

        {canEdit && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card bg-red-50 border-red-200">
            <h2 className="text-2xl font-bold text-red-900 mb-4">Danger Zone</h2>
            <p className="text-red-700 mb-4">Delete this note permanently. This action cannot be undone.</p>
            <button onClick={() => setShowDeleteConfirm(true)} className="bg-red-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-red-700 transition-colors">
              Delete Note
            </button>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Delete Note?</h3>
                <p className="text-gray-600">This will permanently delete your note. This action cannot be undone.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={handleDelete} className="flex-1 bg-red-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-red-700 transition-colors">
                  Delete
                </button>
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 btn-secondary">
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
