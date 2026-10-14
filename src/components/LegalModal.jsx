import React, { useState } from 'react';
import { X, ShieldCheck, FileText, RefreshCw, AlertCircle } from 'lucide-react';

export default function LegalModal({ isOpen, onClose, initialTab = 'terms' }) {
  const [tab, setTab] = useState(initialTab); // 'terms' | 'privacy' | 'refund'

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        background: 'rgba(0,0,0,0.8)',
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
          maxWidth: '720px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-active)'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setTab('terms')}
              className={`chip ${tab === 'terms' ? 'chip-active' : ''}`}
              style={{ cursor: 'pointer', fontSize: '0.8rem', padding: '6px 14px' }}
            >
              Terms of Service
            </button>
            <button
              type="button"
              onClick={() => setTab('privacy')}
              className={`chip ${tab === 'privacy' ? 'chip-active' : ''}`}
              style={{ cursor: 'pointer', fontSize: '0.8rem', padding: '6px 14px' }}
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => setTab('refund')}
              className={`chip ${tab === 'refund' ? 'chip-active' : ''}`}
              style={{ cursor: 'pointer', fontSize: '0.8rem', padding: '6px 14px' }}
            >
              Refund Policy
            </button>
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

        {/* Scrollable Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, fontSize: '0.85rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          {tab === 'terms' && (
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
                Terms of Service
              </h3>
              <p style={{ marginBottom: '12px' }}>
                <strong>1. Acceptance of Terms:</strong> By creating an account or accessing InstaScrape Pro, you agree to comply with and be bound by these Terms of Service.
              </p>
              <p style={{ marginBottom: '12px' }}>
                <strong>2. Platform Compliance & Third-Party Terms:</strong> Scraping Instagram content may violate Instagram's Terms of Use, Meta Platform Terms, and applicable local privacy and copyright laws. You agree that you are solely and exclusively responsible for your use of this service and for ensuring your data extraction activities comply with all relevant platform policies and regulations.
              </p>
              <p style={{ marginBottom: '12px' }}>
                <strong>3. Service Scope & Tiers:</strong> Free accounts are permitted limited daily text extraction. Paid subscriptions unlock media preview URLs and higher daily request quotas. Subscriptions automatically renew according to the chosen billing cycle (weekly, monthly, or yearly) unless cancelled prior to renewal.
              </p>
              <p style={{ marginBottom: '12px' }}>
                <strong>4. Account Termination:</strong> We reserve the right to suspend accounts engaging in abusive behavior, payment fraud, or automated denial of service.
              </p>
              <p style={{ marginBottom: '12px' }}>
                <strong>5. Profile Analyzer Permitted Use:</strong> The Profile Analyzer feature evaluates profile presentation quality (clarity, call-to-action, readability, contact options) for public and private accounts. You agree to use this tool solely to evaluate profiles you have a legitimate reason to review, such as your own accounts or brands and businesses you evaluate. You agree NOT to use analysis results to target, harass, stalk, or contact individuals, nor to create unauthorized profiling databases.
              </p>
            </div>
          )}

          {tab === 'privacy' && (
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
                Privacy Policy
              </h3>
              <p style={{ marginBottom: '12px' }}>
                <strong>1. Data Collected:</strong> We collect your email address and password hash (handled securely via Google Firebase Authentication), your submitted scrape search queries, run execution dates, extracted post metadata, and submitted profile analysis targets.
              </p>
              <p style={{ marginBottom: '12px' }}>
                <strong>2. Third-Party Sub-Processors:</strong>
                <br />• <strong>Google Firebase:</strong> Authentication, token verification, and Firestore database hosting.
                <br />• <strong>Google Gemini API:</strong> Sub-processor for profile presentation analysis. Server-side queries transmit profile bio text, follower counts, and link presence for scoring. Analysis reports are stored for a maximum of 30 days and automatically expire.
                <br />• <strong>Razorpay:</strong> Payment processing and recurring subscription management. We never store credit card or bank details on our servers.
                <br />• <strong>Cloud Infrastructure:</strong> High-speed headless extractors for public content extraction.
              </p>
              <p style={{ marginBottom: '12px' }}>
                <strong>3. Media Preview URLs:</strong> We only store temporary public CDN URLs. No image or video media bytes are stored on our servers or Cloud Storage.
              </p>
              <p style={{ marginBottom: '12px' }}>
                <strong>4. Data Retention & Deletion:</strong> Profile analyses are retained for 30 days and can be deleted individually by the user at any time. You can permanently delete your entire account and all associated dataset records at any time via the Account Settings page.
              </p>
            </div>
          )}

          {tab === 'refund' && (
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
                Refund Policy
              </h3>
              <p style={{ marginBottom: '12px' }}>
                Because digital server compute and high-speed proxy units are consumed immediately upon running scrapes, our refund terms by plan tier are as follows:
              </p>
              <div style={{ background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '16px' }}>
                <p style={{ marginBottom: '8px' }}>
                  <strong>• Weekly Plan (₹199):</strong> Due to the short 7-day billing duration, weekly passes are strictly non-refundable once activated.
                </p>
                <p style={{ marginBottom: '8px' }}>
                  <strong>• Monthly Plan (₹499):</strong> Eligible for a full refund within <strong>48 hours</strong> of initial purchase if you have executed fewer than 2 total scrapes.
                </p>
                <p>
                  <strong>• Yearly Plan (₹1,299):</strong> Eligible for a refund within <strong>7 days</strong> of the initial annual charge, less a nominal processing and usage deduction.
                </p>
              </div>
              <p>
                To request a refund, contact support with your registered email and Razorpay payment ID. Subscriptions can be cancelled anytime with zero penalty, and your access will continue until the end of your prepaid period.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', textAlign: 'right' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
