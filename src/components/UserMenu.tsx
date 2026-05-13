import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import AuthDialog from './AuthDialog';

export default function UserMenu() {
  const { user, signOutUser, authBusy, isPremium, premiumPending, premiumStatusLabel } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!user) {
    return (
      <>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="text-sm font-semibold px-3 py-1.5 rounded-full transition-colors"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'inherit',
          }}
        >
          Sign in
        </button>
        <AuthDialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)} />
      </>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <Link
          to="/pricing"
          className="hidden sm:inline text-xs font-semibold px-3 py-1.5 rounded-full"
          style={{
            background: isPremium ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.08)',
            border: isPremium ? '1px solid rgba(16,185,129,0.35)' : '1px solid rgba(255,255,255,0.15)',
            color: 'inherit',
          }}
        >
          {premiumPending ? 'Pending billing' : premiumStatusLabel}
        </Link>
        <div className="hidden md:block text-right leading-tight">
          <p className="text-xs font-semibold">{user.email}</p>
          <p className="text-[11px]" style={{ opacity: 0.8 }}>{isPremium ? 'Premium account' : 'Free account'}</p>
        </div>
        <button
          type="button"
          onClick={() => void signOutUser()}
          disabled={authBusy}
          className="text-sm font-semibold px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'inherit',
          }}
        >
          Sign out
        </button>
      </div>
      <AuthDialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  );
}
