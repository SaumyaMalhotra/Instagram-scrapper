import React, { useState } from 'react';
import {
  User,
  Shield,
  KeyRound,
  Trash2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { deleteAccount } from '../services/api.js';

export default function AccountPage({
  user,
  plan,
  subscription,
  onChangePassword,
  onOpenUpgrade,
  onAccountDeleted
}) {
  // Change Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  // Delete Account modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const isPaid = plan === 'paid';

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwdMsg('');
    setPwdError('');
    setPwdLoading(true);
    try {
      await onChangePassword(oldPassword, newPassword);
      setPwdMsg('Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setPwdError(err.message || 'Could not update password.');
    } finally {
      setPwdLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await deleteAccount();
      if (onAccountDeleted) onAccountDeleted();
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete account.');
      setDeleteLoading(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return 'N/A';
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return iso;
    }
  };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', padding: '16px 0' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
          Account & Subscription
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
          Manage your subscription, password, and profile.
        </p>
      </div>

      {/* Plan & Subscription Card */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: isPaid ? 'rgba(225, 48, 108, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isPaid ? 'var(--accent-pink)' : 'var(--text-muted)'
              }}
            >
              <Shield size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                  Plan: <span style={{ textTransform: 'capitalize', color: isPaid ? 'var(--accent-pink)' : 'var(--text-secondary)' }}>{isPaid ? 'Pro' : 'Free'}</span>
                </h3>
                {isPaid && (
                  <span className="chip chip-active" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                    Active
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {user?.email}
              </p>
            </div>
          </div>

          {!isPaid ? (
            <button
              type="button"
              onClick={onOpenUpgrade}
              className="btn btn-primary"
              style={{ fontSize: '0.825rem', padding: '8px 16px' }}
            >
              <ArrowRight size={15} /> Upgrade to Pro
            </button>
          ) : (
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-green)', fontWeight: 600 }}>
              20 searches / day • Full Photos & Videos
            </span>
          )}
        </div>

        {/* Subscription details */}
        {isPaid && subscription && (
          <div
            style={{
              background: 'var(--bg-surface-elevated)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              marginTop: '16px',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Plan Interval</span>
                <strong style={{ fontSize: '0.9rem', textTransform: 'capitalize' }}>{subscription.plan || 'Active'}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Next Renewal / Period End</span>
                <strong style={{ fontSize: '0.9rem' }}>{formatDate(subscription.currentPeriodEnd)}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Payment Provider</span>
                <strong style={{ fontSize: '0.9rem' }}>Razorpay Subscriptions</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Change Password Card */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <KeyRound size={18} style={{ color: 'var(--accent-pink)' }} /> Change Password
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '18px' }}>
          Must be at least 8 characters long.
        </p>

        {pwdMsg && (
          <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-green)', fontSize: '0.8rem', marginBottom: '14px' }}>
            {pwdMsg}
          </div>
        )}

        {pwdError && (
          <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', fontSize: '0.8rem', marginBottom: '14px' }}>
            {pwdError}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px' }}>Current Password</label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
                style={{ fontSize: '0.85rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px' }}>New Password (min 8 chars)</label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
                style={{ fontSize: '0.85rem' }}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={pwdLoading}
            className="btn btn-secondary"
            style={{ fontSize: '0.825rem', padding: '8px 18px' }}
          >
            {pwdLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Danger Zone: Delete Account */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          background: 'rgba(239, 68, 68, 0.03)'
        }}
      >
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f87171', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={18} /> Danger Zone: Delete Account
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '16px' }}>
          Deleting your account will immediately cancel any active subscription, erase all stored scraper runs and dataset history, and remove your authentication profile. This action cannot be undone.
        </p>

        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="btn btn-danger"
          style={{ fontSize: '0.85rem', padding: '8px 18px' }}
        >
          <Trash2 size={16} /> Delete My Account
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          role="dialog"
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '440px',
              padding: '28px',
              background: 'var(--bg-surface)',
              border: '1px solid rgba(239, 68, 68, 0.5)'
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f87171', marginBottom: '8px' }}>
              Confirm Account Deletion
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
              Are you absolutely sure? All saved searches, post records, and your Razorpay subscription will be cancelled permanently.
            </p>

            {deleteError && (
              <p style={{ color: '#f87171', fontSize: '0.8rem', marginBottom: '14px' }}>
                {deleteError}
              </p>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleDeleteAccount}
                className="btn btn-danger"
                style={{ fontSize: '0.85rem' }}
              >
                {deleteLoading ? 'Deleting...' : 'Yes, Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
