import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { copyToClipboard, shareLink } from '../utils/helpers';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientLink: string;
  senderLink: string;
  noteId: string;
}

export default function ShareModal({
  isOpen,
  onClose,
  recipientLink,
  senderLink,
  noteId,
}: ShareModalProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const [copiedRecipient, setCopiedRecipient] = React.useState(false);
  const [copiedSender, setCopiedSender] = React.useState(false);

  if (!isOpen) return null;

  const handleCopyRecipient = async () => {
    const success = await copyToClipboard(recipientLink);
    if (success) {
      setCopiedRecipient(true);
      setTimeout(() => setCopiedRecipient(false), 2000);
    }
  };

  const handleCopySender = async () => {
    const success = await copyToClipboard(senderLink);
    if (success) {
      setCopiedSender(true);
      setTimeout(() => setCopiedSender(false), 2000);
    }
  };

  const handleShare = async () => {
    const shared = await shareLink(recipientLink, 'Someone left you a note!');
    if (!shared) {
      handleCopyRecipient();
    }
  };

  const downloadQR = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');

      const downloadLink = document.createElement('a');
      downloadLink.download = `note-${noteId}-qr.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Note Created!</h2>
          <p className="text-gray-600 mt-2">Share this note with your recipient</p>
        </div>

        {/* QR Code */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6 flex justify-center" ref={qrRef}>
          <QRCodeSVG value={recipientLink} size={200} level="H" />
        </div>

        <button
          onClick={downloadQR}
          className="btn-secondary w-full mb-6"
        >
          Download QR Code
        </button>

        {/* Recipient Link */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Share Link (for recipient)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={recipientLink}
              readOnly
              className="input-field flex-1 text-sm"
              onClick={(e) => e.currentTarget.select()}
            />
            <button
              onClick={handleCopyRecipient}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {copiedRecipient ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Sender Control Link */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Your Control Link (save this!)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={senderLink}
              readOnly
              className="input-field flex-1 text-sm"
              onClick={(e) => e.currentTarget.select()}
            />
            <button
              onClick={handleCopySender}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              {copiedSender ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Keep this link to manage your note (edit or cancel before it's revealed)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button onClick={handleShare} className="btn-primary flex-1">
            Share
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">
            Done
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
