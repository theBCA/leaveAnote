import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateMessage, type AiMessageRequest } from '../services/aiService';
import type { NoteTheme } from '../types';

/* ─────────────────────────────────────────────
   Configuration
   ───────────────────────────────────────────── */

const RELATIONSHIPS = [
  { value: 'Friend', icon: '👫' },
  { value: 'Best Friend', icon: '🤝' },
  { value: 'Partner', icon: '💑' },
  { value: 'Spouse', icon: '💍' },
  { value: 'Parent', icon: '👨‍👩‍👧' },
  { value: 'Child', icon: '👶' },
  { value: 'Sibling', icon: '👯' },
  { value: 'Colleague', icon: '💼' },
  { value: 'Mentor', icon: '🎓' },
  { value: 'Someone Special', icon: '✨' },
] as const;

const TONES = [
  { value: 'heartfelt', label: 'Heartfelt', icon: '💛' },
  { value: 'funny', label: 'Funny', icon: '😄' },
  { value: 'poetic', label: 'Poetic', icon: '🖋️' },
  { value: 'casual', label: 'Casual', icon: '👋' },
  { value: 'formal', label: 'Formal', icon: '🎩' },
  { value: 'encouraging', label: 'Encouraging', icon: '💪' },
] as const;

type Step = 'recipient' | 'relationship' | 'tone' | 'details' | 'generating' | 'result';

function getLunaLine(step: Step, recipientName: string): string {
  switch (step) {
    case 'recipient':
      return "Hi there! I'm Luna, your message muse. Tell me — who is this special message for?";
    case 'relationship':
      return `${recipientName || 'They'} must be wonderful! What's your relationship?`;
    case 'tone':
      return 'Perfect. Now, what feeling should this message carry?';
    case 'details':
      return 'Almost there! Any memories, inside jokes, or details you want me to weave in?';
    case 'generating':
      return 'Give me a moment... I\'m crafting something beautiful for you.';
    case 'result':
      return 'Here\'s what I\'ve written. Feel free to use it, or I can try again!';
  }
}

/* ─────────────────────────────────────────────
   Luna Avatar — SVG with animated glow
   ───────────────────────────────────────────── */

function LunaAvatar({ size = 48, speaking = false }: { size?: number; speaking?: boolean }) {
  return (
    <motion.div
      animate={{ y: speaking ? [0, -3, 0] : 0 }}
      transition={{ duration: 2, repeat: speaking ? Infinity : 0, ease: 'easeInOut' }}
      className="relative flex-shrink-0"
      style={{ width: size, height: size }}
    >
      {/* Glow ring */}
      <motion.div
        animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.08, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-[-3px] rounded-full"
        style={{ background: 'linear-gradient(135deg, #c084fc, #f472b6, #818cf8)', filter: 'blur(6px)' }}
      />
      <svg viewBox="0 0 100 100" className="relative z-10 w-full h-full drop-shadow-lg">
        <defs>
          <linearGradient id="lunaGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <radialGradient id="skinGrad" cx="0.5" cy="0.4" r="0.5">
            <stop offset="0%" stopColor="#fde8d8" />
            <stop offset="100%" stopColor="#f5d0b0" />
          </radialGradient>
        </defs>
        {/* Background */}
        <circle cx="50" cy="50" r="48" fill="url(#lunaGrad)" />
        {/* Face */}
        <ellipse cx="50" cy="52" rx="22" ry="26" fill="url(#skinGrad)" />
        {/* Hair */}
        <path d="M28 40 Q28 16 50 14 Q72 16 72 40 Q74 56 66 60 Q62 44 50 42 Q38 44 34 60 Q26 56 28 40Z" fill="#2d1b4e" />
        <path d="M26 42 Q24 58 30 64 Q28 50 30 42Z" fill="#3d2566" opacity="0.7" />
        <path d="M74 42 Q76 58 70 64 Q72 50 70 42Z" fill="#3d2566" opacity="0.7" />
        {/* Eyes */}
        <ellipse cx="41" cy="50" rx="3.5" ry="4" fill="#2d1b4e" />
        <ellipse cx="59" cy="50" rx="3.5" ry="4" fill="#2d1b4e" />
        <circle cx="39.5" cy="48.5" r="1.2" fill="white" opacity="0.9" />
        <circle cx="57.5" cy="48.5" r="1.2" fill="white" opacity="0.9" />
        {/* Eyebrows */}
        <path d="M35 44 Q41 41 46 43" stroke="#2d1b4e" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d="M54 43 Q59 41 65 44" stroke="#2d1b4e" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        {/* Blush */}
        <circle cx="35" cy="56" r="4.5" fill="#f9a8d4" opacity="0.35" />
        <circle cx="65" cy="56" r="4.5" fill="#f9a8d4" opacity="0.35" />
        {/* Smile */}
        <path d="M43 60 Q50 66 57 60" stroke="#c084fc" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        {/* Star accessory */}
        <path d="M72 28 l2 4 4 1 -3 3 0.5 4.5 -3.5-2 -3.5 2 0.5-4.5 -3-3 4-1Z" fill="#fbbf24" opacity="0.9" />
      </svg>
      {/* Sparkle particles */}
      {speaking && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -20 - i * 8],
                x: [(i - 1) * 6, (i - 1) * 12],
                opacity: [0, 1, 0],
                scale: [0.3, 1, 0.3],
              }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.5, ease: 'easeOut' }}
              className="absolute text-[10px]"
              style={{ top: 0, left: '50%' }}
            >
              ✨
            </motion.div>
          ))}
        </>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Typing Indicator
   ───────────────────────────────────────────── */

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
          className="w-2 h-2 rounded-full"
          style={{ background: 'var(--accent-text)' }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Chat Bubble from Luna
   ───────────────────────────────────────────── */

function LunaBubble({ text, visible }: { text: string; visible: boolean }) {
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => setShowText(true), 800);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => setShowText(false), 0);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]"
      style={{
        background: 'var(--accent-soft)',
        border: '1px solid var(--accent-soft-border)',
      }}
    >
      {showText ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm leading-relaxed"
          style={{ color: 'var(--text-primary)' }}
        >
          {text}
        </motion.p>
      ) : (
        <TypingDots />
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Main Component
   ───────────────────────────────────────────── */

interface AiMessageWriterProps {
  occasion: NoteTheme;
  senderName: string;
  onUseMessage: (message: string) => void;
  disabled?: boolean;
}

export default function AiMessageWriter({ occasion, senderName, onUseMessage, disabled }: AiMessageWriterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>('recipient');
  const [recipientName, setRecipientName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [tone, setTone] = useState('');
  const [details, setDetails] = useState('');
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [step, draft, error]);

  const resetConversation = () => {
    setStep('recipient');
    setRecipientName('');
    setRelationship('');
    setTone('');
    setDetails('');
    setDraft('');
    setError('');
  };

  const handleOpen = () => {
    if (isOpen) {
      setIsOpen(false);
    } else {
      resetConversation();
      setIsOpen(true);
    }
  };

  const handleRecipientSubmit = () => {
    if (!recipientName.trim()) return;
    setStep('relationship');
  };

  const handleRelationshipPick = (val: string) => {
    setRelationship(val);
    setStep('tone');
  };

  const handleTonePick = (val: string) => {
    setTone(val);
    setStep('details');
  };

  const handleDetailsSubmit = (skip: boolean) => {
    if (!skip && !details.trim()) return;
    triggerGenerate(skip ? '' : details);
  };

  const triggerGenerate = async (detailsText: string) => {
    setStep('generating');
    setError('');
    setDraft('');

    try {
      const request: AiMessageRequest = {
        occasion,
        recipientName,
        relationship,
        tone,
        details: detailsText,
        senderName,
      };
      const result = await generateMessage(request);
      setDraft(result);
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setStep('details');
    }
  };

  const handleUse = () => {
    onUseMessage(draft);
    setIsOpen(false);
    resetConversation();
  };

  const handleRegenerate = () => {
    triggerGenerate(details);
  };

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className="group flex items-center gap-3 text-sm font-semibold px-5 py-2.5 rounded-2xl transition-all"
        style={{
          background: isOpen
            ? 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(236,72,153,0.12))'
            : 'var(--bg-hover)',
          border: isOpen
            ? '1px solid rgba(124,58,237,0.3)'
            : '1px solid var(--divider)',
          color: isOpen ? '#8b5cf6' : 'var(--text-secondary)',
        }}
      >
        <LunaAvatar size={28} speaking={false} />
        <span style={{ fontFamily: 'Pacifico', fontWeight: 100 }}>{isOpen ? 'Close Luna' : 'Write with Luna'}</span>
        {!isOpen && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 text-white tracking-wider">
            AI
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div
              className="mt-4 rounded-3xl overflow-hidden"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--bg-card-border)',
                boxShadow: '0 12px 40px var(--bg-card-shadow)',
              }}
            >
              {/* Header Bar */}
              <div
                className="px-5 py-3 flex items-center gap-3"
                style={{
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(236,72,153,0.08))',
                  borderBottom: '1px solid var(--divider)',
                }}
              >
                <LunaAvatar size={36} speaking={step === 'generating'} />
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Luna</p>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {step === 'generating' ? 'Writing...' : 'Your message muse'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetConversation}
                  className="ml-auto text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors"
                  style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', border: '1px solid var(--divider)' }}
                >
                  Start Over
                </button>
              </div>

              {/* Chat Area */}
              <div ref={scrollRef} className="px-5 py-4 space-y-5 max-h-[420px] overflow-y-auto">
                <AnimatePresence mode="wait">
                  {/* ── Step: Recipient ── */}
                  {step === 'recipient' && (
                    <motion.div key="recipient" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                      <div className="flex gap-3 items-start">
                        <LunaAvatar size={36} speaking />
                        <LunaBubble text={getLunaLine('recipient', recipientName)} visible />
                      </div>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                        className="pl-12"
                      >
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={recipientName}
                            onChange={(e) => setRecipientName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRecipientSubmit()}
                            placeholder="Their name..."
                            className="input-field text-sm flex-1"
                            maxLength={50}
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={handleRecipientSubmit}
                            disabled={!recipientName.trim()}
                            className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-30"
                            style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}
                          >
                            Next
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}

                  {/* ── Step: Relationship ── */}
                  {step === 'relationship' && (
                    <motion.div key="relationship" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                      <div className="flex gap-3 items-start">
                        <LunaAvatar size={36} speaking />
                        <LunaBubble text={getLunaLine('relationship', recipientName)} visible />
                      </div>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                        className="pl-12"
                      >
                        <div className="flex flex-wrap gap-2">
                          {RELATIONSHIPS.map((r) => (
                            <button
                              key={r.value}
                              type="button"
                              onClick={() => handleRelationshipPick(r.value)}
                              className="flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-xl transition-all hover:scale-105"
                              style={{
                                background: 'var(--bg-hover)',
                                border: '1px solid var(--divider)',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              <span>{r.icon}</span> {r.value}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    </motion.div>
                  )}

                  {/* ── Step: Tone ── */}
                  {step === 'tone' && (
                    <motion.div key="tone" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                      <div className="flex gap-3 items-start">
                        <LunaAvatar size={36} speaking />
                        <LunaBubble text={getLunaLine('tone', recipientName)} visible />
                      </div>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                        className="pl-12"
                      >
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {TONES.map((t) => (
                            <button
                              key={t.value}
                              type="button"
                              onClick={() => handleTonePick(t.value)}
                              className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl transition-all hover:scale-105"
                              style={{
                                background: 'var(--bg-hover)',
                                border: '1px solid var(--divider)',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              <span className="text-lg">{t.icon}</span> {t.label}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    </motion.div>
                  )}

                  {/* ── Step: Details ── */}
                  {step === 'details' && (
                    <motion.div key="details" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                      <div className="flex gap-3 items-start">
                        <LunaAvatar size={36} speaking />
                        <LunaBubble text={getLunaLine('details', recipientName)} visible />
                      </div>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                        className="pl-12 space-y-3"
                      >
                        <textarea
                          value={details}
                          onChange={(e) => setDetails(e.target.value)}
                          placeholder="e.g., We met in 2019, she loves sunsets, mention our road trip..."
                          className="input-field text-sm min-h-[80px] resize-y"
                          maxLength={500}
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleDetailsSubmit(false)}
                            disabled={!details.trim()}
                            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-30"
                            style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}
                          >
                            Write It
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDetailsSubmit(true)}
                            className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                            style={{
                              background: 'var(--bg-hover)',
                              border: '1px solid var(--divider)',
                              color: 'var(--text-muted)',
                            }}
                          >
                            Skip
                          </button>
                        </div>
                        {/* Error */}
                        <AnimatePresence>
                          {error && (
                            <motion.div
                              initial={{ opacity: 0, y: -8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              className="px-4 py-3 rounded-lg text-sm"
                              style={{ background: 'var(--error-bg)', border: '1px solid var(--error-border)', color: 'var(--error-text)' }}
                            >
                              {error}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </motion.div>
                  )}

                  {/* ── Step: Generating ── */}
                  {step === 'generating' && (
                    <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                      <div className="flex gap-3 items-start">
                        <LunaAvatar size={36} speaking />
                        <div className="space-y-2 flex-1">
                          <LunaBubble text={getLunaLine('generating', recipientName)} visible />
                          <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="rounded-2xl rounded-tl-sm px-4 py-3"
                            style={{ background: 'var(--bg-hover)', border: '1px solid var(--divider)' }}
                          >
                            <div className="flex items-center gap-2">
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                className="w-4 h-4 rounded-full border-2 border-t-transparent"
                                style={{ borderColor: 'var(--accent-text)', borderTopColor: 'transparent' }}
                              />
                              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                                Crafting your message...
                              </span>
                            </div>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ── Step: Result ── */}
                  {step === 'result' && (
                    <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                      <div className="flex gap-3 items-start">
                        <LunaAvatar size={36} speaking={false} />
                        <LunaBubble text={getLunaLine('result', recipientName)} visible />
                      </div>

                      {/* Draft */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="pl-12"
                      >
                        <div
                          className="rounded-2xl p-5 relative overflow-hidden"
                          style={{
                            background: 'var(--bg-input)',
                            border: '1px solid var(--bg-input-border)',
                          }}
                        >
                          {/* Shimmer */}
                          <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: '200%' }}
                            transition={{ delay: 0.8, duration: 1.5, ease: 'easeInOut' }}
                            className="absolute top-0 left-0 w-1/3 h-full pointer-events-none"
                            style={{
                              background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.06), transparent)',
                            }}
                          />
                          <p className="text-sm leading-relaxed whitespace-pre-wrap relative z-[1]" style={{ color: 'var(--text-primary)' }}>
                            {draft}
                          </p>
                        </div>

                        <div className="flex gap-2 mt-3">
                          <button
                            type="button"
                            onClick={handleUse}
                            className="flex-1 font-semibold text-sm py-2.5 rounded-xl text-white transition-all hover:scale-[1.02]"
                            style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}
                          >
                            Use This Message
                          </button>
                          <button
                            type="button"
                            onClick={handleRegenerate}
                            className="font-semibold text-sm py-2.5 px-5 rounded-xl transition-all"
                            style={{
                              background: 'var(--bg-hover)',
                              border: '1px solid var(--divider)',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            Try Again
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
