import { useState, useEffect, useRef, useCallback } from 'react';
import { startScrape, fetchRunStatus, abortRun, fetchRunPosts } from '../services/api.js';

export function useApifyRun(onRunCompleted) {
  const [stage, setStage] = useState('idle'); // 'idle' | 'starting' | 'scraping' | 'fetching' | 'done' | 'failed' | 'aborted'
  const [runId, setRunId] = useState(null);
  const [datasetId, setDatasetId] = useState(null);
  const [runMetadata, setRunMetadata] = useState(null);
  const [error, setError] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const pollTimerRef = useRef(null);
  const elapsedTimerRef = useRef(null);
  const isMountedRef = useRef(true);
  const errorCountRef = useRef(0);

  const clearTimers = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearTimers();
    };
  }, [clearTimers]);

  const startElapsedTimer = useCallback(() => {
    setElapsedSeconds(0);
    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    elapsedTimerRef.current = setInterval(() => {
      if (isMountedRef.current) {
        setElapsedSeconds(s => s + 1);
      }
    }, 1000);
  }, []);

  // Fetch posts once run completes
  const finishRun = useCallback(async (currentRunId, currentDatasetId, runData) => {
    if (!isMountedRef.current) return;
    setStage('fetching');

    try {
      const { posts, tier } = await fetchRunPosts(currentRunId, { limit: 100, datasetId: currentDatasetId });
      if (!isMountedRef.current) return;

      clearTimers();
      setStage('done');
      if (onRunCompleted) {
        onRunCompleted({
          runId: currentRunId,
          datasetId: currentDatasetId,
          posts: posts || [],
          metadata: runData,
          tier
        });
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      clearTimers();
      setStage('failed');
      setError({
        code: err.code || 'fetch_failed',
        message: err.message || 'Scrape completed, but failed to retrieve post results.',
        retryHint: err.retryHint || 'Try refreshing the results.'
      });
    }
  }, [clearTimers, onRunCompleted]);

  // Polling loop with exponential backoff on transient errors
  const pollStatus = useCallback(async (activeRunId, activeDatasetId) => {
    if (!isMountedRef.current) return;

    try {
      const statusData = await fetchRunStatus(activeRunId);
      if (!isMountedRef.current) return;

      errorCountRef.current = 0;
      setRunMetadata(statusData);

      const status = statusData.status;

      if (status === 'SUCCEEDED') {
        const resolvedDatasetId = statusData.datasetId || activeDatasetId;
        await finishRun(activeRunId, resolvedDatasetId, statusData);
        return;
      }

      if (status === 'FAILED' || status === 'TIMED-OUT') {
        clearTimers();
        setStage('failed');
        setError({
          code: status === 'TIMED-OUT' ? 'run_timeout' : 'actor_failed',
          message: statusData.statusMessage || `Actor run ended with status ${status}.`,
          retryHint: 'Check the target Instagram username or try scraping fewer posts.'
        });
        return;
      }

      if (status === 'ABORTED') {
        clearTimers();
        setStage('aborted');
        return;
      }

      setStage('scraping');
      pollTimerRef.current = setTimeout(() => {
        pollStatus(activeRunId, activeDatasetId);
      }, 2500);

    } catch (err) {
      if (!isMountedRef.current) return;

      errorCountRef.current += 1;
      const backoffDelay = Math.min(2500 * Math.pow(1.5, errorCountRef.current), 15000);

      if (errorCountRef.current > 5) {
        clearTimers();
        setStage('failed');
        setError({
          code: err.code || 'poll_failed',
          message: err.message || 'Lost connection to run status monitor.',
          retryHint: 'Check your internet connection and server status.'
        });
        return;
      }

      pollTimerRef.current = setTimeout(() => {
        pollStatus(activeRunId, activeDatasetId);
      }, backoffDelay);
    }
  }, [clearTimers, finishRun]);

  const initiateScrape = useCallback(async (params) => {
    clearTimers();
    setError(null);
    setRunMetadata(null);
    setStage('starting');
    startElapsedTimer();

    try {
      const res = await startScrape(params);
      if (!isMountedRef.current) return;

      setRunId(res.runId);
      setDatasetId(res.datasetId || null);

      if (res.isPrivateOnly) {
        clearTimers();
        setStage('done');
        if (onRunCompleted) {
          onRunCompleted({
            runId: res.runId,
            datasetId: null,
            posts: res.posts || res.privateProfiles || [],
            metadata: { status: 'SUCCEEDED', isPrivateOnly: true },
            tier: res.tier || 'free'
          });
        }
        return;
      }

      setStage('scraping');

      pollTimerRef.current = setTimeout(() => {
        pollStatus(res.runId, res.datasetId);
      }, 2000);

    } catch (err) {
      if (!isMountedRef.current) return;
      clearTimers();
      setStage('failed');
      setError({
        code: err.code || 'start_failed',
        message: err.message || 'Could not start scraping run.',
        retryHint: err.retryHint || 'Verify your parameters and account status.'
      });
    }
  }, [clearTimers, pollStatus, startElapsedTimer]);

  const cancelRun = useCallback(async () => {
    if (!runId) return;
    try {
      clearTimers();
      setStage('aborted');
      await abortRun(runId);
    } catch (err) {
      console.warn('Failed to abort run cleanly:', err);
    }
  }, [clearTimers, runId]);

  const reset = useCallback(() => {
    clearTimers();
    setStage('idle');
    setRunId(null);
    setDatasetId(null);
    setRunMetadata(null);
    setError(null);
    setElapsedSeconds(0);
  }, [clearTimers]);

  return {
    stage,
    runId,
    datasetId,
    runMetadata,
    error,
    elapsedSeconds,
    initiateScrape,
    cancelRun,
    reset,
    isBusy: ['starting', 'scraping', 'fetching'].includes(stage)
  };
}
