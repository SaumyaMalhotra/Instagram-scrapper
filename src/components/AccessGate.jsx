import React, { useState } from 'react';
import { Lock, KeyRound, Check, X, ShieldAlert } from 'lucide-react';
import { setSavedAccessPassword, clearSavedAccessPassword } from '../services/api.js';

export default function AccessGate({ isOpen, onClose, onSuccess, currentPassword }) {
  const [passwordInput, setPasswordInput] = useState(currentPassword || '');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = passwordInput.trim();
    if (!clean) {
      setError('Please enter the access password.');
      return;
    }
    setError('');
    setSavedAccessPassword(clean);
    onSuccess(clean);
    onClose();
  };

  const handleClear = () => {
    clearSavedAccessPassword();
    setPasswordInput('');
    onSuccess('');
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="access-gate-title"
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '28px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-active)',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(225, 48, 108, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-pink)'
              }}
            >
              <KeyRound size={20} />
            </div>
            <h2 id="access-gate-title" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
              Access Authorization
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: '6px', borderRadius: '50%' }}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '20px', lineHeight: 1.5 }}>
          This Instagram Scraper deployment is protected by an instance access password to prevent unauthorized server compute usage.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="access-password-input"
              style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}
            >
              Instance Access Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="access-password-input"
                type="password"
                className="input-field"
                placeholder="Enter password..."
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setError('');
                }}
                autoFocus
              />
            </div>
            {error && (
              <p style={{ color: 'var(--accent-red)', fontSize: '0.8rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldAlert size={14} /> {error}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
            {currentPassword && (
              <button
                type="button"
                onClick={handleClear}
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem' }}
              >
                Clear Saved
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              style={{ fontSize: '0.85rem' }}
            >
              <Check size={16} /> Unlock Scraper
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
