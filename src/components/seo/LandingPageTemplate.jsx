import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Search,
  ExternalLink,
  BookOpen,
  Lock,
  Eye,
  Sliders,
  BarChart2,
  FileText
} from 'lucide-react';
import { useDocumentHead } from '../../hooks/useDocumentHead.js';
import { LANDING_FAQS, ARTICLES } from '../../data/seoData.js';

export default function LandingPageTemplate({
  pageKey,
  seoPage,
  onLaunchTool,
  onNavigate
}) {
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Update dynamic head metadata & structured data
  useDocumentHead({
    title: seoPage.title,
    description: seoPage.description,
    canonical: seoPage.canonical,
    pageKey
  });

  const faqs = LANDING_FAQS[pageKey] || [];
  const relatedArticles = ARTICLES.slice(0, 3);

  return (
    <div className="seo-landing-container" style={{ maxWidth: '960px', margin: '0 auto', padding: '16px 0 48px 0' }}>
      {/* 1. Breadcrumb Navigation */}
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
            {seoPage.headline || seoPage.primaryKeyword}
          </li>
        </ol>
      </nav>

      {/* 2. Hero Header */}
      <header style={{ marginBottom: '32px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: 'var(--radius-full)', background: 'rgba(225, 48, 108, 0.1)', border: '1px solid rgba(225, 48, 108, 0.3)', color: 'var(--accent-pink)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
          <Sparkles size={13} />
          <span>Instagram Intelligence Suite</span>
        </div>

        <h1
          style={{
            fontSize: 'clamp(2rem, 4.5vw, 2.9rem)',
            fontWeight: 800,
            lineHeight: 1.18,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
            marginBottom: '16px'
          }}
        >
          {seoPage.headline}
        </h1>

        <p
          style={{
            fontSize: '1.05rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.65,
            maxWidth: '780px',
            marginBottom: '24px'
          }}
        >
          {seoPage.subheadline || seoPage.description}
        </p>

        {/* Primary Launch Action Card */}
        <div
          style={{
            padding: '20px 24px',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-active)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap'
          }}
        >
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Ready to inspect or audit a public profile?
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              No password required • 100% public information • Instant results
            </div>
          </div>
          <button
            type="button"
            onClick={onLaunchTool}
            className="btn btn-primary"
            style={{ fontSize: '0.88rem', padding: '10px 22px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <span>Launch Tool Now</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </header>

      {/* 3. How It Works Section */}
      <section style={{ marginBottom: '44px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '18px', letterSpacing: '-0.02em' }}>
          How the {seoPage.headline} Works
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '20px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.88rem', marginBottom: '12px' }}>
              1
            </div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Enter Any Public Handle
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Provide the public Instagram username or profile URL. Zero password or account login is ever requested.
            </p>
          </div>

          <div style={{ padding: '20px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(225, 48, 108, 0.15)', color: 'var(--accent-pink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.88rem', marginBottom: '12px' }}>
              2
            </div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Analyze Objective Rubrics
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Our platform evaluates profile presentation, bio clarity, call to action, and engagement benchmarks using AI scoring.
            </p>
          </div>

          <div style={{ padding: '20px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.88rem', marginBottom: '12px' }}>
              3
            </div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Actionable Optimization & Export
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Get concrete improvement recommendations, bio rewrite suggestions, and structured CSV/JSON exports.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Trust & Compliance Guarantee Notice */}
      <section
        style={{
          padding: '20px 24px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '44px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <ShieldCheck size={20} style={{ color: 'var(--accent-green)' }} />
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Data Privacy & Compliance Standard
          </h2>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
          InstaScrape Pro operates strictly in compliance with public web intelligence standards. We never claim to bypass private profile settings or reveal unauthorized media. Only public feed posts and public bio metadata are analyzed. We never request your Instagram password or access token.
        </p>
      </section>

      {/* 5. Frequently Asked Questions (FAQ) Section */}
      <section style={{ marginBottom: '44px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', letterSpacing: '-0.02em' }}>
          Frequently Asked Questions
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                style={{
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  overflow: 'hidden'
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    color: 'var(--text-primary)',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  aria-expanded={isOpen}
                >
                  <span>{faq.question}</span>
                  {isOpen ? <ChevronUp size={16} color="var(--accent-pink)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                </button>

                {isOpen && (
                  <div style={{ padding: '0 20px 18px 20px', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.65, borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Related Educational Guides (Internal Linking) */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Related Guides & Research
          </h2>
          <a
            href="/resources"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/resources');
            }}
            style={{ fontSize: '0.8rem', color: 'var(--accent-pink)', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <span>View All Guides</span>
            <ArrowRight size={13} />
          </a>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          {relatedArticles.map((art) => (
            <div
              key={art.slug}
              onClick={() => onNavigate(art.path)}
              style={{
                padding: '18px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                transition: 'border-color var(--transition-fast)'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-active)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
            >
              <div style={{ fontSize: '0.72rem', color: 'var(--accent-pink)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                {art.category}
              </div>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1.4 }}>
                {art.shortTitle || art.title}
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '10px' }}>
                {art.description.slice(0, 110)}...
              </p>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BookOpen size={12} />
                <span>{art.readingTime}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
