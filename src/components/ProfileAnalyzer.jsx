import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Lock,
  BadgeCheck,
  TrendingUp,
  Clock,
  ChevronRight,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { analyzeProfile, fetchAnalyses, deleteAnalysis } from '../services/api.js';

// Sample profile for guests to view immediately
const SAMPLE_ANALYSIS = {
  analysisId: 'sample-preview',
  username: 'creativestudio.co',
  profileSnapshot: {
    fullName: 'Creative Studio Co.',
    biography: 'Design & branding partner for high-growth tech teams.\nCase studies & sprint openings:\nhello@creativestudio.co',
    followersCount: 14200,
    followsCount: 312,
    profilePicUrl: null,
    private: false,
    verified: true,
    hasExternalLink: true
  },
  score: 8,
  breakdown: {
    clarity: 9,
    value_proposition: 8,
    call_to_action: 9,
    readability: 8,
    contact_or_link: 8
  },
  summary:
    'The profile immediately establishes its target niche and core service offering with clear positioning. It provides direct next steps with a dedicated contact address and an external link destination.',
  strengths: [
    'Concise niche definition tailored for high-growth tech teams.',
    'Clear directional call to action pointing to case studies and openings.',
    'Effective line breaks with readable mobile structure.'
  ],
  improvements: [
    {
      title: 'Specify social proof or metric',
      detail: 'Add a brief credibility anchor such as years active, clients served, or awards.',
      example: 'Trusted by 40+ YC teams'
    },
    {
      title: 'Clarify the link destination',
      detail: 'Specify exactly what visitors will find when clicking the bio link.',
      example: 'View latest brand case studies'
    },
    {
      title: 'Sharpen offer proposition',
      detail: 'Highlight the exact turnaround or primary sprint outcome.',
      example: '2-week brand sprints for tech teams'
    }
  ],
  example_bio: 'Design & branding partner for tech founders.\nTrusted by 40+ teams. 2-week sprints.\nSee case studies & openings below',
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()
};

/**
 * Normalizes and validates username or profile URL
 */
function normalizeUsernameInput(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let str = raw.trim();
  if (str.startsWith('@')) str = str.slice(1);

  if (str.includes('/') || str.startsWith('http://') || str.startsWith('https://')) {
    try {
      const url = new URL(str.startsWith('http') ? str : `https://${str}`);
      const segments = url.pathname.split('/').filter(Boolean);
      if (segments.length > 0) {
        str = segments[0];
      }
    } catch {
      // Keep input as is for regex validation
    }
  }
  return str.toLowerCase();
}

function isValidUsername(str) {
  return /^[a-zA-Z0-9._]{1,30}$/.test(str);
}

/**
 * Animated count-up component respecting prefers-reduced-motion
 */
function AnimatedScore({ targetScore }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setCurrent(targetScore);
      return;
    }

    let start = 0;
    const duration = 600; // ms
    const startTime = performance.now();

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const val = Math.round(eased * targetScore);
      setCurrent(val);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    const frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [targetScore]);

  return <span>{current}</span>;
}

export default function ProfileAnalyzer({
  user,
  plan = 'guest',
  isAnalysisLocked = false,
  onOpenUpgrade,
  onOpenAuth
}) {
  const isGuest = plan === 'guest' || !user;

  // Search input state
  const [inputVal, setInputVal] = useState('');
  const [inputError, setInputError] = useState(null);

  // Execution & Progress state
  const [isLoading, setIsLoading] = useState(false);
  const [progressStep, setProgressStep] = useState(0); // 0: idle, 1: fetching, 2: reading, 3: writing
  const [apiError, setApiError] = useState(null);

  // Result & History state
  const [analysisResult, setAnalysisResult] = useState(isGuest ? SAMPLE_ANALYSIS : null);
  const [historyList, setHistoryList] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [imgError, setImgError] = useState(false);

  // Progress timer for restrained 3-step state
  useEffect(() => {
    let timer1, timer2;
    if (isLoading) {
      setProgressStep(1); // Fetching profile
      timer1 = setTimeout(() => setProgressStep(2), 1200); // Reading bio
      timer2 = setTimeout(() => setProgressStep(3), 2800); // Writing report
    } else {
      setProgressStep(0);
    }
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isLoading]);

  // Load user analyses history if authenticated
  useEffect(() => {
    if (!isGuest) {
      loadHistory();
    }
  }, [isGuest]);

  async function loadHistory() {
    try {
      setIsHistoryLoading(true);
      const res = await fetchAnalyses();
      if (res.ok && Array.isArray(res.analyses)) {
        setHistoryList(res.analyses);
      }
    } catch (err) {
      console.warn('Could not load analysis history:', err.message);
    } finally {
      setIsHistoryLoading(false);
    }
  }

  // Handle inline input validation
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputVal(val);
    setApiError(null);

    const normalized = normalizeUsernameInput(val);
    if (val.trim() && !isValidUsername(normalized)) {
      setInputError('Username must be 1-30 characters (letters, numbers, periods, underscores).');
    } else {
      setInputError(null);
    }
  };

  // Run analysis handler
  const handleAnalyzeSubmit = async (e) => {
    e?.preventDefault();
    const clean = normalizeUsernameInput(inputVal);

    if (!clean || !isValidUsername(clean)) {
      setInputError('Please enter a valid Instagram username or profile link.');
      return;
    }

    setInputError(null);
    setApiError(null);

    // Guest Flow: Store in session, show paywall modal
    if (isGuest) {
      try {
        sessionStorage.setItem('instascrape_pending_analyzer_username', clean);
      } catch {}
      if (onOpenUpgrade) onOpenUpgrade();
      return;
    }

    // Locked Flow: Free trial used
    if (isAnalysisLocked) {
      setApiError('Your free trial is used. Choose a plan to keep searching and analyzing.');
      if (onOpenUpgrade) onOpenUpgrade();
      return;
    }

    // Authenticated Flow: Run server analysis
    setIsLoading(true);
    setImgError(false);

    try {
      const res = await analyzeProfile(clean);
      if (res.ok && res.analysis) {
        setAnalysisResult(res.analysis);
        loadHistory();
      } else {
        throw new Error(res.error?.message || 'Failed to analyze profile.');
      }
    } catch (err) {
      if (err.status === 402 || err.code === 'subscription_required') {
        setApiError('Your free trial is used. Choose a plan to keep searching and analyzing.');
        if (onOpenUpgrade) onOpenUpgrade();
      } else {
        setApiError(err.message || 'An error occurred while analyzing the profile.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Re-run an analysis or load from history
  const handleSelectHistoryItem = (item) => {
    if (item.analysisId === analysisResult?.analysisId) return;
    setInputVal(item.username);
    setAnalysisResult(null);
    setIsLoading(true);
    setImgError(false);

    analyzeProfile(item.username)
      .then((res) => {
        if (res.ok && res.analysis) {
          setAnalysisResult(res.analysis);
        }
      })
      .catch((err) => {
        setApiError(err.message || 'Could not load analysis.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Delete an item from history
  const handleDeleteHistory = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteAnalysis(id);
      setHistoryList((prev) => prev.filter((a) => a.analysisId !== id));
      if (analysisResult?.analysisId === id) {
        setAnalysisResult(null);
      }
    } catch (err) {
      alert(`Could not delete: ${err.message}`);
    }
  };

  // Clipboard helper
  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Breakdown labels
  const breakdownLabels = {
    clarity: 'Clarity of Target & Niche',
    value_proposition: 'Value Proposition & Offer',
    call_to_action: 'Direct Call to Action (CTA)',
    readability: 'Scannability & Spacing',
    contact_or_link: 'Contact Path & External Link'
  };

  return (
    <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '24px 16px 80px 16px' }}>
      {/* Editorial Header (Clean, left-aligned, no gradient blobs) */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)'
            }}
          >
            Audit Tool
          </span>
          <span style={{ color: 'var(--border-subtle)' }}>•</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Public & Private Profiles
          </span>
        </div>
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            margin: '0 0 10px 0',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-display)'
          }}
        >
          Profile Presentation Analyzer
        </h1>
        <p
          style={{
            fontSize: '0.98rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            maxWidth: '680px',
            margin: 0
          }}
        >
          Evaluates bio clarity, value proposition, calls to action, and scannability.
          Never inspects or stores posts—scores presentation quality only.
        </p>

        {/* Legal notice banner */}
        <div
          style={{
            marginTop: '16px',
            padding: '10px 14px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <ShieldAlert size={14} style={{ flexShrink: 0, color: 'var(--text-secondary)' }} />
          <span>
            Only analyze profiles you have a reason to review, such as your own or a business you are evaluating. Do not use results to target or contact individuals.
          </span>
        </div>
      </div>

      {/* Input Form with Inline Validation */}
      <form
        onSubmit={handleAnalyzeSubmit}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '20px',
          marginBottom: '32px'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label
            htmlFor="analyzer-username-input"
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text-secondary)'
            }}
          >
            Instagram Username or Profile URL
          </label>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 300px', position: 'relative' }}>
              <input
                id="analyzer-username-input"
                type="text"
                value={inputVal}
                onChange={handleInputChange}
                placeholder="e.g. natgeo or instagram.com/creativestudio"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: 'var(--bg-input)',
                  border: `1px solid ${inputError ? 'var(--accent-red)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'border-color var(--transition-fast)'
                }}
              />
            </div>
            <button
              type={isAnalysisLocked ? "button" : "submit"}
              onClick={isAnalysisLocked ? () => {
                setApiError('Your free trial is used. Choose a plan to keep searching and analyzing.');
                if (onOpenUpgrade) onOpenUpgrade();
              } : undefined}
              disabled={isLoading || (!isAnalysisLocked && (Boolean(inputError) || !inputVal.trim()))}
              className="btn btn-primary"
              style={{
                padding: '12px 24px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: isAnalysisLocked ? 0.8 : 1,
                cursor: 'pointer'
              }}
            >
              {isAnalysisLocked ? (
                <>
                  <Lock size={16} /> Choose Plan (Trial Used)
                </>
              ) : isLoading ? (
                <>
                  <RefreshCw size={16} className="spin-slow" /> Analyzing...
                </>
              ) : (
                <>
                  Run Audit <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>

          {/* Locked Notice */}
          {isAnalysisLocked && (
            <div
              onClick={onOpenUpgrade}
              style={{
                marginTop: '10px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(225, 48, 108, 0.1)',
                border: '1px solid rgba(225, 48, 108, 0.35)',
                color: 'var(--accent-pink)',
                fontSize: '0.825rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={14} style={{ flexShrink: 0 }} />
                <span>Your free trial is used. Choose a plan to keep searching and analyzing.</span>
              </div>
              <span style={{ fontSize: '0.78rem', textDecoration: 'underline', fontWeight: 700, flexShrink: 0 }}>
                View Plans
              </span>
            </div>
          )}

          {inputError && (
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-red)', marginTop: '4px' }}>
              {inputError}
            </span>
          )}

          {isGuest && (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Viewing sample audit. Sign in to analyze live accounts.
            </span>
          )}
        </div>
      </form>

      {/* Restrained Progress State with 3 Steps */}
      {isLoading && (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '32px 24px',
            marginBottom: '32px',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '24px',
              maxWidth: '540px',
              margin: '0 auto 18px auto'
            }}
          >
            {[
              { id: 1, label: 'Fetching profile' },
              { id: 2, label: 'Reading bio' },
              { id: 3, label: 'Writing report' }
            ].map((step) => {
              const isPast = progressStep > step.id;
              const isCurrent = progressStep === step.id;
              return (
                <div
                  key={step.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: isPast || isCurrent ? 1 : 0.35,
                    transition: 'opacity 200ms ease'
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: isPast
                        ? 'var(--accent-green)'
                        : isCurrent
                        ? 'var(--accent-pink)'
                        : 'var(--border-subtle)',
                      color: '#fff',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {isPast ? <Check size={14} /> : step.id}
                  </div>
                  <span
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: isCurrent ? 600 : 400,
                      color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)'
                    }}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
            Analyzing presentation clarity and tone. Posts are never inspected.
          </p>
        </div>
      )}

      {/* Error Message */}
      {apiError && !isLoading && (
        <div
          style={{
            padding: '16px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}
        >
          <AlertCircle size={18} style={{ color: 'var(--accent-red)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: 'var(--accent-red)' }}>
              Analysis Error
            </h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {apiError}
            </p>
          </div>
        </div>
      )}

      {/* Result Display: Asymmetric 2-Column Grid */}
      {analysisResult && !isLoading && (
        <div>
          {/* Guest preview banner if showing sample */}
          {isGuest && (
            <div
              style={{
                padding: '12px 18px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'var(--bg-surface-elevated)',
                    color: 'var(--text-secondary)',
                    fontWeight: 600
                  }}
                >
                  Sample Preview
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  This is a sample audit of @{analysisResult.username}. Sign in to analyze any account.
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenUpgrade}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '6px 14px' }}
              >
                Unlock Unlimited Analyses
              </button>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '24px',
              alignItems: 'start',
              marginBottom: '32px'
            }}
          >
            {/* LEFT COLUMN: Profile Snapshot */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '24px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                {/* Profile Pic with fallback */}
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {analysisResult.profileSnapshot?.profilePicUrl && !imgError ? (
                    <img
                      src={analysisResult.profileSnapshot.profilePicUrl}
                      alt={analysisResult.username}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      onError={() => setImgError(true)}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      {(analysisResult.username || 'A')[0].toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Name & Username */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                      {analysisResult.profileSnapshot?.fullName || `@${analysisResult.username}`}
                    </h2>
                    {analysisResult.profileSnapshot?.verified && (
                      <BadgeCheck size={18} style={{ color: '#3897f0', flexShrink: 0 }} />
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      @{analysisResult.username}
                    </span>
                    {analysisResult.profileSnapshot?.private && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        <Lock size={10} /> Private
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Counts */}
              <div
                style={{
                  display: 'flex',
                  gap: '20px',
                  padding: '12px 0',
                  borderTop: '1px solid var(--border-subtle)',
                  borderBottom: '1px solid var(--border-subtle)',
                  marginBottom: '18px'
                }}
              >
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {Number(analysisResult.profileSnapshot?.followersCount || 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Followers</div>
                </div>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {Number(analysisResult.profileSnapshot?.followsCount || 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Following</div>
                </div>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {analysisResult.profileSnapshot?.hasExternalLink ? 'Yes' : 'None'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Link in bio</div>
                </div>
              </div>

              {/* Bio snippet */}
              <div style={{ marginBottom: '20px' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    display: 'block',
                    marginBottom: '6px'
                  }}
                >
                  Original Bio
                </span>
                <p
                  style={{
                    fontSize: '0.88rem',
                    lineHeight: 1.5,
                    color: 'var(--text-secondary)',
                    whiteSpace: 'pre-line',
                    margin: 0,
                    background: 'var(--bg-input)',
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  {analysisResult.profileSnapshot?.biography || '(No bio text provided)'}
                </p>
              </div>

              {/* Outbound Link */}
              <a
                href={`https://www.instagram.com/${analysisResult.username}/`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  textDecoration: 'none'
                }}
              >
                View on Instagram <ExternalLink size={13} />
              </a>
            </div>

            {/* RIGHT COLUMN: Presentation Report */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '24px'
              }}
            >
              {/* Score Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '24px'
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'var(--text-muted)'
                    }}
                  >
                    Presentation Score
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                    <span
                      style={{
                        fontSize: '3.5rem',
                        fontWeight: 800,
                        lineHeight: 1,
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-display)'
                      }}
                    >
                      <AnimatedScore targetScore={analysisResult.score} />
                    </span>
                    <span style={{ fontSize: '1.25rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      /10
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  {analysisResult.score >= 8
                    ? 'Exceptional clarity'
                    : analysisResult.score >= 6
                    ? 'Solid foundation'
                    : 'High room for growth'}
                </div>
              </div>

              {/* 5-Bar Breakdown Chart */}
              <div style={{ marginBottom: '28px' }}>
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    display: 'block',
                    marginBottom: '14px'
                  }}
                >
                  Rubric Breakdown
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.entries(analysisResult.breakdown || {}).map(([key, val]) => (
                    <div key={key}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.8rem',
                          marginBottom: '4px'
                        }}
                      >
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {breakdownLabels[key] || key}
                        </span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {val}/10
                        </span>
                      </div>
                      <div
                        style={{
                          height: '6px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}
                      >
                        <div
                          style={{
                            width: `${(val / 10) * 100}%`,
                            height: '100%',
                            background:
                              val >= 8
                                ? 'var(--accent-green)'
                                : val >= 5
                                ? 'var(--accent-orange)'
                                : 'var(--accent-red)',
                            borderRadius: '3px',
                            transition: 'width 400ms ease'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div style={{ marginBottom: '24px' }}>
                <h3
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    margin: '0 0 8px 0',
                    color: 'var(--text-primary)'
                  }}
                >
                  Profile Assessment
                </h3>
                <p
                  style={{
                    fontSize: '0.88rem',
                    lineHeight: 1.6,
                    color: 'var(--text-secondary)',
                    margin: 0
                  }}
                >
                  {analysisResult.summary}
                </p>
              </div>

              {/* Strengths */}
              {Array.isArray(analysisResult.strengths) && analysisResult.strengths.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h3
                    style={{
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      margin: '0 0 10px 0',
                      color: 'var(--text-primary)'
                    }}
                  >
                    Key Strengths
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {analysisResult.strengths.map((str, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          gap: '8px',
                          fontSize: '0.85rem',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>•</span>
                        <span>{str}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Improvements */}
              {Array.isArray(analysisResult.improvements) && analysisResult.improvements.length > 0 && (
                <div>
                  <h3
                    style={{
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      margin: '0 0 12px 0',
                      color: 'var(--text-primary)'
                    }}
                  >
                    Actionable Improvements
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {analysisResult.improvements.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '12px 14px',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)'
                        }}
                      >
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {item.title}
                        </div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '4px 0 8px 0' }}>
                          {item.detail}
                        </p>
                        {item.example && (
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 10px',
                              background: 'var(--bg-input)',
                              borderRadius: '4px',
                              border: '1px solid var(--border-subtle)',
                              gap: '8px'
                            }}
                          >
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              “{item.example}”
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(item.example, `imp-${idx}`)}
                              className="btn btn-ghost"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                              title="Copy snippet"
                            >
                              {copiedKey === `imp-${idx}` ? (
                                <>
                                  <Check size={12} style={{ color: 'var(--accent-green)' }} /> Copied
                                </>
                              ) : (
                                <>
                                  <Copy size={12} /> Copy
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* BELOW: Suggested Bio Rewrite with Character Counter */}
          {analysisResult.example_bio && (
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '24px',
                marginBottom: '24px'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}
              >
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    Suggested Bio Rewrite
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Optimized for clarity, scan order, and Instagram's 150-character limit
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      color:
                        analysisResult.example_bio.length <= 150
                          ? 'var(--text-muted)'
                          : 'var(--accent-red)',
                      fontWeight: 500
                    }}
                  >
                    {analysisResult.example_bio.length} / 150 characters
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(analysisResult.example_bio, 'example-bio')}
                    className="btn btn-secondary"
                    style={{
                      fontSize: '0.8rem',
                      padding: '6px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {copiedKey === 'example-bio' ? (
                      <>
                        <Check size={13} style={{ color: 'var(--accent-green)' }} /> Copied to Clipboard
                      </>
                    ) : (
                      <>
                        <Copy size={13} /> Copy Bio
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div
                style={{
                  padding: '14px',
                  background: 'var(--bg-input)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.92rem',
                  color: 'var(--text-primary)',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-line'
                }}
              >
                {analysisResult.example_bio}
              </div>
            </div>
          )}

          {/* Short Disclaimer under the result */}
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              This score reflects how the profile presents itself, not the person behind it.
            </p>
          </div>
        </div>
      )}

      {/* History Drawer/Section for Logged-In Users */}
      {!isGuest && historyList.length > 0 && (
        <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Recent Analyses
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Retained for 30 days
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
            {historyList.map((item) => (
              <div
                key={item.analysisId}
                onClick={() => handleSelectHistoryItem(item)}
                style={{
                  padding: '12px 14px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'background var(--transition-fast)'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    @{item.username}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Score: {item.score}/10 • {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleDeleteHistory(e, item.analysisId)}
                  className="btn btn-ghost"
                  style={{ padding: '6px', borderRadius: '4px', color: 'var(--text-muted)' }}
                  title="Delete from history"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
