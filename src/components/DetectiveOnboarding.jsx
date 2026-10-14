import React, { useState } from 'react';
import {
  Ghost,
  EyeOff,
  ShieldCheck,
  Sparkles,
  Search,
  Image as ImageIcon,
  TrendingUp,
  Download,
  ArrowRight,
  ChevronLeft,
  X,
  Lock
} from 'lucide-react';

export default function DetectiveOnboarding({
  isOpen,
  onClose,
  onSelectTarget
}) {
  const [currentStep, setCurrentStep] = useState(0); // 0, 1, 2
  const [targetInput, setTargetInput] = useState('');

  if (!isOpen) return null;

  const steps = [
    {
      badge: 'Undercover Mode',
      title: 'Browse Undetected. Never Leave a Footprint.',
      subtitle:
        'Inspect public accounts without alerting algorithms, triggering notifications, or needing a separate burner account.',
      cards: [
        {
          icon: <EyeOff size={20} style={{ color: 'var(--accent-pink)' }} />,
          title: 'No Account Required',
          desc: 'Search freely without logging into Instagram or connecting credentials.'
        },
        {
          icon: <Ghost size={20} style={{ color: '#a855f7' }} />,
          title: 'Zero Digital Trace',
          desc: 'No profile view receipts, no suggested friend alerts, and zero tracking.'
        },
        {
          icon: <ShieldCheck size={20} style={{ color: 'var(--accent-green)' }} />,
          title: 'Total Discretion',
          desc: 'Searches remain completely private on your device. Zero credential requirements.'
        }
      ]
    },
    {
      badge: 'Analytical Insights',
      title: 'Inspect High-Res Media & Engagement',
      subtitle:
        'Go beyond the standard feed with uncompressed media previews, post frequency timelines, and engagement metrics.',
      cards: [
        {
          icon: <ImageIcon size={20} style={{ color: '#38bdf8' }} />,
          title: 'Original Quality Photos & Reels',
          desc: 'Inspect original images, multi-photo carousels, and view video reels directly.'
        },
        {
          icon: <TrendingUp size={20} style={{ color: 'var(--accent-orange)' }} />,
          title: 'Activity & Cadence',
          desc: 'View exact post timestamps, posting frequency patterns, and engagement levels.'
        },
        {
          icon: <Download size={20} style={{ color: 'var(--accent-green)' }} />,
          title: 'Structured Export',
          desc: 'Export clean CSV or JSON summaries of any profile timeline for your records.'
        }
      ]
    },
    {
      badge: 'Quick Search',
      title: 'Ready to inspect your first profile?',
      subtitle:
        'Enter any public Instagram handle below to start exploring, or select a sample creator.',
      chips: ['selenagomez', 'cristiano', 'natgeo', 'nike', 'zuck']
    }
  ];

  const handleFinish = (username) => {
    const handle = (username || targetInput || '').trim().replace(/^@/, '');
    if (handle && onSelectTarget) {
      onSelectTarget(handle);
    }
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        background: 'rgba(5, 8, 15, 0.82)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        color: '#f8fafc'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '640px',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'linear-gradient(180deg, #131825 0%, #0d111a 100%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          padding: '28px 24px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(225, 48, 108, 0.12)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          color: '#f8fafc'
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '14px',
            marginBottom: '18px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 8px #10b981'
              }}
            />
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#10b981',
                letterSpacing: '0.3px'
              }}
            >
              Ghost Mode Active • 100% Private
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.8rem',
              transition: 'color 150ms ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
          >
            <span>Skip</span>
            <X size={16} />
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '22px' }}>
          {[0, 1, 2].map((stepIdx) => {
            const isActive = currentStep === stepIdx;
            const isCompleted = currentStep > stepIdx;
            return (
              <button
                key={stepIdx}
                type="button"
                onClick={() => setCurrentStep(stepIdx)}
                style={{
                  flex: 1,
                  height: '4px',
                  borderRadius: '2px',
                  background: isActive
                    ? 'linear-gradient(135deg, #e1306c 0%, #fd1d1d 60%, #fcb045 100%)'
                    : isCompleted
                    ? '#10b981'
                    : 'rgba(255, 255, 255, 0.12)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 200ms ease'
                }}
                title={`Go to step ${stepIdx + 1}`}
              />
            );
          })}
        </div>

        {/* Step Header */}
        <div style={{ marginBottom: '22px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '8px',
              background: 'rgba(225, 48, 108, 0.12)',
              border: '1px solid rgba(225, 48, 108, 0.28)',
              color: '#fb7185',
              fontSize: '0.74rem',
              fontWeight: 700,
              letterSpacing: '0.3px',
              marginBottom: '10px'
            }}
          >
            {steps[currentStep].badge}
          </div>

          <h2
            style={{
              fontSize: 'clamp(1.3rem, 3vw, 1.6rem)',
              fontWeight: 800,
              lineHeight: 1.25,
              marginBottom: '8px',
              color: '#ffffff'
            }}
          >
            {steps[currentStep].title}
          </h2>

          <p
            style={{
              fontSize: '0.88rem',
              color: '#94a3b8',
              lineHeight: 1.55,
              maxWidth: '560px'
            }}
          >
            {steps[currentStep].subtitle}
          </p>
        </div>

        {/* Step 1 Cards */}
        {currentStep === 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              marginBottom: '26px'
            }}
          >
            {steps[0].cards.map((c, i) => (
              <div
                key={i}
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.035)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {c.icon}
                </div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                  {c.title}
                </h4>
                <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.45, margin: 0 }}>
                  {c.desc}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Step 2 Cards */}
        {currentStep === 1 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              marginBottom: '26px'
            }}
          >
            {steps[1].cards.map((c, i) => (
              <div
                key={i}
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.035)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {c.icon}
                </div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                  {c.title}
                </h4>
                <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.45, margin: 0 }}>
                  {c.desc}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Step 3 Input & Examples */}
        {currentStep === 2 && (
          <div style={{ marginBottom: '26px' }}>
            <div
              style={{
                padding: '20px',
                borderRadius: '18px',
                background: 'rgba(255, 255, 255, 0.035)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                marginBottom: '16px'
              }}
            >
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#e2e8f0',
                  marginBottom: '8px'
                }}
              >
                Instagram Handle
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#64748b',
                      fontSize: '0.9rem',
                      fontWeight: 600
                    }}
                  >
                    @
                  </span>
                  <input
                    type="text"
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    placeholder="friend, ex, creator, or brand..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleFinish(targetInput);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 28px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      background: 'rgba(10, 14, 22, 0.7)',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleFinish(targetInput)}
                  className="btn btn-primary"
                  style={{
                    padding: '10px 18px',
                    fontSize: '0.85rem',
                    flexShrink: 0
                  }}
                >
                  Inspect Profile <ArrowRight size={15} />
                </button>
              </div>

              {/* Sample Target Chips */}
              <div
                style={{
                  marginTop: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexWrap: 'wrap'
                }}
              >
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Try an example:</span>
                {steps[2].chips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      setTargetInput(chip);
                      handleFinish(chip);
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '9999px',
                      padding: '3px 10px',
                      fontSize: '0.74rem',
                      color: '#cbd5e1',
                      cursor: 'pointer',
                      transition: 'all 150ms ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(225, 48, 108, 0.18)';
                      e.currentTarget.style.color = '#ffffff';
                      e.currentTarget.style.borderColor = 'rgba(225, 48, 108, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                      e.currentTarget.style.color = '#cbd5e1';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                    }}
                  >
                    @{chip}
                  </button>
                ))}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                color: '#34d399',
                fontSize: '0.78rem'
              }}
            >
              <ShieldCheck size={16} style={{ flexShrink: 0 }} />
              <span>
                100% Client-Side Privacy: Accounts are never notified and searches are never linked to your identity.
              </span>
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '16px',
            marginTop: 'auto'
          }}
        >
          {currentStep > 0 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep - 1)}
              style={{
                fontSize: '0.82rem',
                padding: '8px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '10px',
                color: '#cbd5e1',
                cursor: 'pointer'
              }}
            >
              <ChevronLeft size={16} /> Back
            </button>
          ) : (
            <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
              Step {currentStep + 1} of 3
            </span>
          )}

          {currentStep < 2 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep + 1)}
              className="btn btn-primary"
              style={{
                fontSize: '0.85rem',
                padding: '9px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              Next <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleFinish(targetInput)}
              style={{
                fontSize: '0.82rem',
                padding: '9px 18px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                color: '#ffffff',
                cursor: 'pointer'
              }}
            >
              Start Searching
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
