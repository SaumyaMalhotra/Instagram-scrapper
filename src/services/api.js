import { getIdToken, getAppCheckToken } from './firebase.js';

export class ApiError extends Error {
  constructor(code, message, status = 500, retryHint = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.retryHint = retryHint;
  }
}

/**
 * Executes fetch to relative /api endpoints with standard error handling and headers.
 * Automatically attaches Firebase ID Token and App Check token when available.
 */
async function request(path, options = {}) {
  const headers = {
    'Accept': 'application/json',
    ...(options.headers || {})
  };

  // Attach Firebase ID token if user is signed in
  try {
    const idToken = await getIdToken(false);
    if (idToken) {
      headers['Authorization'] = `Bearer ${idToken}`;
    }
  } catch {
    // Non-fatal if token retrieval fails
  }

  // Attach App Check token if available
  try {
    const appCheckToken = await getAppCheckToken();
    if (appCheckToken) {
      headers['X-Firebase-AppCheck'] = appCheckToken;
    }
  } catch {
    // Non-fatal
  }

  let res;
  try {
    res = await fetch(path, {
      ...options,
      headers
    });
  } catch (err) {
    throw new ApiError(
      'network_error',
      'Unable to connect to the server. Please verify your connection.',
      0,
      'Ensure the server is running and reachable.'
    );
  }

  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const errorInfo = data?.error || {};
    const code = errorInfo.code || (res.status === 401 ? 'unauthorized' : res.status === 402 ? 'subscription_required' : 'http_error');
    const message = errorInfo.message || `Request failed with status ${res.status}`;
    const retryHint = errorInfo.retryHint || null;

    const err = new ApiError(code, message, res.status, retryHint);
    err.feature = errorInfo.feature;
    err.trialRemaining = errorInfo.trialRemaining;
    err.suggestedPlan = errorInfo.suggestedPlan;
    err.resetsAt = errorInfo.resetsAt;
    err.data = data;
    throw err;
  }

  return data;
}

/**
 * Pre-validation for user registration (disposable email domain check & IP rate limit)
 */
export async function checkRegisterEmail(email) {
  return await request('/api/auth/register-check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
}

/**
 * Server health check
 */
export async function fetchHealth() {
  return await request('/api/health');
}

/**
 * Current user profile, server-computed tier, and quota
 */
export async function fetchMe() {
  return await request('/api/me');
}

/**
 * Launch an Instagram scrape run
 */
export async function startScrape(payload) {
  return await request('/api/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

/**
 * Check run progress status from Apify
 */
export async function fetchRunStatus(runId) {
  return await request(`/api/runs/${encodeURIComponent(runId)}`);
}

/**
 * Abort an active scrape run
 */
export async function abortRun(runId) {
  return await request(`/api/runs/${encodeURIComponent(runId)}/abort`, {
    method: 'POST'
  });
}

/**
 * Fetch posts for a run from Firestore, filtered by user's CURRENT tier
 */
export async function fetchRunPosts(runId, { limit = 50, offset = 0, datasetId } = {}) {
  const query = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
    ...(datasetId ? { datasetId } : {})
  });
  return await request(`/api/runs/${encodeURIComponent(runId)}/posts?${query.toString()}`);
}

/**
 * Refreshes run posts when preview URLs expire or after upgrading
 */
export async function refreshRunPosts(runId, datasetId) {
  return await request(`/api/runs/${encodeURIComponent(runId)}/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ datasetId })
  });
}

/**
 * Fetch last 10 runs for the user
 */
export async function fetchUserRuns() {
  return await request('/api/runs');
}

/**
 * Delete a run and its posts
 */
export async function deleteUserRun(runId) {
  return await request(`/api/runs/${encodeURIComponent(runId)}`, {
    method: 'DELETE'
  });
}

/**
 * Initiates Razorpay recurring subscription
 */
export async function createSubscription(plan) {
  return await request('/api/billing/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan })
  });
}

/**
 * Verifies Razorpay checkout signature
 */
export async function verifySubscription(paymentData) {
  return await request('/api/billing/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paymentData)
  });
}

/**
 * Redeems a promotional code (e.g. "SAMPLE22")
 */
export async function redeemPromoCode(code) {
  return await request('/api/billing/promo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  });
}

/**
 * Cancels active subscription at period end
 */
export async function cancelSubscription() {
  return await request('/api/billing/cancel', {
    method: 'POST'
  });
}

/**
 * Deletes user account, cancels subscription, deletes data
 */
export async function deleteAccount() {
  return await request('/api/account', {
    method: 'DELETE'
  });
}

/**
 * Analyzes an Instagram profile presentation
 */
export async function analyzeProfile(username, force = false) {
  return await request(`/api/analyze${force ? '?force=true' : ''}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, force })
  });
}

/**
 * Fetches user's previous 10 profile analyses
 */
export async function fetchAnalyses() {
  return await request('/api/analyses', {
    method: 'GET'
  });
}

/**
 * Fetches a single profile analysis by ID
 */
export async function fetchAnalysisById(analysisId) {
  return await request(`/api/analyses/${encodeURIComponent(analysisId)}`, {
    method: 'GET'
  });
}

/**
 * Deletes an analysis by ID
 */
export async function deleteAnalysis(analysisId) {
  return await request(`/api/analyses/${encodeURIComponent(analysisId)}`, {
    method: 'DELETE'
  });
}
