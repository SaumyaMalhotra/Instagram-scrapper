import React, { useState } from 'react';
import { AlertTriangle, Mail, RefreshCw } from 'lucide-react';
import { resendVerificationEmail } from '../services/firebase.js';

export default function VerifyEmailBanner({ email, onRefreshUser }) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleResend = async () => {
    setLoading(true);
    setError('');
    try {
      await resendVerificationEmail();
      setSent(true);
    } catch (err) {
      setError(err.message || 'Could not send verification email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: '#12151b',
        borderBottom: '1px solid var(--border-subtle)',
        borderLeft: '3px solid #f59e0b',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ color: '#f59e0b', display: 'flex' }}>
          <AlertTriangle size={17} />
        </div>
        <div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Email verification required to run scrapes and subscribe.
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '6px' }}>
            Check your inbox for <strong>{email}</strong>.
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {sent ? (
          <span style={{ fontSize: '0.78rem', color: 'var(--accent-green)', fontWeight: 600 }}>
            Verification email sent!
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={loading}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
          >
            <Mail size={13} /> {loading ? 'Sending...' : 'Resend Link'}
          </button>
        )}

        <button
          type="button"
          onClick={onRefreshUser}
          className="btn btn-ghost"
          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
          title="Refresh verified status"
        >
          <RefreshCw size={13} /> Check Status
        </button>
      </div>
    </div>
  );
}
