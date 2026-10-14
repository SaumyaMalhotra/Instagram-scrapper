import React from 'react';
import {
  Search,
  BarChart3,
  Download,
  EyeOff,
  Shield,
  ArrowRight
} from 'lucide-react';

export default function LandingHero({ onOpenAuth, onOpenDetectiveBriefing }) {
  const highlights = [
    { label: 'Multi-Account Search', detail: 'Inspect up to 10 profiles simultaneously' },
    { label: 'Presentation Audit', detail: 'Objective profile scoring via Gemini' },
    { label: 'Structured Export', detail: 'Export clean datasets in CSV and JSON' }
  ];

  return (
    <div
      style={{
        maxWidth: '880px',
        margin: '12px auto 32px auto',
        padding: '24px 0',
        borderBottom: '1px solid var(--border-subtle)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)'
          }}
        >
          Instagram Data Platform
        </span>
        <span style={{ color: 'var(--border-subtle)' }}>•</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          Public & Private Account Intelligence
        </span>

        {onOpenDetectiveBriefing && (
          <button
            type="button"
            onClick={onOpenDetectiveBriefing}
            style={{
              marginLeft: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <EyeOff size={13} style={{ color: 'var(--accent-pink)' }} />
            <span>Undercover Mode Guide</span>
            <ArrowRight size={12} />
          </button>
        )}
      </div>

      <h1
        style={{
          fontSize: 'clamp(1.9rem, 4vw, 2.7rem)',
          fontWeight: 800,
          lineHeight: 1.18,
          letterSpacing: '-0.035em',
          marginBottom: '14px',
          color: 'var(--text-primary)'
        }}
      >
        Search, inspect, and analyze Instagram content with clarity.
      </h1>

      <p
        style={{
          fontSize: '0.98rem',
          color: 'var(--text-secondary)',
          maxWidth: '640px',
          lineHeight: 1.6,
          margin: '0 0 24px 0'
        }}
      >
        Extract post captions, view metrics, and run presentation audits without algorithmic tracking or login requirements.
      </p>

      {/* Feature Specification Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px'
        }}
      >
        {highlights.map((h, idx) => (
          <div
            key={idx}
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {h.label}
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {h.detail}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
