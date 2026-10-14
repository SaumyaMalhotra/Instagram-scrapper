import React, { useState } from 'react';
import { Mail, Clock, ShieldCheck, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { useDocumentHead } from '../../hooks/useDocumentHead.js';
import { SITE_CONFIG, SEO_PAGES } from '../../data/seoData.js';

export default function ContactPage({ onNavigate }) {
  const [formState, setFormState] = useState({ name: '', email: '', subject: 'Support Request', message: '' });
  const [submitted, setSubmitted] = useState(false);

  useDocumentHead({
    title: SEO_PAGES.contact.title,
    description: SEO_PAGES.contact.description,
    canonical: SEO_PAGES.contact.canonical,
    pageKey: 'contact'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formState.email || !formState.message) {
      alert('Please fill in your email and message.');
      return;
    }
    setSubmitted(true);
  };

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
            Contact
          </li>
        </ol>
      </nav>

      <header style={{ marginBottom: '32px' }}>
        <h1
          style={{
            fontSize: 'clamp(2rem, 4vw, 2.7rem)',
            fontWeight: 800,
            lineHeight: 1.18,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
            marginBottom: '12px'
          }}
        >
          Contact Support & Inquiries
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '640px' }}>
          Have questions about your subscription, public profile audits, or technical questions? Our team responds within 24 business hours.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        {/* Contact Info Card */}
        <div
          style={{
            padding: '24px',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <Mail size={20} style={{ color: 'var(--accent-pink)', marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Email Inquiries
              </div>
              <a
                href={`mailto:${SITE_CONFIG.supportEmail}`}
                style={{ fontSize: '0.84rem', color: 'var(--accent-pink)', textDecoration: 'none' }}
              >
                {SITE_CONFIG.supportEmail}
              </a>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Account billing, quota limits, and technical questions.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <Clock size={20} style={{ color: '#3b82f6', marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Support Hours
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                Monday – Friday: 9:00 AM – 6:00 PM IST
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Weekend inquiries are addressed the next business morning.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <ShieldCheck size={20} style={{ color: 'var(--accent-green)', marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Payment & Billing
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                Processed securely via Razorpay in INR.
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div
          style={{
            padding: '24px',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <CheckCircle2 size={40} style={{ color: 'var(--accent-green)', margin: '0 auto 12px auto' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Message Sent Successfully
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Thank you for contacting us. A support representative will respond to <strong>{formState.email}</strong> shortly.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setFormState({ name: '', email: '', subject: 'Support Request', message: '' });
                }}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem' }}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Your Name
                </label>
                <input
                  type="text"
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  placeholder="e.g., Alex Johnson"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Your Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formState.email}
                  onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                  placeholder="alex@company.com"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Message *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formState.message}
                  onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                  placeholder="Please describe your question or issue in detail..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ fontSize: '0.85rem', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Send size={14} />
                <span>Submit Inquiry</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Legal & Platform Disclaimer */}
      <footer style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
        <p>
          <strong>Independent Platform Notice:</strong> InstaScrape Pro is an independent web application engineered for public Instagram post inspection and profile presentation analysis. InstaScrape Pro is not sponsored, endorsed, or affiliated with Instagram, Meta Platforms, Inc., or any of their subsidiaries. All product names, logos, and brands are property of their respective owners.
        </p>
      </footer>
    </div>
  );
}
