import React from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { useDocumentHead } from '../../hooks/useDocumentHead.js';
import { SITE_CONFIG, ARTICLES } from '../../data/seoData.js';

export default function ArticlePage({ article, onNavigate, onLaunchTool }) {
  useDocumentHead({
    title: `${article.title} | ${SITE_CONFIG.name}`,
    description: article.description,
    canonical: `${SITE_CONFIG.siteUrl}${article.path}`,
    pageKey: 'article',
    extraSchemaData: { article }
  });

  const otherArticles = ARTICLES.filter((a) => a.slug !== article.slug).slice(0, 2);

  return (
    <article style={{ maxWidth: '820px', margin: '0 auto', padding: '16px 0 48px 0' }}>
      {/* 1. Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" style={{ marginBottom: '20px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <ol style={{ listStyle: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: 0, margin: 0, flexWrap: 'wrap' }}>
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
          <li>
            <a
              href="/resources"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/resources');
              }}
              style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
            >
              Resources
            </a>
          </li>
          <li aria-hidden="true" style={{ color: 'var(--border-subtle)' }}>/</li>
          <li aria-current="page" style={{ color: 'var(--accent-pink)', fontWeight: 600 }}>
            {article.shortTitle || article.title}
          </li>
        </ol>
      </nav>

      {/* 2. Article Header */}
      <header style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
          <span
            style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--accent-pink)',
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(225, 48, 108, 0.1)',
              border: '1px solid rgba(225, 48, 108, 0.25)'
            }}
          >
            {article.category}
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={13} />
            <span>{article.readingTime}</span>
          </span>
          <span style={{ color: 'var(--border-subtle)' }}>•</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={13} />
            <span>Published {article.publishedDate}</span>
          </span>
        </div>

        <h1
          style={{
            fontSize: 'clamp(2rem, 4vw, 2.7rem)',
            fontWeight: 800,
            lineHeight: 1.2,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
            marginBottom: '16px'
          }}
        >
          {article.title}
        </h1>

        <p
          style={{
            fontSize: '1.08rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.65,
            margin: '0 0 20px 0'
          }}
        >
          {article.description}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-pink)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
            IP
          </div>
          <div style={{ fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{article.author}</span>
            <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>• Technical Review & Data Verification</span>
          </div>
        </div>
      </header>

      {/* 3. In-Article Tool Launch Banner */}
      {article.relatedTool && (
        <aside
          style={{
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-active)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            flexWrap: 'wrap',
            marginBottom: '36px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={18} style={{ color: 'var(--accent-pink)', flexShrink: 0 }} />
            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              Put this guide into practice with InstaScrape Pro
            </div>
          </div>
          <button
            type="button"
            onClick={() => onLaunchTool(article.relatedTool.includes('analyzer') ? 'analyzer' : 'scraper')}
            className="btn btn-primary"
            style={{ fontSize: '0.78rem', padding: '6px 14px' }}
          >
            <span>{article.relatedToolLabel}</span>
            <ArrowRight size={13} />
          </button>
        </aside>
      )}

      {/* 4. Article Sections */}
      <div className="article-content" style={{ fontSize: '0.94rem', lineHeight: 1.75, color: 'var(--text-secondary)' }}>
        {article.sections.map((sec, idx) => (
          <section key={idx} style={{ marginBottom: '36px' }}>
            <h2
              style={{
                fontSize: '1.4rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                marginBottom: '14px'
              }}
            >
              {sec.heading}
            </h2>

            <div style={{ whiteSpace: 'pre-line' }}>
              {sec.content}
            </div>
          </section>
        ))}
      </div>

      {/* 5. Author Bio & Editorial Standards */}
      <section
        style={{
          marginTop: '44px',
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: '16px',
          alignItems: 'flex-start'
        }}
      >
        <ShieldCheck size={26} style={{ color: 'var(--accent-green)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Editorial Policy & Research Accuracy
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            All guides and benchmarks published by InstaScrape Pro are based on verified public Instagram data metrics and proven conversion principles. We do not make exaggerated claims or recommend unapproved third-party automation tools that jeopardize Instagram account safety.
          </p>
        </div>
      </section>

      {/* 6. Read Next Articles */}
      <section style={{ marginTop: '48px', borderTop: '1px solid var(--border-subtle)', paddingTop: '28px' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
          Explore More Guides
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {otherArticles.map((other) => (
            <div
              key={other.slug}
              onClick={() => onNavigate(other.path)}
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
                {other.category}
              </div>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                {other.shortTitle || other.title}
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                {other.description.slice(0, 100)}...
              </p>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}
