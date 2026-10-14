import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import {
  registerWithEmail,
  loginWithEmail,
  resetPassword,
  resendVerificationEmail
} from '../services/firebase.js';
import { checkRegisterEmail } from '../services/api.js';

export default function AuthModal({
  isOpen,
  onClose,
  initialView = 'signin', // 'signin' | 'signup' | 'forgot' | 'verify'
  onSuccess
}) {
  const [view, setView] = useState(initialView);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (view === 'signup') {
        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters long.');
        }
        // Pre-validate email for disposable domain blocking & IP registration limit
        await checkRegisterEmail(email);
        await registerWithEmail(email, password);
        setView('verify');
        setMessage('Registration successful! Please verify your email.');
      } else if (view === 'signin') {
        await loginWithEmail(email, password);
        if (onSuccess) onSuccess();
        onClose();
      } else if (view === 'forgot') {
        await resetPassword(email);
        setMessage(`Password reset email sent to ${email}. Check your inbox.`);
      }
    } catch (err) {
      // Map Firebase auth errors to human-friendly copy
      let msg = err.message || 'Authentication error';
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password') || msg.includes('auth/user-not-found')) {
        msg = 'Invalid email or password.';
      } else if (msg.includes('auth/email-already-in-use')) {
        msg = 'An account with this email already exists. Please sign in.';
      } else if (msg.includes('auth/weak-password')) {
        msg = 'Password is too weak. Minimum 8 characters required.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError('');
    try {
      await resendVerificationEmail();
      setMessage('Verification link re-sent! Please check your inbox and spam folder.');
    } catch (err) {
      setError(err.message || 'Could not resend email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '28px',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-active)',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              {view === 'signin' && 'Sign In to InstaScrape'}
              {view === 'signup' && 'Create Your Account'}
              {view === 'forgot' && 'Reset Password'}
              {view === 'verify' && 'Check Your Inbox'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {view === 'signin' && 'Access your scraper runs and subscription'}
              {view === 'signup' && 'Sign up with email and password to start scraping'}
              {view === 'forgot' && 'We will send a password reset link to your email'}
              {view === 'verify' && 'Verify your email address to enable scraping'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: '6px', borderRadius: '50%' }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Verification Check Screen */}
        {view === 'verify' ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(225, 48, 108, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                color: 'var(--accent-pink)'
              }}
            >
              <Mail size={28} />
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '16px', lineHeight: 1.5 }}>
              A verification link was sent to <strong>{email || 'your email'}</strong>. Please click the link to activate your account.
            </p>
            {message && (
              <p style={{ color: 'var(--accent-green)', fontSize: '0.8rem', marginBottom: '16px' }}>
                {message}
              </p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="btn btn-secondary"
                style={{ width: '100%', fontSize: '0.85rem' }}
              >
                <RefreshCw size={14} /> Resend Verification Email
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onSuccess) onSuccess();
                  onClose();
                }}
                className="btn btn-primary"
                style={{ width: '100%', fontSize: '0.85rem' }}
              >
                I Have Verified My Email
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px'
                }}
              >
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: 'var(--accent-green)',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px'
                }}
              >
                <CheckCircle2 size={15} />
                <span>{message}</span>
              </div>
            )}

            {/* Email Field */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="input-field"
                  style={{ paddingLeft: '38px', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            {/* Password Field (only for signin and signup) */}
            {view !== 'forgot' && (
              <div style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Password {view === 'signup' && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>(min 8 chars)</span>}
                  </label>
                  {view === 'signin' && (
                    <button
                      type="button"
                      onClick={() => setView('forgot')}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-pink)', fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={16}
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                  />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field"
                    style={{ paddingLeft: '38px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '0.9rem', marginBottom: '16px' }}
            >
              {loading ? 'Processing...' : (
                <>
                  {view === 'signin' && 'Sign In'}
                  {view === 'signup' && 'Create Account'}
                  {view === 'forgot' && 'Send Reset Email'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {/* View Switchers */}
            <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {view === 'signin' ? (
                <span>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setView('signup'); setError(''); setMessage(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-pink)', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Sign Up
                  </button>
                </span>
              ) : (
                <span>
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => { setView('signin'); setError(''); setMessage(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-pink)', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Sign In
                  </button>
                </span>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
