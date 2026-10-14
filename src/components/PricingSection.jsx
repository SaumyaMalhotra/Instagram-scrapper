import React from 'react';
import { Check, ArrowRight, Minus } from 'lucide-react';

export default function PricingSection({ onSelectPlan, currentTier = 'trial', isPaid = false }) {
  const effectiveTier = isPaid ? currentTier : 'trial';

  const plans = [
    {
      id: 'weekly',
      name: 'Weekly Pass',
      price: '₹199',
      period: 'per week',
      desc: 'Ideal for quick research or short projects',
      features: [
        'Full photo previews & video links',
        '2 searches per day',
        '2 profile analyses per day',
        'Filter by photo, video, or carousel',
        'Download data as CSV & JSON'
      ]
    },
    {
      id: 'monthly',
      name: 'Monthly Pro',
      price: '₹499',
      period: 'per month',
      desc: 'Most popular for regular creators & brands',
      features: [
        'Everything in Weekly Pass',
        'Full photo previews & video links',
        '5 searches per day',
        '5 profile analyses per day',
        'High-res photo & video viewer',
        'Priority search speeds'
      ]
    },
    {
      id: 'yearly',
      name: 'Annual Elite',
      price: '₹1,299',
      period: 'per year',
      badge: 'Best value',
      isPopular: true,
      desc: 'Full access for an entire year at 75% off',
      features: [
        'Everything in Monthly Pro',
        '365 days of uninterrupted access',
        'Unlimited searches (daily ceiling applies)',
        'Unlimited profile analyses',
        'Best value per search',
        'All future updates included'
      ]
    }
  ];

  const comparisonRows = [
    {
      feature: 'Price',
      trial: 'Free',
      weekly: '₹199 / week',
      monthly: '₹499 / month',
      yearly: '₹1,299 / year'
    },
    {
      feature: 'Instagram Searches',
      trial: '1 search total (lifetime)',
      weekly: '2 searches / day',
      monthly: '5 searches / day',
      yearly: 'Unlimited (server ceiling)'
    },
    {
      feature: 'Profile Analyzer Audits',
      trial: '1 audit total (lifetime)',
      weekly: '2 audits / day',
      monthly: '5 audits / day',
      yearly: 'Unlimited (server ceiling)'
    },
    {
      feature: 'Reset Schedule',
      trial: 'Never resets',
      weekly: 'Daily at 00:00 UTC',
      monthly: 'Daily at 00:00 UTC',
      yearly: 'Daily at 00:00 UTC'
    },
    {
      feature: 'Photo & Video Previews',
      trial: 'Captions & counts only',
      weekly: 'Full photos & videos',
      monthly: 'Full photos & videos',
      yearly: 'Full photos & videos'
    },
    {
      feature: 'CSV & JSON Data Export',
      trial: false,
      weekly: true,
      monthly: true,
      yearly: true
    },
    {
      feature: 'Priority Search Speeds',
      trial: false,
      weekly: false,
      monthly: true,
      yearly: true
    }
  ];

  return (
    <section style={{ margin: '40px 0 24px 0' }}>
      <div style={{ textAlign: 'center', maxWidth: '580px', margin: '0 auto 32px auto' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(225, 48, 108, 0.1)',
            color: 'var(--accent-pink)',
            padding: '4px 12px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.75rem',
            fontWeight: 600,
            marginBottom: '10px'
          }}
        >
          Plans & Pricing
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px' }}>
          Choose your plan
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
          Free trial includes 1 search and 1 profile audit. Choose a plan to unlock recurring daily searches and full media previews.
        </p>
      </div>

      {/* Plan Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '18px',
          marginBottom: '36px'
        }}
      >
        {plans.map((p) => (
          <div
            key={p.id}
            className="surface-card"
            style={{
              padding: '24px',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 'var(--radius-md)',
              border: p.isPopular ? '1px solid var(--accent-pink)' : '1px solid var(--border-subtle)',
              background: 'var(--bg-card)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>{p.name}</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>{p.desc}</p>
              </div>
              {p.badge && (
                <span
                  style={{
                    background: '#e1306c',
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                    flexShrink: 0,
                    lineHeight: 1.4
                  }}
                >
                  {p.badge}
                </span>
              )}
            </div>

            <div style={{ marginBottom: '18px' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                {p.price}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                /{p.period}
              </span>
            </div>

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '9px', flex: 1, marginBottom: '20px' }}>
              {p.features.map((f, idx) => (
                <li key={idx} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={14} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => onSelectPlan && onSelectPlan(p.id)}
              className={`btn ${p.isPopular ? 'btn-primary' : 'btn-secondary'}`}
              style={{ width: '100%', padding: '10px', fontSize: '0.85rem' }}
            >
              Get Started <ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Plan Comparison Table with Trial Row / Highlighted State */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          overflowX: 'auto'
        }}
      >
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Plan Comparison</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Detailed breakdown of search and analysis quotas across tiers.
          </p>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <th style={{ textAlign: 'left', padding: '12px 14px', color: 'var(--text-secondary)', fontWeight: 600 }}>Feature</th>
              <th
                style={{
                  textAlign: 'center',
                  padding: '12px 14px',
                  fontWeight: 700,
                  background: effectiveTier === 'trial' ? 'rgba(225, 48, 108, 0.08)' : 'transparent',
                  borderTopLeftRadius: 'var(--radius-sm)',
                  borderTopRightRadius: 'var(--radius-sm)'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span>Free Trial</span>
                  {effectiveTier === 'trial' && (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        background: 'var(--accent-pink)',
                        color: '#ffffff',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-full)'
                      }}
                    >
                      You are here
                    </span>
                  )}
                </div>
              </th>
              <th
                style={{
                  textAlign: 'center',
                  padding: '12px 14px',
                  fontWeight: 700,
                  background: effectiveTier === 'weekly' ? 'rgba(225, 48, 108, 0.08)' : 'transparent'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span>Weekly Pass</span>
                  {effectiveTier === 'weekly' && (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        background: 'var(--accent-pink)',
                        color: '#ffffff',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-full)'
                      }}
                    >
                      You are here
                    </span>
                  )}
                </div>
              </th>
              <th
                style={{
                  textAlign: 'center',
                  padding: '12px 14px',
                  fontWeight: 700,
                  background: effectiveTier === 'monthly' ? 'rgba(225, 48, 108, 0.08)' : 'transparent'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span>Monthly Pro</span>
                  {effectiveTier === 'monthly' && (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        background: 'var(--accent-pink)',
                        color: '#ffffff',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-full)'
                      }}
                    >
                      You are here
                    </span>
                  )}
                </div>
              </th>
              <th
                style={{
                  textAlign: 'center',
                  padding: '12px 14px',
                  fontWeight: 700,
                  background: effectiveTier === 'yearly' ? 'rgba(225, 48, 108, 0.08)' : 'transparent'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span>Annual Elite</span>
                  {effectiveTier === 'yearly' && (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        background: 'var(--accent-pink)',
                        color: '#ffffff',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-full)'
                      }}
                    >
                      You are here
                    </span>
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row, idx) => (
              <tr
                key={idx}
                style={{
                  borderBottom: idx === comparisonRows.length - 1 ? 'none' : '1px solid var(--border-subtle)',
                  background: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.015)' : 'transparent'
                }}
              >
                <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {row.feature}
                </td>
                <td
                  style={{
                    padding: '10px 14px',
                    textAlign: 'center',
                    background: effectiveTier === 'trial' ? 'rgba(225, 48, 108, 0.05)' : 'transparent',
                    color: effectiveTier === 'trial' ? 'var(--text-primary)' : 'var(--text-secondary)'
                  }}
                >
                  {typeof row.trial === 'boolean' ? (
                    row.trial ? <Check size={15} style={{ color: 'var(--accent-green)', margin: '0 auto' }} /> : <Minus size={15} style={{ color: 'var(--text-muted)', margin: '0 auto' }} />
                  ) : (
                    row.trial
                  )}
                </td>
                <td
                  style={{
                    padding: '10px 14px',
                    textAlign: 'center',
                    background: effectiveTier === 'weekly' ? 'rgba(225, 48, 108, 0.05)' : 'transparent',
                    color: effectiveTier === 'weekly' ? 'var(--text-primary)' : 'var(--text-secondary)'
                  }}
                >
                  {typeof row.weekly === 'boolean' ? (
                    row.weekly ? <Check size={15} style={{ color: 'var(--accent-green)', margin: '0 auto' }} /> : <Minus size={15} style={{ color: 'var(--text-muted)', margin: '0 auto' }} />
                  ) : (
                    row.weekly
                  )}
                </td>
                <td
                  style={{
                    padding: '10px 14px',
                    textAlign: 'center',
                    background: effectiveTier === 'monthly' ? 'rgba(225, 48, 108, 0.05)' : 'transparent',
                    color: effectiveTier === 'monthly' ? 'var(--text-primary)' : 'var(--text-secondary)'
                  }}
                >
                  {typeof row.monthly === 'boolean' ? (
                    row.monthly ? <Check size={15} style={{ color: 'var(--accent-green)', margin: '0 auto' }} /> : <Minus size={15} style={{ color: 'var(--text-muted)', margin: '0 auto' }} />
                  ) : (
                    row.monthly
                  )}
                </td>
                <td
                  style={{
                    padding: '10px 14px',
                    textAlign: 'center',
                    background: effectiveTier === 'yearly' ? 'rgba(225, 48, 108, 0.05)' : 'transparent',
                    color: effectiveTier === 'yearly' ? 'var(--text-primary)' : 'var(--text-secondary)'
                  }}
                >
                  {typeof row.yearly === 'boolean' ? (
                    row.yearly ? <Check size={15} style={{ color: 'var(--accent-green)', margin: '0 auto' }} /> : <Minus size={15} style={{ color: 'var(--text-muted)', margin: '0 auto' }} />
                  ) : (
                    row.yearly
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
