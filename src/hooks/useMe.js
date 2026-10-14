import { useState, useEffect, useCallback } from 'react';
import { fetchMe } from '../services/api.js';

export function useMe(isAuthenticated, isEmailVerified) {
  const [meData, setMeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshMe = useCallback(async () => {
    if (!isAuthenticated) {
      setMeData({
        plan: 'guest',
        subscription: null,
        dailyQuota: { used: 0, limit: 0, remaining: 0 }
      });
      return;
    }

    setLoading(true);
    try {
      const data = await fetchMe();
      setMeData(data);
      setError(null);
    } catch (err) {
      console.warn('Failed to load user plan profile:', err);
      setError(err);
      // Fallback
      setMeData({
        plan: 'free',
        subscription: null,
        dailyQuota: { used: 0, limit: 1, remaining: 1 }
      });
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshMe();
  }, [refreshMe, isAuthenticated, isEmailVerified]);

  // Polling helper used after checkout until plan is active
  const pollForPaidPlan = useCallback(async (maxAttempts = 10, intervalMs = 2500) => {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const data = await fetchMe();
        if (data.isPaid || data.plan === 'paid') {
          setMeData(data);
          return true;
        }
      } catch {
        // Retry
      }
      await new Promise(r => setTimeout(r, intervalMs));
    }
    await refreshMe();
    return false;
  }, [refreshMe]);

  const isGuest = !isAuthenticated;
  const isPaid = Boolean(meData?.isPaid || meData?.plan === 'paid');
  const trial = meData?.trial || {
    searchesUsed: 0,
    searchesRemaining: 1,
    searchesTotal: 1,
    analysesUsed: 0,
    analysesRemaining: 1,
    analysesTotal: 1,
    isSearchTrialUsed: false,
    isAnalysisTrialUsed: false,
    isTrialExhausted: false
  };

  const isTrial = !isGuest && !isPaid && (!trial.isSearchTrialUsed || !trial.isAnalysisTrialUsed);
  const isLocked = !isGuest && !isPaid && trial.isTrialExhausted;
  const isSearchLocked = !isGuest && !isPaid && trial.isSearchTrialUsed;
  const isAnalysisLocked = !isGuest && !isPaid && trial.isAnalysisTrialUsed;

  const plan = isGuest ? 'guest' : isPaid ? 'paid' : (isTrial ? 'trial' : 'locked');
  const tier = meData?.tier || (isPaid ? (meData?.subscription?.plan || 'weekly') : (isTrial ? 'trial' : 'locked'));

  return {
    meData,
    plan, // 'guest' | 'trial' | 'locked' | 'paid'
    tier,
    trial,
    isPaid,
    isFree: !isPaid && !isGuest,
    isTrial,
    isLocked,
    isSearchLocked,
    isAnalysisLocked,
    isGuest,
    loading,
    error,
    refreshMe,
    pollForPaidPlan
  };
}
