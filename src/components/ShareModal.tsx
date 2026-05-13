import { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { copyToClipboard, shareLink } from '../utils/helpers';
import { exportSharePdf } from '../utils/pdfExport';
import InlineNotice from './InlineNotice';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientLink: string;
  senderLink: string;
  noteId: string;
}

export default function ShareModal({ isOpen, onClose, recipientLink, senderLink, noteId }: ShareModalProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const [copiedRecipient, setCopiedRecipient] = useState(false);
  const [copiedSender, setCopiedSender] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = async (text: string, setter: (value: boolean) => void) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setter(true);
      setTimeout(() => setter(false), 2000);
    }
  };

  const handleShare = async () => {
    const shared = await shareLink(recipientLink, 'Someone left you a note!');
    if (!shared) {
      await handleCopy(recipientLink, setCopiedRecipient);
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
      const link = document.createElement('a');
      link.download = `note-${noteId}-qr.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  const handleSavePdf = async () => {
    setPdfLoading(true);
    setPdfError(null);

    try {
      const qrDataUrl = getQrDataUrl();
      await exportSharePdf({ recipientLink, senderLink, noteId, qrDataUrl });
    } catch (error) {
      console.error('PDF export failed:', error);
      setPdfError('Failed to generate the share PDF.');
    } finally {
      setPdfLoading(false);
    }
  };

  const getQrDataUrl = (): string | undefined => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return undefined;
    const svgData = new XMLSerializer().serializeToString(svg);
    return `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  const CopyIcon = ({ copied }: { copied: boolean }) => copied ? (
    <svg className="w-4 h-4" style={{ color: 'var(--success-text)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="card max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
            style={{ background: 'linear-gradient(135deg, var(--accent-from), var(--accent-to))', boxShadow: '0 8px 24px var(--accent-glow)' }}
          >
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Note Scheduled!</h2>
          <p className="mt-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>Share it with the person you're thinking of</p>
        </div>

        {pdfError && (
          <div className="mb-4">
            <InlineNotice tone="error" message={pdfError} />
          </div>
        )}

        <div className="bg-white rounded-xl p-5 mb-5 flex justify-center" ref={qrRef}>
          <QRCodeSVG value={recipientLink} size={180} level="H" />
        </div>

        <div className="flex gap-3 mb-6">
          <button onClick={downloadQR} className="btn-secondary flex-1 text-sm">Download QR</button>
          <button onClick={handleSavePdf} disabled={pdfLoading} className="btn-secondary flex-1 text-sm">
            {pdfLoading ? 'Generating...' : 'Save as PDF'}
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Recipient Link</label>
            <div className="flex gap-2">
              <input type="text" value={recipientLink} readOnly className="input-field flex-1 text-xs font-mono" onClick={(e) => e.currentTarget.select()} />
              <button onClick={() => handleCopy(recipientLink, setCopiedRecipient)} className="px-3 py-2 rounded-lg transition-colors" style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent-soft-border)', color: 'var(--accent-text)' }}>
                <CopyIcon copied={copiedRecipient} />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Your Control Link <span className="normal-case tracking-normal font-normal" style={{ color: 'var(--text-faint)' }}>- keep this private</span>
            </label>
            <div className="flex gap-2">
              <input type="text" value={senderLink} readOnly className="input-field flex-1 text-xs font-mono" onClick={(e) => e.currentTarget.select()} />
              <button onClick={() => handleCopy(senderLink, setCopiedSender)} className="px-3 py-2 rounded-lg transition-colors" style={{ background: 'var(--bg-hover)', border: '1px solid var(--divider)', color: 'var(--text-muted)' }}>
                <CopyIcon copied={copiedSender} />
              </button>
            </div>
            <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-faint)' }}>Use this private link to edit or delete before reveal.</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={handleShare} className="btn-primary flex-1">Share</button>
          <button onClick={onClose} className="btn-secondary flex-1">Done</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
