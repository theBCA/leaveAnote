import { Suspense, lazy, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import CreateNoteForm from '../components/CreateNoteForm';
import InlineNotice from '../components/InlineNotice';
import { createNote } from '../services/noteService';
import type { CreateNoteInput } from '../types';

const ShareModal = lazy(() => import('../components/ShareModal'));

export default function CreateNotePage() {
  const location = useLocation();
  const isReply = location.state?.isReply || false;

  const [loading, setLoading] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [shareLinks, setShareLinks] = useState({ recipientLink: '', senderLink: '', noteId: '' });

  const handleCreateNote = async (data: CreateNoteInput) => {
    setLoading(true);
    setError(null);

    try {
      const { noteId, senderToken } = await createNote(data);
      const baseUrl = window.location.origin;
      setShareLinks({
        recipientLink: `${baseUrl}/note/${noteId}`,
        senderLink: `${baseUrl}/manage/${noteId}/${senderToken}`,
        noteId,
      });
      setShareModalOpen(true);
    } catch (createError) {
      console.error('Error creating note:', createError);
      setError(createError instanceof Error ? createError.message : 'Failed to create note.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none" style={{ willChange: 'auto', contain: 'strict' }}>
        <div className="absolute top-[-10%] left-[10%] w-[300px] h-[300px] rounded-full blur-[80px]" style={{ background: 'var(--glow-1)' }} />
        <div className="absolute bottom-[-5%] right-[5%] w-[250px] h-[250px] rounded-full blur-[60px]" style={{ background: 'var(--glow-2)' }} />
      </div>

      <div className="relative z-10 py-16 px-4" style={{ fontWeight: 300, fontSize: '12px' }}>
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            {isReply && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-5"
                style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent-soft-border)', color: 'var(--accent-text)' }}
              >
                Replying to message
              </motion.div>
            )}

            <h1 className="text-4xl sm:text-[40px] font-thin mb-4 tracking-tight" style={{ fontFamily: "'Pacifico', cursive" }}>
              <span className="dark:hidden" style={{
                background: 'linear-gradient(135deg, #3d1c0a, #6b3410, #8b4513, #5c2d0e)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                {isReply ? 'Send Your Reply' : 'Schedule a message in time'}
              </span>
              <span className="hidden dark:inline" style={{ color: 'var(--text-primary)', fontSize: '35px' }}>
                {isReply ? 'Send Your Reply' : 'Schedule a message in time'}
              </span>
            </h1>
            <p className="max-w-md mx-auto" style={{ color: 'var(--text-secondary)', fontSize: '13px', fontFamily: 'Nunito', fontWeight: 700 }}>
              {isReply
                ? 'Create a time-based reply to this message'
                : 'Share a private link now, and let the message unlock on schedule.'}
            </p>
          </motion.div>

          {error && (
            <div className="mb-4">
              <InlineNotice tone="error" message={error} />
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="card"
          >
            <CreateNoteForm key={formKey} onSubmit={handleCreateNote} loading={loading} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-10 text-center space-y-2"
          >
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Delivery timing is enforced by the server in this web release.
            </p>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--accent-text)' }}>
              Secure sender management is available from your private control link
            </span>
          </motion.div>
        </div>
      </div>

      <Suspense fallback={null}>
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setShareLinks({ recipientLink: '', senderLink: '', noteId: '' });
            setFormKey((prev) => prev + 1);
          }}
          recipientLink={shareLinks.recipientLink}
          senderLink={shareLinks.senderLink}
          noteId={shareLinks.noteId}
        />
      </Suspense>
    </div>
  );
}
