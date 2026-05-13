import { Suspense, lazy, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getUserTimezone } from '../utils/helpers';
import { validateMessage, validateUnlockTime } from '../utils/validation';
import type { NoteTheme } from '../types';
import { THEME_CONFIG } from '../types';
import { useAuth } from '../context/useAuth';
import AuthDialog from './AuthDialog';
import InlineNotice from './InlineNotice';
import { uiCapabilities } from '../services/uiCapabilities';
import PremiumUpsellCard from './PremiumUpsellCard';

const AiMessageWriter = lazy(() => import('./AiMessageWriter'));

interface CreateNoteFormProps {
  onSubmit: (data: {
    message: string;
    unlockTime: Date;
    files: File[];
    timezone: string;
    theme?: NoteTheme;
    teaser?: string;
    senderName?: string;
  }) => void;
  loading: boolean;
}

export default function CreateNoteForm({ onSubmit, loading }: CreateNoteFormProps) {
  const [message, setMessage] = useState('');
  const [unlockMode, setUnlockMode] = useState<'countdown' | 'datetime'>('countdown');
  const [countdownDays, setCountdownDays] = useState(0);
  const [countdownHours, setCountdownHours] = useState(1);
  const [unlockDateTime, setUnlockDateTime] = useState('');
  const [error, setError] = useState('');
  const [theme, setTheme] = useState<NoteTheme>('classic');
  const [teaser, setTeaser] = useState('');
  const [senderName, setSenderName] = useState('');
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const { user, authReady, isPremium, premiumPending, premiumStatusLabel } = useAuth();
  const timezone = getUserTimezone();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const messageValidation = validateMessage(message);
    if (!messageValidation.isValid) {
      setError(messageValidation.error || 'Invalid message');
      return;
    }

    let unlockTime: Date;
    if (unlockMode === 'countdown') {
      unlockTime = new Date(Date.now() + (countdownDays * 24 + countdownHours) * 3600000);
    } else {
      if (!unlockDateTime) {
        setError('Please select an unlock date and time');
        return;
      }
      unlockTime = new Date(unlockDateTime);
    }

    const unlockValidation = validateUnlockTime(unlockTime);
    if (!unlockValidation.isValid) {
      setError(unlockValidation.error || 'Invalid unlock time');
      return;
    }

    onSubmit({
      message,
      unlockTime,
      files: [],
      timezone,
      theme,
      ...(teaser && { teaser }),
      ...(senderName && { senderName }),
    });
  };

  const charCount = message.length;
  const maxChars = 5000;

  return (
    <>
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="space-y-8 max-w-2xl mx-auto"
      >
        {!uiCapabilities.attachmentsEnabled && (
          <InlineNotice
            tone="info"
            message="Attachments and location locks are disabled in this production-safe web release while secure backend handling is introduced."
          />
        )}

        <div>
          <label className="block text-base mb-2" style={{ color: 'var(--text-primary)', fontFamily: "'Pacifico', cursive" }}>
            Your Name <span style={{ color: 'var(--text-muted)', fontFamily: "'Nunito', sans-serif" }} className="font-normal text-xs">(optional)</span>
          </label>
          <input
            type="text"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            placeholder="e.g., Alex"
            className="input-field"
            disabled={loading}
            maxLength={50}
          />
        </div>

        <div>
          <label className="block text-base mb-2" style={{ color: 'var(--text-primary)', fontFamily: "'Pacifico', cursive" }}>
            Your Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your time-locked message here..."
            className="input-field min-h-[180px] resize-y leading-relaxed"
            disabled={loading}
            maxLength={maxChars}
          />
          <div className="flex justify-between items-center mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>{charCount} / {maxChars}</span>
            {charCount > maxChars * 0.9 && (
              <span style={{ color: 'var(--accent-text)' }} className="font-medium">
                {maxChars - charCount} remaining
              </span>
            )}
          </div>
          <div className="mt-3">
            {isPremium ? (
              <div className="space-y-3">
                <InlineNotice tone="success" message={user?.email ? `Premium AI is active for ${user.email}.` : 'Premium AI is active on this account.'} />
                <Suspense fallback={<p className="text-xs" style={{ color: 'var(--text-muted)' }}>Loading writing assistant...</p>}>
                  <AiMessageWriter
                    occasion={theme}
                    senderName={senderName}
                    onUseMessage={(generatedMessage) => setMessage(generatedMessage)}
                    disabled={loading}
                  />
                </Suspense>
              </div>
            ) : (
              <div className="space-y-4">
                <PremiumUpsellCard compact />
                <div
                  className="rounded-2xl p-4"
                  style={{ background: 'var(--bg-hover)', border: '1px solid var(--divider)' }}
                >
                  {!authReady ? (
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Checking your account status...
                    </p>
                  ) : !user ? (
                    <div className="space-y-3">
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Sign in or create an account before starting checkout. Premium access is tied to your Firebase Auth user so Stripe can verify entitlements securely.
                      </p>
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setAuthDialogOpen(true)}
                          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
                          style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}
                        >
                          Sign in for Premium
                        </button>
                        <Link to="/pricing" className="font-semibold text-sm" style={{ color: 'var(--accent-text)' }}>
                          View plans
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <InlineNotice
                        tone={premiumPending ? 'info' : 'info'}
                        message={premiumPending
                          ? 'Your subscription exists but is not fully active yet. Finish checkout or update billing to unlock Luna AI.'
                          : `Current billing status: ${premiumStatusLabel}. Upgrade from the Premium page to unlock Luna AI.`}
                      />
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <span style={{ color: 'var(--text-secondary)' }}>
                          Signed in as <strong>{user.email}</strong>
                        </span>
                        <Link to="/pricing" className="font-semibold" style={{ color: 'var(--accent-text)' }}>
                          Manage billing
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-base mb-2" style={{ color: 'var(--text-primary)', fontFamily: "'Pacifico', cursive" }}>
            Teaser Hint <span style={{ color: 'var(--text-muted)', fontFamily: "'Nunito', sans-serif" }} className="font-normal text-xs">(optional - visible before unlock)</span>
          </label>
          <input
            type="text"
            value={teaser}
            onChange={(e) => setTeaser(e.target.value)}
            placeholder='"A memory from summer 2024..."'
            className="input-field"
            disabled={loading}
            maxLength={120}
          />
          <p className="text-xs mt-1.5" style={{ color: 'var(--text-faint)' }}>{teaser.length}/120</p>
        </div>

        <div style={{ borderTop: '1px solid var(--divider)' }} />

        <div>
          <label className="block text-base mb-1" style={{ color: 'var(--text-primary)', fontFamily: "'Pacifico', cursive" }}>
            What's the occasion?
          </label>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            Pick a theme - your recipient will get a uniquely styled reveal experience.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(Object.entries(THEME_CONFIG) as [NoteTheme, (typeof THEME_CONFIG)[NoteTheme]][]).map(([key, config]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTheme(key)}
                className="relative rounded-xl p-3.5 text-left transition-all group"
                style={{
                  background: theme === key ? 'var(--accent-soft)' : 'var(--bg-hover)',
                  border: theme === key ? '2px solid var(--accent-text)' : '1px solid var(--divider)',
                  transform: theme === key ? 'scale(1.02)' : 'scale(1)',
                }}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-sm" style={{ color: 'var(--text-strong)' }}>{config.label}</span>
                </div>
                <p className="text-[11px] font-medium" style={{ color: 'var(--text-label)' }}>{config.description}</p>
                {theme === key && (
                  <motion.div
                    layoutId="theme-check"
                    className="absolute bottom-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--accent-from)' }}
                  >
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--divider)' }} />

        <div>
          <label className="block text-base mb-3" style={{ color: 'var(--text-primary)', fontFamily: "'Pacifico', cursive" }}>
            When should this note unlock?
          </label>
          <div className="flex gap-2 mb-4">
            {(['countdown', 'datetime'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setUnlockMode(mode)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: unlockMode === mode ? 'var(--accent-soft)' : 'var(--bg-hover)',
                  color: unlockMode === mode ? 'var(--accent-text)' : 'var(--text-muted)',
                  border: unlockMode === mode ? '1px solid var(--accent-soft-border)' : '1px solid var(--divider)',
                }}
              >
                {mode === 'countdown' ? 'Countdown' : 'Specific Date/Time'}
              </button>
            ))}
          </div>
          {unlockMode === 'countdown' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>Days</label>
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={countdownDays}
                  onChange={(e) => setCountdownDays(parseInt(e.target.value, 10) || 0)}
                  className="input-field"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>Hours</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={countdownHours}
                  onChange={(e) => setCountdownHours(parseInt(e.target.value, 10) || 0)}
                  className="input-field"
                  disabled={loading}
                />
              </div>
            </div>
          ) : (
            <div>
              <input
                type="datetime-local"
                value={unlockDateTime}
                onChange={(e) => setUnlockDateTime(e.target.value)}
                className="input-field"
                disabled={loading}
              />
              <p className="text-xs mt-2" style={{ color: 'var(--text-faint)' }}>Timezone: {timezone}</p>
            </div>
          )}
        </div>

        {error && <InlineNotice tone="error" message={error} />}

        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="btn-primary w-full text-lg py-3.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none"
          style={{ fontFamily: "'Pacifico', cursive" }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2" style={{ fontFamily: "'Nunito', sans-serif" }}>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Scheduling your note...
            </span>
          ) : 'Create Scheduled Note'}
        </button>
      </motion.form>
      <AuthDialog isOpen={authDialogOpen} onClose={() => setAuthDialogOpen(false)} />
    </>
  );
}
