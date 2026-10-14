import React from 'react';
import {
  Instagram,
  Menu,
  Sparkles,
  User,
  LogOut,
  EyeOff,
  Search
} from 'lucide-react';
import ThemeToggle from './ThemeToggle.jsx';

export default function Layout({
  children,
  theme,
  toggleTheme,
  onOpenSidebar,
  historyCount = 0,
  user,
  plan = 'guest',
  dailyQuota,
  trial,
  isTrial = false,
  isLocked = false,
  activeTab = 'scraper',
  setActiveTab,
  onNavigate,
  onOpenAuth,
  onOpenUpgrade,
  onLogout,
  onOpenLegal,
  onOpenDetectiveBriefing
}) {
  const isPaid = plan === 'paid';
  const isGuest = plan === 'guest' || !user;

  // Safe navigation helper
  const navigateTo = (path) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState(null, '', path);
      if (path === '/analyzer') setActiveTab('analyzer');
      else if (path === '/account') setActiveTab('account');
      else setActiveTab('scraper');
    }
  };

  // Trial Usage Meter string (supports compact format on mobile screens)
  const getUsageMeterText = (isCompact = false) => {
    if (isPaid) {
      if (dailyQuota?.remaining === 'unlimited') return isCompact ? 'Unlimited' : 'Unlimited searches';
      return isCompact ? `${dailyQuota?.remaining ?? 20} left` : `${dailyQuota?.remaining ?? 20} searches left today`;
    }
    if (!trial) return isCompact ? 'Trial: 1 search, 1 audit' : 'Free trial: 1 search and 1 analysis remaining';
    const sRem = trial.searchesRemaining ?? 0;
    const aRem = trial.analysesRemaining ?? 0;
    if (sRem === 0 && aRem === 0) {
      return 'Trial used';
    }
    if (sRem > 0 && aRem > 0) {
      return isCompact ? 'Trial: 1 search, 1 audit' : 'Free trial: 1 search and 1 analysis remaining';
    }
    if (sRem > 0) {
      return isCompact ? 'Trial: 1 search' : 'Free trial: 1 search remaining';
    }
    return isCompact ? 'Trial: 1 audit' : 'Free trial: 1 analysis remaining';
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 800,
          background: 'var(--bg-card)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        <div className="header-container">
          {/* Left: Brand & Sidebar toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {user && (
              <button
                type="button"
                onClick={onOpenSidebar}
                className="btn btn-ghost"
                style={{ padding: '8px', borderRadius: 'var(--radius-md)' }}
                aria-label="Open search history"
                title="Search history"
              >
                <Menu size={19} />
                {historyCount > 0 && (
                  <span
                    style={{
                      background: 'var(--accent-pink)',
                      color: '#fff',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '1px 6px',
                      marginLeft: '-4px'
                    }}
                  >
                    {historyCount}
                  </span>
                )}
              </button>
            )}

            {/* Brand Logo */}
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                navigateTo('/');
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', textDecoration: 'none' }}
              aria-label="InstaScrape Pro Home"
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-pink)',
                  flexShrink: 0
                }}
              >
                <Instagram size={18} />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text-primary)' }}>
                  InstaScrape
                </span>
                <span className="brand-badge">
                  Pro
                </span>
              </div>
            </a>

            {/* Desktop Navigation Tabs */}
            <nav className="desktop-nav" aria-label="Desktop Navigation">
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('/');
                }}
                className={`chip ${activeTab === 'scraper' ? 'chip-active' : ''}`}
                style={{ cursor: 'pointer', fontSize: '0.8rem', padding: '4px 12px', textDecoration: 'none' }}
              >
                Search
              </a>
              <a
                href="/analyzer"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('/analyzer');
                }}
                className={`chip ${activeTab === 'analyzer' ? 'chip-active' : ''}`}
                style={{ cursor: 'pointer', fontSize: '0.8rem', padding: '4px 12px', textDecoration: 'none' }}
              >
                Analyzer
              </a>
              <a
                href="/resources"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('/resources');
                }}
                className={`chip ${activeTab === 'resources' || activeTab === 'article' ? 'chip-active' : ''}`}
                style={{ cursor: 'pointer', fontSize: '0.8rem', padding: '4px 12px', textDecoration: 'none' }}
              >
                Resources
              </a>
              {user && (
                <a
                  href="/account"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateTo('/account');
                  }}
                  className={`chip ${activeTab === 'account' ? 'chip-active' : ''}`}
                  style={{ cursor: 'pointer', fontSize: '0.8rem', padding: '4px 12px', textDecoration: 'none' }}
                >
                  Account
                </a>
              )}
            </nav>
          </div>

          {/* Right: Auth, Plan status, Theme toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Usage Meter for logged in users */}
            {user && (
              <span
                style={{
                  fontSize: '0.75rem',
                  color: isPaid ? 'var(--text-secondary)' : (trial?.isTrialExhausted ? '#f87171' : 'var(--text-secondary)'),
                  padding: '4px 10px',
                  background: isPaid ? 'rgba(255, 255, 255, 0.04)' : (trial?.isTrialExhausted ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.04)'),
                  borderRadius: 'var(--radius-full)',
                  border: isPaid ? '1px solid var(--border-subtle)' : (trial?.isTrialExhausted ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-subtle)'),
                  whiteSpace: 'nowrap'
                }}
                title={isPaid ? "Paid quota" : "Trial status"}
              >
                <span className="meter-desktop">{getUsageMeterText(false)}</span>
                <span className="meter-mobile">{getUsageMeterText(true)}</span>
              </span>
            )}

            {/* Guest Action: Plans + Sign In + Sign Up */}
            {isGuest ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={onOpenUpgrade}
                  className="btn btn-secondary btn-hide-mobile"
                  style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                >
                  <Sparkles size={13} style={{ color: 'var(--accent-pink)' }} /> Plans
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth('signin')}
                  className="btn btn-ghost"
                  style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth('signup')}
                  className="btn btn-primary"
                  style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                >
                  Sign Up
                </button>
              </div>
            ) : (
              /* Authenticated User Status */
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {isPaid ? (
                  <span
                    className="chip chip-active"
                    style={{
                      fontSize: '0.72rem',
                      padding: '3px 8px',
                      background: 'rgba(225, 48, 108, 0.15)',
                      borderColor: 'var(--accent-pink)',
                      color: 'var(--accent-pink)',
                      fontWeight: 700
                    }}
                  >
                    PRO
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenUpgrade}
                    className="btn btn-primary"
                    style={{ fontSize: '0.75rem', padding: '5px 10px' }}
                  >
                    <Sparkles size={13} /> Upgrade
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveTab('account')}
                  className="btn btn-ghost btn-hide-mobile"
                  style={{ padding: '6px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  title="My Account"
                >
                  <User size={15} />
                  <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.email?.split('@')[0]}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={onLogout}
                  className="btn btn-ghost"
                  style={{ padding: '6px 8px', color: 'var(--text-muted)' }}
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}

            {/* Detective Mode Briefing Trigger */}
            {onOpenDetectiveBriefing && (
              <button
                type="button"
                onClick={onOpenDetectiveBriefing}
                className="btn btn-ghost"
                style={{
                  fontSize: '0.78rem',
                  padding: '5px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface-elevated)',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title="Open Undercover Mode Guide"
              >
                <EyeOff size={14} style={{ color: 'var(--accent-pink)' }} />
                <span className="undercover-btn-text" style={{ fontWeight: 600 }}>Undercover Mode</span>
              </button>
            )}

            {/* Theme Toggle */}
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          </div>
        </div>

        {/* Mobile Navigation Tabs (Segmented bar right below header for phones) */}
        <nav className="mobile-subnav" aria-label="Mobile Navigation">
          <button
            type="button"
            onClick={() => {
              setActiveTab('scraper');
              window.history.pushState(null, '', '/');
            }}
            className={`mobile-nav-tab ${activeTab === 'scraper' ? 'active' : ''}`}
          >
            <Search size={15} />
            <span>Search</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('analyzer');
              window.history.pushState(null, '', '/analyzer');
            }}
            className={`mobile-nav-tab ${activeTab === 'analyzer' ? 'active' : ''}`}
          >
            <Sparkles size={15} />
            <span>Analyzer</span>
          </button>
          {user && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('account');
                window.history.pushState(null, '', '/account');
              }}
              className={`mobile-nav-tab ${activeTab === 'account' ? 'active' : ''}`}
            >
              <User size={15} />
              <span>Account</span>
            </button>
          )}
        </nav>
      </header>

      {/* Main App Content */}
      <main style={{ flex: 1, maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '24px 20px' }}>
        {/* Trial Complete Persistent Banner */}
        {user && !isPaid && (trial?.isTrialExhausted || (activeTab === 'scraper' ? trial?.isSearchTrialUsed : trial?.isAnalysisTrialUsed)) && (
          <div
            style={{
              marginBottom: '24px',
              padding: '14px 20px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, rgba(225, 48, 108, 0.12), rgba(240, 148, 51, 0.08))',
              border: '1px solid rgba(225, 48, 108, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--accent-pink)',
                  boxShadow: '0 0 8px var(--accent-pink)'
                }}
              />
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Your trial is complete. Subscribe to keep searching.
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenUpgrade}
              className="btn btn-primary"
              style={{ fontSize: '0.8rem', padding: '6px 16px' }}
            >
              Choose a Plan
            </button>
          </div>
        )}
        {children}
      </main>

      {/* Comprehensive, Crawlable Technical SEO Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '40px 20px 24px 20px',
          marginTop: 'auto',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          background: 'var(--bg-surface)'
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '32px',
            marginBottom: '32px'
          }}
        >
          {/* Brand & Purpose Column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-pink)'
                }}
              >
                <Instagram size={15} />
              </div>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                InstaScrape Pro
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.8rem', marginBottom: '10px' }}>
              Production-grade Instagram profile analysis and public content research platform.
            </p>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Secure INR billing via Razorpay. Strictly respects privacy settings.
            </p>
          </div>

          {/* Tools & Analyzers Column */}
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-primary)', letterSpacing: '0.04em', marginBottom: '12px' }}>
              Tools & Analyzers
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <a
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateTo('/');
                  }}
                  style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
                >
                  Public Post Viewer
                </a>
              </li>
              <li>
                <a
                  href="/instagram-profile-analyzer"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateTo('/instagram-profile-analyzer');
                  }}
                  style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
                >
                  Profile Analyzer
                </a>
              </li>
              <li>
                <a
                  href="/instagram-bio-analyzer"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateTo('/instagram-bio-analyzer');
                  }}
                  style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
                >
                  Bio Analyzer & Optimizer
                </a>
              </li>
              <li>
                <a
                  href="/instagram-profile-audit"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateTo('/instagram-profile-audit');
                  }}
                  style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
                >
                  Profile Audit Tool
                </a>
              </li>
              <li>
                <a
                  href="/instagram-content-research"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateTo('/instagram-content-research');
                  }}
                  style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
                >
                  Content Research Suite
                </a>
              </li>
            </ul>
          </div>

          {/* Research & Guides Column */}
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-primary)', letterSpacing: '0.04em', marginBottom: '12px' }}>
              Research & Guides
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <a
                  href="/resources"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateTo('/resources');
                  }}
                  style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
                >
                  Resources & Articles Hub
                </a>
              </li>
              <li>
                <a
                  href="/resources/how-to-improve-instagram-bio"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateTo('/resources/how-to-improve-instagram-bio');
                  }}
                  style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
                >
                  How to Improve Your Bio
                </a>
              </li>
              <li>
                <a
                  href="/resources/instagram-profile-audit-checklist"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateTo('/resources/instagram-profile-audit-checklist');
                  }}
                  style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
                >
                  Profile Audit Checklist
                </a>
              </li>
              <li>
                <a
                  href="/resources/make-instagram-profile-professional"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateTo('/resources/make-instagram-profile-professional');
                  }}
                  style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
                >
                  Make Your Profile Professional
                </a>
              </li>
              <li>
                <a
                  href="/resources/understanding-public-instagram-engagement"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateTo('/resources/understanding-public-instagram-engagement');
                  }}
                  style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
                >
                  Public Engagement Benchmarks
                </a>
              </li>
            </ul>
          </div>

          {/* Support, Trust & Compliance Column */}
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-primary)', letterSpacing: '0.04em', marginBottom: '12px' }}>
              Support & Legal
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <a
                  href="/contact"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateTo('/contact');
                  }}
                  style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
                >
                  Contact & Support
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateTo('/terms');
                  }}
                  style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="/privacy"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateTo('/privacy');
                  }}
                  style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenLegal && onOpenLegal('refund')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, fontSize: '0.8rem', textAlign: 'left' }}
                >
                  Refund Policy
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Disclaimer & Copyright */}
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '20px',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.74rem'
          }}
        >
          <div style={{ color: 'var(--text-muted)', maxWidth: '820px', lineHeight: 1.5 }}>
            InstaScrape Pro is an independent intelligence and analysis platform. We strictly access and evaluate publicly available information. We do not claim to bypass private profile settings, access private media, or violate platform privacy boundaries. InstaScrape Pro is not sponsored by or affiliated with Instagram or Meta Platforms, Inc.
          </div>
          <div style={{ color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} InstaScrape Pro. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
