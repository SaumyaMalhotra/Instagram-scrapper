import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { useTheme } from './hooks/useTheme.js';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import { useSessionStorage } from './hooks/useSessionStorage.js';
import { useAuth } from './hooks/useAuth.js';
import { useMe } from './hooks/useMe.js';
import { useApifyRun } from './hooks/useApifyRun.js';
import { useFilteredPosts } from './hooks/useFilteredPosts.js';
import { fetchHealth, fetchUserRuns, deleteUserRun } from './services/api.js';

import Layout from './components/Layout.jsx';
import Sidebar from './components/Sidebar.jsx';
import LandingHero from './components/LandingHero.jsx';
import PricingSection from './components/PricingSection.jsx';
import ScrapeForm from './components/ScrapeForm.jsx';
import ProgressTracker from './components/ProgressTracker.jsx';
import StatsBar from './components/StatsBar.jsx';
import ResultsGrid from './components/ResultsGrid.jsx';
import PostModal from './components/PostModal.jsx';
import AuthModal from './components/AuthModal.jsx';
import SubscriptionModal from './components/SubscriptionModal.jsx';
import VerifyEmailBanner from './components/VerifyEmailBanner.jsx';
import AccountPage from './components/AccountPage.jsx';
import LegalModal from './components/LegalModal.jsx';
import DetectiveOnboarding from './components/DetectiveOnboarding.jsx';
import ProfileAnalyzer from './components/ProfileAnalyzer.jsx';

import LandingPageTemplate from './components/seo/LandingPageTemplate.jsx';
import ResourcesHub from './components/seo/ResourcesHub.jsx';
import ArticlePage from './components/seo/ArticlePage.jsx';
import ContactPage from './components/seo/ContactPage.jsx';
import LegalPage from './components/seo/LegalPage.jsx';
import { useDocumentHead } from './hooks/useDocumentHead.js';
import { SEO_PAGES, ARTICLES } from './data/seoData.js';

function resolveRoute(pathname) {
  if (typeof window === 'undefined') return { tab: 'scraper' };
  const clean = pathname ? pathname.split('?')[0].replace(/\/+$/, '') || '/' : '/';
  if (clean === '/' || clean === '') return { tab: 'scraper' };
  if (clean === '/analyzer') return { tab: 'analyzer' };
  if (clean === '/account') return { tab: 'account' };
  if (clean === '/resources') return { tab: 'resources' };
  if (clean.startsWith('/resources/')) {
    const slug = clean.replace('/resources/', '');
    const article = ARTICLES.find((a) => a.slug === slug);
    if (article) return { tab: 'article', article };
    return { tab: 'resources' };
  }
  if (clean === '/instagram-profile-analyzer') return { tab: 'landing', pageKey: 'profileAnalyzer' };
  if (clean === '/instagram-bio-analyzer') return { tab: 'landing', pageKey: 'bioAnalyzer' };
  if (clean === '/instagram-profile-audit') return { tab: 'landing', pageKey: 'profileAudit' };
  if (clean === '/instagram-content-research') return { tab: 'landing', pageKey: 'contentResearch' };
  if (clean === '/contact') return { tab: 'contact' };
  if (clean === '/terms') return { tab: 'terms' };
  if (clean === '/privacy') return { tab: 'privacy' };
  return { tab: 'scraper' };
}

export default function App() {
  const { theme, toggleTheme } = useTheme();

  // Authentication & Tier state
  const {
    user,
    isAuthenticated,
    isEmailVerified,
    refreshUser,
    logout,
    changePassword,
    resendVerification
  } = useAuth();

  const {
    plan,
    tier,
    trial,
    isPaid,
    isFree,
    isTrial,
    isLocked,
    isSearchLocked,
    isAnalysisLocked,
    isGuest,
    meData,
    refreshMe,
    pollForPaidPlan
  } = useMe(isAuthenticated, isEmailVerified);

  // Pending Search in sessionStorage (for guests who tap search before subscribing)
  const [pendingSearch, setPendingSearch, clearPendingSearch] = useSessionStorage(
    'instascrape_pending_search',
    null
  );

  // Route state initialized from window.location.pathname
  const [routeState, setRouteState] = useState(() => {
    if (typeof window !== 'undefined') {
      return resolveRoute(window.location.pathname);
    }
    return { tab: 'scraper' };
  });

  const activeTab = routeState.tab;

  // SPA navigation handler
  const handleNavigate = useCallback((path) => {
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', path);
    }
    setRouteState(resolveRoute(path));
  }, []);

  // Backwards-compatible tab setter
  const setActiveTab = useCallback((tab) => {
    if (tab === 'analyzer') {
      handleNavigate('/analyzer');
    } else if (tab === 'account') {
      handleNavigate('/account');
    } else if (tab === 'resources') {
      handleNavigate('/resources');
    } else {
      handleNavigate('/');
    }
  }, [handleNavigate]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [authModalConfig, setAuthModalConfig] = useState({ isOpen: false, view: 'signin' });
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [legalModalConfig, setLegalModalConfig] = useState({ isOpen: false, tab: 'terms' });
  const [isDetectiveOnboardingOpen, setIsDetectiveOnboardingOpen] = useState(false);

  // Sync routeState with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setRouteState(resolveRoute(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Maintain document title, meta tags, and schema for core tabs
  useDocumentHead({
    title:
      activeTab === 'scraper'
        ? SEO_PAGES.home.title
        : activeTab === 'analyzer'
        ? SEO_PAGES.profileAnalyzer.title
        : activeTab === 'account'
        ? SEO_PAGES.account.title
        : undefined,
    description:
      activeTab === 'scraper'
        ? SEO_PAGES.home.description
        : activeTab === 'analyzer'
        ? SEO_PAGES.profileAnalyzer.description
        : undefined,
    canonical:
      activeTab === 'scraper'
        ? SEO_PAGES.home.canonical
        : activeTab === 'analyzer'
        ? SEO_PAGES.profileAnalyzer.canonical
        : undefined,
    pageKey: activeTab === 'scraper' ? 'home' : activeTab === 'analyzer' ? 'profileAnalyzer' : undefined,
    noindex: activeTab === 'account'
  });

  // Scraper results & History state
  const [runsHistory, setRunsHistory] = useState([]);
  const [currentPosts, setCurrentPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [serverHealth, setServerHealth] = useState(null);
  const [formInitialValues, setFormInitialValues] = useState(null);
  const [lastSubmittedParams, setLastSubmittedParams] = useState(null);

  // Filter, sort, paginate, and calculate metrics based on current tier
  const postsHook = useFilteredPosts(currentPosts, plan);

  // Check health on mount
  useEffect(() => {
    let isSubscribed = true;
    async function checkServer() {
      try {
        const health = await fetchHealth();
        if (isSubscribed) setServerHealth(health);
      } catch (err) {
        console.warn('Backend health check error:', err);
      }
    }
    checkServer();
    return () => { isSubscribed = false; };
  }, []);

  // Trigger Detective Onboarding only for new users
  useEffect(() => {
    try {
      const hasCompleted = localStorage.getItem('instascrape_detective_onboarding_v1');
      if (!hasCompleted) {
        const timer = setTimeout(() => {
          setIsDetectiveOnboardingOpen(true);
        }, 400);
        return () => clearTimeout(timer);
      }
    } catch {
      // Non-fatal
    }
  }, []);

  const handleCloseDetectiveOnboarding = useCallback(() => {
    setIsDetectiveOnboardingOpen(false);
    try {
      localStorage.setItem('instascrape_detective_onboarding_v1', 'completed');
    } catch {
      // Ignored
    }
  }, []);

  const handleSelectDetectiveTarget = useCallback((username) => {
    handleCloseDetectiveOnboarding();
    setFormInitialValues({ targets: [username], usernameOrUrl: username });
    setActiveTab('scraper');
  }, [handleCloseDetectiveOnboarding]);

  // Fetch user runs history when authenticated
  const loadUserRuns = useCallback(async () => {
    if (!isAuthenticated) {
      setRunsHistory([]);
      return;
    }
    try {
      const data = await fetchUserRuns();
      if (Array.isArray(data.runs)) {
        setRunsHistory(data.runs);
      }
    } catch (err) {
      console.warn('Could not load user runs:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadUserRuns();
  }, [loadUserRuns]);

  // Completed run callback
  const handleRunCompleted = useCallback((result) => {
    const posts = result.posts || result.items || [];
    setCurrentPosts(posts);
    loadUserRuns();
    refreshMe();

    // Trigger confetti celebration
    try {
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // Ignored
    }
  }, [loadUserRuns, refreshMe]);

  // Apify Run Orchestration Hook
  const apifyHook = useApifyRun(handleRunCompleted);

  // Trigger scrape execution
  const executeScrape = useCallback((params) => {
    setLastSubmittedParams(params);
    apifyHook.initiateScrape(params);
  }, [apifyHook]);

  // If a pending search exists and the user is now paid, auto-run the search!
  useEffect(() => {
    if (isPaid && pendingSearch) {
      const searchToRun = { ...pendingSearch };
      clearPendingSearch();
      executeScrape(searchToRun);
    }
  }, [isPaid, pendingSearch, clearPendingSearch, executeScrape]);

  // When scrape returns 402 subscription_required, automatically open Subscription Modal
  useEffect(() => {
    if (apifyHook.error?.code === 'subscription_required' || apifyHook.error?.status === 402) {
      setIsSubModalOpen(true);
    }
  }, [apifyHook.error]);

  // Guest clicks Search in ScrapeForm:
  // Store pending search in sessionStorage, hide any results, open paywall! Zero Apify calls made!
  const handleGuestSubmit = (searchParams) => {
    setPendingSearch(searchParams);
    setCurrentPosts([]);
    setIsSubModalOpen(true);
  };

  // Free but unverified user clicks Search:
  const handleUnverifiedSubmit = () => {
    alert('Please verify your email address to run Instagram scrapes.');
  };

  // Load run from history sidebar
  const handleLoadPastRun = (run) => {
    if (run.items && run.items.length > 0) {
      setCurrentPosts(run.items);
    }
    if (run.input) {
      setFormInitialValues(run.input);
    }
    apifyHook.reset();
  };

  // Re-run from history
  const handleRerunParams = (params) => {
    setFormInitialValues(params);
    if (isGuest) {
      handleGuestSubmit(params);
    } else {
      executeScrape(params);
    }
  };

  // Delete run from history
  const handleDeleteRun = async (runId) => {
    try {
      await deleteUserRun(runId);
      loadUserRuns();
    } catch (err) {
      alert(`Could not delete run: ${err.message}`);
    }
  };

  // Sign out handler
  const handleLogout = async () => {
    await logout();
    clearPendingSearch();
    setCurrentPosts([]);
    apifyHook.reset();
    setActiveTab('scraper');
  };

  return (
    <Layout
      theme={theme}
      toggleTheme={toggleTheme}
      onOpenSidebar={() => setIsSidebarOpen(true)}
      serverHealth={serverHealth}
      historyCount={runsHistory.length}
      user={user}
      plan={plan}
      trial={trial}
      isTrial={isTrial}
      isLocked={isLocked}
      dailyQuota={meData?.dailyQuota}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onNavigate={handleNavigate}
      onOpenAuth={(view) => setAuthModalConfig({ isOpen: true, view: view || 'signin' })}
      onOpenUpgrade={() => setIsSubModalOpen(true)}
      onLogout={handleLogout}
      onOpenLegal={(tab) => setLegalModalConfig({ isOpen: true, tab: tab || 'terms' })}
      onOpenDetectiveBriefing={() => setIsDetectiveOnboardingOpen(true)}
    >
      {/* Sidebar Drawer */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        history={runsHistory}
        onClearHistory={() => setRunsHistory([])}
        onLoadRun={handleLoadPastRun}
        onRerunParams={handleRerunParams}
        onDeleteRun={handleDeleteRun}
      />

      {/* Detective Briefing Modal for New Users / Replay */}
      <DetectiveOnboarding
        isOpen={isDetectiveOnboardingOpen}
        onClose={handleCloseDetectiveOnboarding}
        onSelectTarget={handleSelectDetectiveTarget}
      />

      {/* Auth Modal (Sign In / Sign Up / Forgot Password / Check Inbox) */}
      <AuthModal
        isOpen={authModalConfig.isOpen}
        initialView={authModalConfig.view}
        onClose={() => setAuthModalConfig({ isOpen: false, view: 'signin' })}
        onSuccess={async () => {
          await refreshUser();
          await refreshMe();
          // If pending search exists, open Subscription modal next
          if (pendingSearch) {
            setIsSubModalOpen(true);
          }
        }}
      />

      {/* Subscription Paywall Modal (Razorpay INR plans) */}
      <SubscriptionModal
        isOpen={isSubModalOpen}
        onClose={() => setIsSubModalOpen(false)}
        user={user}
        isEmailVerified={isEmailVerified}
        hasPendingSearch={Boolean(pendingSearch)}
        onOpenAuth={(view) => {
          setIsSubModalOpen(false);
          setAuthModalConfig({ isOpen: true, view });
        }}
        onResendVerification={resendVerification}
        onSubscriptionSuccess={async () => {
          // Poll for plan change to become active on backend
          await pollForPaidPlan(10, 2000);
        }}
        onOpenLegal={(tab) => setLegalModalConfig({ isOpen: true, tab })}
      />

      {/* Legal Modal (Terms, Privacy, Refund Policy) */}
      <LegalModal
        isOpen={legalModalConfig.isOpen}
        initialTab={legalModalConfig.tab}
        onClose={() => setLegalModalConfig({ isOpen: false, tab: 'terms' })}
      />

      {/* Unverified Email Persistent Notice Banner */}
      {user && !isEmailVerified && (
        <div style={{ marginBottom: '24px' }}>
          <VerifyEmailBanner
            email={user.email}
            onRefreshUser={async () => {
              await refreshUser();
              await refreshMe();
            }}
          />
        </div>
      )}

      {/* TAB 1: SCRAPER VIEW */}
      {activeTab === 'scraper' && (
        <>
          {/* Landing hero visible for guests */}
          {isGuest && (
            <LandingHero
              onOpenAuth={(view) => setAuthModalConfig({ isOpen: true, view })}
              onOpenDetectiveBriefing={() => setIsDetectiveOnboardingOpen(true)}
            />
          )}

          {/* Scrape Input Form */}
          <ScrapeForm
            onSubmit={executeScrape}
            onGuestSubmit={handleGuestSubmit}
            onUnverifiedSubmit={handleUnverifiedSubmit}
            onOpenUpgrade={() => setIsSubModalOpen(true)}
            isSearchLocked={isSearchLocked}
            userTier={plan}
            isEmailVerified={isEmailVerified}
            isBusy={apifyHook.isBusy}
            maxResultsPerProfile={100}
            initialValues={formInitialValues}
          />

          {/* Progress & Status Tracker */}
          <ProgressTracker
            stage={apifyHook.stage}
            runId={apifyHook.runId}
            elapsedSeconds={apifyHook.elapsedSeconds}
            error={apifyHook.error}
            runMetadata={apifyHook.runMetadata}
            onCancel={apifyHook.cancelRun}
            onReset={() => {
              apifyHook.reset();
              setCurrentPosts([]);
            }}
          />

          {/* RESULTS VISIBILITY RULE:
              While the user is a guest, post list is HIDDEN and only paywall appears.
              Results appear only after a verified login and an allowed tier! */}
          {!isGuest && currentPosts.length > 0 && (
            <>
              {/* Analytics & Stats Bar with Recharts Area Chart */}
              <StatsBar stats={postsHook.stats} />

              {/* Results Grid with Tier Badges & Media Previews */}
              <ResultsGrid
                postsHook={postsHook}
                onSelectPost={(post) => setSelectedPost(post)}
                userTier={plan}
                isPaid={isPaid}
                onOpenSubscriptionModal={() => setIsSubModalOpen(true)}
              />
            </>
          )}

          {/* Pricing Section on landing screen for Guests and Trial/Locked users */}
          {(isGuest || isTrial || isLocked || currentPosts.length === 0) && (
            <PricingSection
              onSelectPlan={(planId) => {
                setIsSubModalOpen(true);
              }}
              currentTier={tier}
              isPaid={isPaid}
            />
          )}
        </>
      )}

      {/* TAB 2: PROFILE ANALYZER VIEW */}
      {activeTab === 'analyzer' && (
        <ProfileAnalyzer
          user={user}
          plan={plan}
          isAnalysisLocked={isAnalysisLocked}
          onOpenUpgrade={() => setIsSubModalOpen(true)}
          onOpenAuth={(view) => setAuthModalConfig({ isOpen: true, view: view || 'signin' })}
        />
      )}

      {/* TAB: ACCOUNT & BILLING VIEW */}
      {activeTab === 'account' && user && (
        <AccountPage
          user={user}
          plan={plan}
          subscription={meData?.subscription}
          onChangePassword={changePassword}
          onOpenUpgrade={() => setIsSubModalOpen(true)}
          onAccountDeleted={handleLogout}
        />
      )}

      {/* TAB: SEO DEDICATED LANDING PAGES */}
      {activeTab === 'landing' && routeState.pageKey && (
        <LandingPageTemplate
          pageKey={routeState.pageKey}
          seoPage={SEO_PAGES[routeState.pageKey]}
          onLaunchTool={() => {
            const targetTab = SEO_PAGES[routeState.pageKey]?.tab || 'scraper';
            handleNavigate(targetTab === 'analyzer' ? '/analyzer' : '/');
          }}
          onNavigate={handleNavigate}
        />
      )}

      {/* TAB: RESOURCES & GUIDES HUB */}
      {activeTab === 'resources' && (
        <ResourcesHub
          onNavigate={handleNavigate}
          onLaunchTool={(tool) => handleNavigate(tool === 'analyzer' ? '/analyzer' : '/')}
        />
      )}

      {/* TAB: RESOURCE ARTICLE DETAIL */}
      {activeTab === 'article' && routeState.article && (
        <ArticlePage
          article={routeState.article}
          onNavigate={handleNavigate}
          onLaunchTool={(tool) => handleNavigate(tool === 'analyzer' ? '/analyzer' : '/')}
        />
      )}

      {/* TAB: CONTACT & SUPPORT */}
      {activeTab === 'contact' && (
        <ContactPage onNavigate={handleNavigate} />
      )}

      {/* TAB: STANDALONE TERMS & PRIVACY */}
      {(activeTab === 'terms' || activeTab === 'privacy') && (
        <LegalPage tab={activeTab} onNavigate={handleNavigate} />
      )}

      {/* Lightbox / Post Modal */}
      <PostModal
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
        isPaid={isPaid}
        onUpgrade={() => {
          setSelectedPost(null);
          setIsSubModalOpen(true);
        }}
      />
    </Layout>
  );
}
