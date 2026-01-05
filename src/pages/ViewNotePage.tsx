import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNote } from '../hooks/useNote';
import { useCountdown } from '../hooks/useCountdown';
import { updateNoteStatus } from '../services/noteService';
import CountdownTimer from '../components/CountdownTimer';
import MediaGallery from '../components/MediaGallery';
import { formatDateTime } from '../utils/helpers';

export default function ViewNotePage() {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const { note, loading, error } = useNote(noteId);
  const [isRevealed, setIsRevealed] = useState(false);
  const [hasTriggeredReveal, setHasTriggeredReveal] = useState(false);
  
  const unlockTime = note?.unlockTime?.toDate();
  const countdown = useCountdown(unlockTime);

  useEffect(() => {
    if (!note) return;

    // Check if note should be revealed
    if (countdown.isExpired && !hasTriggeredReveal) {
      setHasTriggeredReveal(true);
      
      // Update status to revealed if it's still pending
      if (note.status === 'pending') {
        updateNoteStatus(noteId!, 'revealed').catch(console.error);
      }
      
      // Trigger reveal animation after a short delay
      setTimeout(() => {
        setIsRevealed(true);
      }, 500);
    } else if (note.status === 'revealed' || note.status === 'read') {
      setIsRevealed(true);
      setHasTriggeredReveal(true);
    }
  }, [note, countdown, noteId, hasTriggeredReveal]);

  // Mark as read when user views the revealed note
  useEffect(() => {
    if (isRevealed && note && note.status === 'revealed') {
      updateNoteStatus(noteId!, 'read').catch(console.error);
    }
  }, [isRevealed, note, noteId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading note...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Note Not Found</h2>
          <p className="text-gray-600 mb-6">
            This note doesn't exist or has been deleted.
          </p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Create Your Own Note
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {!isRevealed ? (
            <motion.div
              key="countdown"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="card"
            >
              {/* Teaser */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  Someone Left You a Special Note
                </h1>
                <p className="text-xl text-gray-600">
                  Your message will be revealed soon...
                </p>
              </motion.div>

              <CountdownTimer countdown={countdown} timezone={note.timezone} />

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-12 text-center"
              >
                <p className="text-gray-600">
                  Unlocks on: <span className="font-semibold">
                    {unlockTime && formatDateTime(unlockTime, note.timezone)}
                  </span>
                </p>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="revealed"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="card"
            >
              {/* Celebration Animation */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{ duration: 2 }}
                className="absolute inset-0 pointer-events-none"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-200 via-pink-200 to-purple-200 opacity-20 rounded-2xl"></div>
              </motion.div>

              {/* Revealed Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                    className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <span className="text-3xl">✨</span>
                  </motion.div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Your Message Has Arrived!
                  </h2>
                  <p className="text-gray-600">
                    Created {note.createdAt && formatDateTime(note.createdAt.toDate())}
                  </p>
                </div>

                {/* Message */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 mb-6"
                >
                  <p className="text-lg text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {note.message}
                  </p>
                </motion.div>

                {/* Media Gallery */}
                {note.mediaUrls && note.mediaUrls.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    <MediaGallery mediaUrls={note.mediaUrls} />
                  </motion.div>
                )}

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="mt-8 flex gap-4 justify-center flex-wrap"
                >
                  <button
                    onClick={() => {
                      // Navigate to create page with reply context
                      navigate('/', { state: { replyTo: noteId, isReply: true } });
                    }}
                    className="btn-primary"
                  >
                    Leave a Reply
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="btn-secondary"
                  >
                    Create Your Own
                  </button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
