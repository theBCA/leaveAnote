import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNote } from '../hooks/useNote';
import { useCountdown } from '../hooks/useCountdown';
import { markNoteRead } from '../services/noteService';
import CountdownTimer from '../components/CountdownTimer';
import LoadingSpinner from '../components/LoadingSpinner';
import InlineNotice from '../components/InlineNotice';
import { formatDateTime } from '../utils/helpers';
import { THEME_CONFIG, type NoteTheme } from '../types';
import { exportNotePdf } from '../utils/pdfExport';

const PARTICLE_POSITIONS = [
  { left: '8%', top: '14%' },
  { left: '22%', top: '8%' },
  { left: '34%', top: '18%' },
  { left: '48%', top: '12%' },
  { left: '61%', top: '20%' },
  { left: '74%', top: '10%' },
  { left: '86%', top: '16%' },
];

function ThemeParticles({ theme }: { theme: NoteTheme }) {
  const cfg = THEME_CONFIG[theme];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {PARTICLE_POSITIONS.map((position, index) => (
        <motion.div
          key={`${theme}-${index}`}
          className="absolute text-xs md:text-sm"
          style={{ left: position.left, top: position.top }}
          animate={{ y: [0, -18, 0], opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: 5 + index, repeat: Infinity, ease: 'easeInOut', delay: index * 0.2 }}
        >
          {cfg.particles[index % cfg.particles.length]}
        </motion.div>
      ))}
    </div>
  );
}

function GlowOrbs({ theme }: { theme: NoteTheme }) {
  const cfg = THEME_CONFIG[theme];
  const colors = cfg.isDark
    ? ['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.02)']
    : ['rgba(0,0,0,0.03)', 'rgba(0,0,0,0.02)'];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" style={{ contain: 'strict' }}>
      <div
        className="absolute top-[-10%] left-[5%] w-[250px] h-[250px] rounded-full blur-[80px]"
        style={{ background: colors[0] }}
      />
      <div
        className="absolute bottom-[-5%] right-[0%] w-[200px] h-[200px] rounded-full blur-[60px]"
        style={{ background: colors[1] }}
      />
    </div>
  );
}

function generateCalendarUrl(title: string, date: Date, noteUrl: string): string {
  const start = date.toISOString().replace(/-|:|\.\d{3}/g, '');
  const end = new Date(date.getTime() + 3600000).toISOString().replace(/-|:|\.\d{3}/g, '');
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${start}/${end}&details=${encodeURIComponent(`Your scheduled note is ready to open. ${noteUrl}`)}`;
}

export default function ViewNotePage() {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const { note, loading, error, setNote } = useNote(noteId);
  const [markingRead, setMarkingRead] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const countdown = useCountdown(note?.unlockTime);
  const theme: NoteTheme = note?.theme || 'classic';
  const cfg = THEME_CONFIG[theme];

  useEffect(() => {
    if (!noteId || !note || note.status !== 'revealed' || markingRead) return;

    const activeNoteId = noteId;
    let cancelled = false;

    async function updateReadStatus() {
      setMarkingRead(true);
      try {
        await markNoteRead(activeNoteId);
        if (!cancelled) {
          setNote((current) => current ? { ...current, status: 'read', readAt: new Date() } : current);
        }
      } catch (markError) {
        if (!cancelled) {
          setStatusError(markError instanceof Error ? markError.message : 'Failed to mark note as read.');
        }
      } finally {
        if (!cancelled) {
          setMarkingRead(false);
        }
      }
    }

    void updateReadStatus();

    return () => {
      cancelled = true;
    };
  }, [markingRead, note, noteId, setNote]);

  if (loading) {
    return <LoadingSpinner message="Opening the vault..." />;
  }

  if (error || !note) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-gray-50 to-gray-100">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Note Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'This note does not exist or has been deleted.'}</p>
          <button onClick={() => navigate('/')} className="btn-primary">Create Your Own Note</button>
        </motion.div>
      </div>
    );
  }

  const isUnlocked = note.status === 'revealed' || note.status === 'read';
  const noteUrl = window.location.href;

  return (
    <div className={`min-h-screen transition-colors duration-700 ${cfg.bgClass} relative`}>
      <GlowOrbs theme={theme} />
      {isUnlocked && <ThemeParticles theme={theme} />}

      <div className="relative z-10 min-h-screen py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {statusError && (
            <div className="mb-4">
              <InlineNotice tone="error" message={statusError} />
            </div>
          )}

          <AnimatePresence mode="wait">
            {!isUnlocked ? (
              <motion.div
                key="sealed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
                  <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase ${cfg.badgeColor}`}>
                    Scheduled
                  </span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className={`rounded-3xl p-8 md:p-10 ${cfg.cardClass}`}
                >
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="text-center mb-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${cfg.badgeColor}`}>
                      {cfg.label}
                    </span>
                  </motion.div>

                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-center mb-2">
                    <h1 className={`text-2xl md:text-3xl font-bold ${cfg.isDark ? 'text-white' : 'text-gray-900'}`}>
                      {note.senderName ? `A message from ${note.senderName} is waiting for you` : 'A scheduled note is waiting for you'}
                    </h1>
                  </motion.div>

                  {note.teaser && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-center mt-4 mb-8">
                      <div className={`inline-block px-5 py-2.5 rounded-xl ${cfg.isDark ? 'bg-white/10 text-white/80' : 'bg-gray-100 text-gray-600'}`}>
                        <p className="text-sm italic">"{note.teaser}"</p>
                      </div>
                    </motion.div>
                  )}

                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="my-10">
                    <CountdownTimer countdown={countdown} timezone={note.timezone} theme={theme} />
                  </motion.div>

                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className={`text-center text-sm ${cfg.isDark ? 'text-white/40' : 'text-gray-400'}`}>
                    Unlocks on: <span className="font-semibold">{formatDateTime(note.unlockTime, note.timezone)}</span>
                  </motion.div>

                  {!countdown.isExpired && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="text-center mt-6">
                      <a
                        href={generateCalendarUrl(note.senderName ? `Note from ${note.senderName}` : 'A scheduled note is ready', note.unlockTime, noteUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
                          cfg.isDark ? 'bg-white/10 text-white/70 hover:bg-white/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Add to Calendar
                      </a>
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="revealed"
                initial={{ opacity: 0, scale: 0.8, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-center mb-8">
                  <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className={`text-4xl md:text-5xl font-bold mb-3 ${cfg.isDark ? 'text-white' : 'text-gray-900'}`}
                    style={{ fontFamily: "'Pacifico', cursive" }}
                  >
                    {cfg.revealTitle}
                  </motion.h1>

                  {note.senderName && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className={`text-lg ${cfg.isDark ? 'text-white/60' : 'text-gray-500'}`}>
                      From <span className="font-semibold">{note.senderName}</span>
                    </motion.p>
                  )}
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className={`rounded-3xl p-8 md:p-12 relative overflow-hidden ${cfg.cardClass}`}>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="text-center mb-6">
                    <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase ${cfg.badgeColor}`}>
                      {cfg.label}
                    </span>
                  </motion.div>

                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className={`text-center text-sm mb-8 ${cfg.isDark ? 'text-white/30' : 'text-gray-400'}`}>
                    Created {formatDateTime(note.createdAt)}
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9, duration: 0.6 }}
                    className={`rounded-2xl p-8 md:p-10 mb-8 relative ${cfg.messageBgClass}`}
                    style={{ border: cfg.isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.04)' }}
                  >
                    <p className={`text-lg md:text-xl whitespace-pre-wrap leading-relaxed relative z-[1] ${
                      cfg.isDark ? 'text-white/90' : 'text-gray-800'
                    }`}>
                      {note.message}
                    </p>
                  </motion.div>

                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} className="flex gap-4 justify-center flex-wrap">
                    <button
                      onClick={() => navigate('/', { state: { isReply: true } })}
                      className={`font-semibold px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-white bg-gradient-to-r ${cfg.gradient}`}
                    >
                      Leave a Reply
                    </button>
                    <button
                      onClick={() => navigate('/')}
                      className={`font-semibold px-6 py-3 rounded-xl transition-all hover:-translate-y-0.5 ${
                        cfg.isDark
                          ? 'bg-white/10 text-white/80 border border-white/10 hover:bg-white/15'
                          : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      Create Your Own
                    </button>
                    <button
                      onClick={async () => {
                        setPdfLoading(true);
                        try {
                          await exportNotePdf({
                            message: note.message || '',
                            senderName: note.senderName,
                            theme,
                            revealedAt: note.revealedAt ? formatDateTime(note.revealedAt) : undefined,
                          });
                        } catch (pdfError) {
                          console.error('PDF export failed:', pdfError);
                          setStatusError('Failed to export this note as PDF.');
                        } finally {
                          setPdfLoading(false);
                        }
                      }}
                      disabled={pdfLoading}
                      className={`font-semibold px-6 py-3 rounded-xl transition-all hover:-translate-y-0.5 flex items-center gap-2 ${
                        cfg.isDark
                          ? 'bg-white/10 text-white/80 border border-white/10 hover:bg-white/15'
                          : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {pdfLoading ? 'Saving...' : 'Save as PDF'}
                    </button>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
