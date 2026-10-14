import React, { useState, useMemo } from 'react';
import { BookOpen, Search, ArrowRight, Sparkles, SlidersHorizontal, Calendar, User } from 'lucide-react';
import { useDocumentHead } from '../../hooks/useDocumentHead.js';
import { ARTICLES, SEO_PAGES } from '../../data/seoData.js';

export default function ResourcesHub({ onNavigate, onLaunchTool }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useDocumentHead({
    title: SEO_PAGES.resources.title,
    description: SEO_PAGES.resources.description,
    canonical: SEO_PAGES.resources.canonical,
    pageKey: 'resources'
  });

  const categories = useMemo(() => {
    const cats = new Set(ARTICLES.map((a) => a.category));
    return ['All', ...Array.from(cats)];
  }, []);

  const filteredArticles = useMemo(() => {
    return ARTICLES.filter((art) => {
      const matchesCat = selectedCategory === 'All' || art.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        art.title.toLowerCase().includes(q) ||
        art.description.toLowerCase().includes(q) ||
        art.category.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '16px 0 48px 0' }}>
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
            Resources
          </li>
        </ol>
      </nav>

      {/* 2. Header */}
      <header style={{ marginBottom: '32px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: 'var(--radius-full)', background: 'rgba(225, 48, 108, 0.1)', border: '1px solid rgba(225, 48, 108, 0.3)', color: 'var(--accent-pink)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
          <BookOpen size={13} />
          <span>Research & Guides</span>
        </div>

        <h1
          style={{
            fontSize: 'clamp(2rem, 4.5vw, 2.8rem)',
            fontWeight: 800,
            lineHeight: 1.18,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
            marginBottom: '14px'
          }}
        >
          Instagram Profile Research & Strategy Guides
        </h1>

        <p
          style={{
            fontSize: '1.05rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            maxWidth: '720px'
          }}
        >
          Actionable frameworks, checklists, and data-backed research on bio optimization, profile audits, and public engagement benchmarks.
        </p>
      </header>

      {/* 3. Filter & Search Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '28px',
          paddingBottom: '20px',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        {/* Category Chips */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`chip ${selectedCategory === cat ? 'chip-active' : ''}`}
              style={{ cursor: 'pointer', fontSize: '0.8rem', padding: '6px 14px' }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: '220px', flex: '1', maxWidth: '300px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guides..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              fontSize: '0.82rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
          />
        </div>
      </div>

      {/* 4. Articles Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '44px' }}>
        {filteredArticles.map((art) => (
          <article
            key={art.slug}
            style={{
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'border-color var(--transition-fast)'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-active)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '12px' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--accent-pink)',
                    letterSpacing: '0.04em'
                  }}
                >
                  {art.category}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {art.readingTime}
                </span>
              </div>

              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.35, color: 'var(--text-primary)', marginBottom: '10px' }}>
                <a
                  href={art.path}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(art.path);
                  }}
                  style={{ color: 'inherit', textDecoration: 'none' }}
                >
                  {art.title}
                </a>
              </h2>

              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
                {art.description}
              </p>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {art.publishedDate}
              </span>

              <a
                href={art.path}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(art.path);
                }}
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: 'var(--accent-pink)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  textDecoration: 'none'
                }}
              >
                <span>Read Guide</span>
                <ArrowRight size={13} />
              </a>
            </div>
          </article>
        ))}
      </div>

      {filteredArticles.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
          <p>No guides match your search criteria. Try a different keyword or category.</p>
        </div>
      )}

      {/* 5. Tool Promotion Banner */}
      <aside
        style={{
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(135deg, rgba(225, 48, 108, 0.12), rgba(240, 148, 51, 0.08))',
          border: '1px solid rgba(225, 48, 108, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          flexWrap: 'wrap'
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Put These Frameworks Into Action
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '580px' }}>
            Analyze any public profile or run an automated bio presentation audit using InstaScrape Pro's AI-assisted tools.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onLaunchTool && onLaunchTool('analyzer')}
          className="btn btn-primary"
          style={{ fontSize: '0.85rem', padding: '9px 18px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <Sparkles size={14} />
          <span>Launch Profile Analyzer</span>
        </button>
      </aside>
    </div>
  );
}
