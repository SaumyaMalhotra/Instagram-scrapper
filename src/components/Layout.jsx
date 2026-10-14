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
  onOpenAuth,
  onOpenUpgrade,
  onLogout,
  onOpenLegal,
  onOpenDetectiveBriefing
}) {
  const isPaid = plan === 'paid';
  const isGuest = plan === 'guest' || !user;

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
            <div
              onClick={() => setActiveTab && setActiveTab('scraper')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
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
                  Platform
                </span>
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="desktop-nav" aria-label="Desktop Navigation">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('scraper');
                  window.history.pushState(null, '', '/');
                }}
                className={`chip ${activeTab === 'scraper' ? 'chip-active' : ''}`}
                style={{ cursor: 'pointer', fontSize: '0.8rem', padding: '4px 12px' }}
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('analyzer');
                  window.history.pushState(null, '', '/analyzer');
                }}
                className={`chip ${activeTab === 'analyzer' ? 'chip-active' : ''}`}
                style={{ cursor: 'pointer', fontSize: '0.8rem', padding: '4px 12px' }}
              >
                Analyzer
              </button>
              {user && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('account');
                    window.history.pushState(null, '', '/account');
                  }}
                  className={`chip ${activeTab === 'account' ? 'chip-active' : ''}`}
                  style={{ cursor: 'pointer', fontSize: '0.8rem', padding: '4px 12px' }}
                >
                  Account
                </button>
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

      {/* Clean, Non-Messy Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '24px 20px',
          marginTop: 'auto',
          fontSize: '0.78rem',
          color: 'var(--text-muted)'
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px'
          }}
        >
          <div>
            <p style={{ color: 'var(--text-secondary)' }}>
              InstaScrape — Search and analyze public Instagram content.
            </p>
            <p style={{ fontSize: '0.72rem', marginTop: '2px' }}>
              Subscriptions are billed securely in INR through Razorpay. You are responsible for how you use this service.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => onOpenLegal && onOpenLegal('terms')}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, fontSize: '0.75rem' }}
            >
              Terms
            </button>
            <button
              type="button"
              onClick={() => onOpenLegal && onOpenLegal('privacy')}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, fontSize: '0.75rem' }}
            >
              Privacy
            </button>
            <button
              type="button"
              onClick={() => onOpenLegal && onOpenLegal('refund')}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, fontSize: '0.75rem' }}
            >
              Refunds
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
