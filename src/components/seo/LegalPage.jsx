import React from 'react';
import { ShieldCheck, FileText, Lock } from 'lucide-react';
import { useDocumentHead } from '../../hooks/useDocumentHead.js';
import { SITE_CONFIG, SEO_PAGES } from '../../data/seoData.js';

export default function LegalPage({ tab = 'terms', onNavigate }) {
  const isTerms = tab === 'terms';
  const pageConfig = isTerms ? SEO_PAGES.terms : SEO_PAGES.privacy;

  useDocumentHead({
    title: pageConfig.title,
    description: pageConfig.description,
    canonical: pageConfig.canonical,
    pageKey: isTerms ? 'terms' : 'privacy'
  });

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '16px 0 48px 0' }}>
      {/* 1. Breadcrumb */}
      <nav aria-label="Breadcrumb" style={{ marginBottom: '20px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <ol style={{ listStyle: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: 0, margin: 0 }}>
          <li>
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/');
              }}
              style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
            >
              Home
            </a>
          </li>
          <li aria-hidden="true" style={{ color: 'var(--border-subtle)' }}>/</li>
          <li aria-current="page" style={{ color: 'var(--accent-pink)', fontWeight: 600 }}>
            {isTerms ? 'Terms of Service' : 'Privacy Policy'}
          </li>
        </ol>
      </nav>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        <button
          type="button"
          onClick={() => onNavigate('/terms')}
          className={`chip ${isTerms ? 'chip-active' : ''}`}
          style={{ cursor: 'pointer', fontSize: '0.82rem', padding: '6px 16px' }}
        >
          Terms of Service
        </button>
        <button
          type="button"
          onClick={() => onNavigate('/privacy')}
          className={`chip ${!isTerms ? 'chip-active' : ''}`}
          style={{ cursor: 'pointer', fontSize: '0.82rem', padding: '6px 16px' }}
        >
          Privacy Policy
        </button>
      </div>

      <header style={{ marginBottom: '28px' }}>
        <h1
          style={{
            fontSize: 'clamp(2rem, 4vw, 2.6rem)',
            fontWeight: 800,
            lineHeight: 1.2,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
            marginBottom: '10px'
          }}
        >
          {isTerms ? 'Terms of Service' : 'Privacy Policy'}
        </h1>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Last Updated: October 14, 2026 • Effective Date: January 1, 2026
        </p>
      </header>

      <div
        className="legal-body"
        style={{
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          padding: '32px',
          fontSize: '0.88rem',
          lineHeight: 1.8,
          color: 'var(--text-secondary)'
        }}
      >
        {isTerms ? (
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
              1. Acceptance of Terms
            </h2>
            <p style={{ marginBottom: '18px' }}>
              By creating an account, browsing this site, or accessing any service provided by InstaScrape Pro (&quot;the Service&quot;), you acknowledge that you have read, understood, and agreed to be legally bound by these Terms of Service.
            </p>

            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
              2. Permitted Use & Public Information
            </h2>
            <p style={{ marginBottom: '18px' }}>
              InstaScrape Pro is designed strictly to facilitate research, marketing analysis, and presentation auditing of <strong>publicly accessible</strong> Instagram content. You agree never to use the Service to stalk, harass, defame, or infringe upon the intellectual property or privacy rights of any individual or entity.
            </p>

            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
              3. Protection of Private Accounts
            </h2>
            <p style={{ marginBottom: '18px' }}>
              The Service strictly respects Instagram account privacy settings. Any attempt to exploit, bypass, or circumvent private profile restrictions is strictly prohibited. The Service does not collect, decrypt, or display private posts, stories, direct messages, or follower lists of private accounts.
            </p>

            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
              4. Subscription & Billing Terms
            </h2>
            <p style={{ marginBottom: '18px' }}>
              InstaScrape Pro offers subscription tiers billed in Indian Rupees (INR) via Razorpay. Free accounts receive limited daily searches and trial analyses. Paid subscriptions automatically renew according to the chosen billing cycle unless canceled prior to the renewal date via your Account settings.
            </p>

            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
              5. Disclaimer of Warranties
            </h2>
            <p style={{ marginBottom: '18px' }}>
              The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind. InstaScrape Pro does not warrant that data will be uninterrupted, error-free, or identical to future platform modifications by Meta Platforms, Inc.
            </p>
          </div>
        ) : (
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
              1. Information We Collect
            </h2>
            <p style={{ marginBottom: '18px' }}>
              We collect the minimum information necessary to provide and secure our service:
              <br />
              • <strong>Account Details:</strong> Email address and encrypted password credentials (managed securely via Firebase Authentication).
              <br />
              • <strong>Billing Information:</strong> Payment transactions are handled directly by Razorpay; we never store your credit card or CVV details on our servers.
              <br />
              • <strong>Search Logs:</strong> Search history is maintained in your private account history for your convenience and can be cleared at any time.
            </p>

            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
              2. How Public Profile Data is Handled
            </h2>
            <p style={{ marginBottom: '18px' }}>
              When you submit a public Instagram username for auditing or content analysis, public metadata is retrieved on demand via Apify and processed by Gemini AI. We do not sell, rent, or trade this data to third parties. Private account data is never scraped or collected.
            </p>

            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
              3. Cookies and Security
            </h2>
            <p style={{ marginBottom: '18px' }}>
              We use standard session cookies and browser local storage solely to keep you signed in, remember your light/dark theme preference, and protect our APIs against brute-force abuse via Google reCAPTCHA.
            </p>

            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
              4. Data Deletion Rights
            </h2>
            <p style={{ marginBottom: '18px' }}>
              You may delete your account and associated search history at any time through the Account dashboard, which permanently deletes all corresponding records from our active databases.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
