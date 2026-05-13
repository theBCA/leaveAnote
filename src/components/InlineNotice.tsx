interface InlineNoticeProps {
  message: string;
  tone?: 'error' | 'success' | 'info';
}

const toneStyles = {
  error: {
    background: 'var(--error-bg)',
    border: '1px solid var(--error-border)',
    color: 'var(--error-text)',
  },
  success: {
    background: 'var(--success-bg)',
    border: '1px solid var(--success-border)',
    color: 'var(--success-text)',
  },
  info: {
    background: 'var(--bg-hover)',
    border: '1px solid var(--divider)',
    color: 'var(--text-secondary)',
  },
} as const;

export default function InlineNotice({ message, tone = 'info' }: InlineNoticeProps) {
  return (
    <div className="px-4 py-3 rounded-lg text-sm" style={toneStyles[tone]}>
      {message}
    </div>
  );
}
