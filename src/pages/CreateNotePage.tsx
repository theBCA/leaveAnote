import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import CreateNoteForm from '../components/CreateNoteForm';
import ShareModal from '../components/ShareModal';
import { createNote } from '../services/noteService';
import type { CreateNoteInput } from '../types';

export default function CreateNotePage() {
  const location = useLocation();
  const isReply = location.state?.isReply || false;
  
  const [loading, setLoading] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareLinks, setShareLinks] = useState({
    recipientLink: '',
    senderLink: '',
    noteId: '',
  });

  const handleCreateNote = async (data: CreateNoteInput) => {
    setLoading(true);
    try {
      const { noteId, senderToken } = await createNote(data);
      
      const baseUrl = window.location.origin;
      const recipientLink = `${baseUrl}/note/${noteId}`;
      const senderLink = `${baseUrl}/manage/${noteId}/${senderToken}`;
      
      setShareLinks({
        recipientLink,
        senderLink,
        noteId,
      });
      setShareModalOpen(true);
    } catch (error) {
      console.error('Error creating note:', error);
      alert('Failed to create note. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShareModalOpen(false);
    // Navigate to home or reset form
    window.location.reload();
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          {isReply && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-4"
            >
              💬 Replying to message
            </motion.div>
          )}
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            {isReply ? 'Send Your Reply' : 'LeaveANote'}
          </h1>
          <p className="text-xl text-gray-600">
            {isReply 
              ? 'Create a time-locked reply to this message' 
              : 'Create a time-locked message for someone special'}
          </p>
        </motion.div>

        <div className="card">
          <CreateNoteForm onSubmit={handleCreateNote} loading={loading} />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center text-sm text-gray-500"
        >
          <p>Your message will be encrypted and stored securely.</p>
          <p className="mt-1">Only the recipient can view it after the unlock time.</p>
        </motion.div>
      </div>

      <ShareModal
        isOpen={shareModalOpen}
        onClose={handleCloseModal}
        recipientLink={shareLinks.recipientLink}
        senderLink={shareLinks.senderLink}
        noteId={shareLinks.noteId}
      />
    </div>
  );
}
