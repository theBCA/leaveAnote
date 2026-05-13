import { useState } from 'react';
import InlineNotice from './InlineNotice';
import { useAuth } from '../context/useAuth';

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthDialog({ isOpen, onClose }: AuthDialogProps) {
  const { signIn, signUp, authBusy, authError, clearAuthError } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  if (!isOpen) return null;

  const resetState = () => {
    setPassword('');
    setLocalError('');
    clearAuthError();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError('');

    if (!email.trim()) {
      setLocalError('Email is required.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      onClose();
      resetState();
    } catch {
      // AuthProvider already stores the user-facing message.
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-3xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', boxShadow: '0 20px 50px var(--bg-card-shadow)' }}>
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {mode === 'signin' ? 'Sign in for Premium' : 'Create your account'}
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Premium billing is tied to a signed-in LeaveANote account so Stripe entitlements can be enforced safely.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              resetState();
              onClose();
            }}
            className="text-sm font-semibold"
            style={{ color: 'var(--text-muted)' }}
          >
            Close
          </button>
        </div>

        <div className="flex gap-2 mb-5">
          {(['signin', 'signup'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setMode(value);
                setLocalError('');
                clearAuthError();
              }}
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{
                background: mode === value ? 'var(--accent-soft)' : 'var(--bg-hover)',
                border: mode === value ? '1px solid var(--accent-soft-border)' : '1px solid var(--divider)',
                color: mode === value ? 'var(--accent-text)' : 'var(--text-secondary)',
              }}
            >
              {value === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="input-field"
              placeholder="you@example.com"
              disabled={authBusy}
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="input-field"
              placeholder="At least 6 characters"
              disabled={authBusy}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          </div>

          {(localError || authError) && (
            <InlineNotice tone="error" message={localError || authError || 'Authentication failed.'} />
          )}

          <button
            type="submit"
            disabled={authBusy}
            className="btn-primary w-full py-3 rounded-xl font-semibold disabled:opacity-50"
          >
            {authBusy ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
