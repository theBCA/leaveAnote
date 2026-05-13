import { Link } from 'react-router-dom';

interface PremiumUpsellCardProps {
  compact?: boolean;
}

export default function PremiumUpsellCard({ compact = false }: PremiumUpsellCardProps) {
  return (
    <div
      className={compact ? 'rounded-3xl p-4' : 'rounded-3xl p-5'}
      style={{
        background: 'linear-gradient(135deg, rgba(124,58,237,0.10), rgba(236,72,153,0.12))',
        border: '1px solid rgba(124,58,237,0.20)',
        boxShadow: '0 18px 45px rgba(124,58,237,0.12)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest text-white" style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}>
          Premium
        </span>
        <span className="text-xs font-semibold" style={{ color: 'var(--accent-text)' }}>
          AI writing assistant
        </span>
      </div>
      <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
        Luna AI is part of LeaveANote Premium
      </h3>
      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
        Upgrade to unlock AI-assisted message writing. Billing starts from the Premium page after you sign in, and entitlements are verified server-side.
      </p>
      <div className="flex flex-wrap gap-2 text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
        <span className="px-2.5 py-1 rounded-full" style={{ background: 'var(--bg-hover)', border: '1px solid var(--divider)' }}>AI message drafts</span>
        <span className="px-2.5 py-1 rounded-full" style={{ background: 'var(--bg-hover)', border: '1px solid var(--divider)' }}>Server-side premium checks</span>
        <span className="px-2.5 py-1 rounded-full" style={{ background: 'var(--bg-hover)', border: '1px solid var(--divider)' }}>No browser API keys</span>
      </div>
      <Link to="/pricing" className="btn-primary inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold">
        View Premium Plans
      </Link>
    </div>
  );
}
