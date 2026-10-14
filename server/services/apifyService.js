import { config } from '../config.js';
import { FREE_FIELDS, PAID_FIELDS, filterPostByTier } from '../../src/shared/fieldPolicy.js';

const APIFY_BASE_URL = 'https://api.apify.com/v2';
const ACTOR_ID = 'apify~instagram-post-scraper';

// Track currently active scraping run IDs for global concurrency limiting
const activeRuns = new Set();

/**
 * Standardized custom error for Apify proxy operations
 */
export class ApifyProxyError extends Error {
  constructor(code, message, status = 500, retryHint = null) {
    super(message);
    this.name = 'ApifyProxyError';
    this.code = code;
    this.status = status;
    this.retryHint = retryHint;
  }
}

/**
 * Cleanly maps Apify HTTP response or fetch error to ApifyProxyError
 * Ensures APIFY_TOKEN is never mentioned or exposed.
 */
function handleApifyHttpError(resStatus, responseData = {}) {
  const upstreamMsg = responseData?.error?.message || responseData?.message || '';

  if (resStatus === 401 || resStatus === 403) {
    return new ApifyProxyError(
      'invalid_token',
      'Apify authentication failed. The server token may be invalid, revoked, or lacking permissions.',
      401,
      'Contact the administrator to check the server APIFY_TOKEN configuration.'
    );
  }

  if (resStatus === 429) {
    return new ApifyProxyError(
      'rate_limited',
      'Apify API rate limit exceeded or usage quota reached.',
      429,
      'Please wait a few moments before trying again.'
    );
  }

  if (resStatus === 404) {
    return new ApifyProxyError(
      'not_found',
      'The requested Apify run, actor, or dataset was not found.',
      404,
      'Check the run ID or dataset ID.'
    );
  }

  if (resStatus >= 500) {
    return new ApifyProxyError(
      'upstream_unavailable',
      'Apify service is currently experiencing issues or is unreachable.',
      502,
      'Please retry in a couple of minutes.'
    );
  }

  return new ApifyProxyError(
    'upstream_error',
    upstreamMsg || `Apify upstream returned status ${resStatus}.`,
    resStatus || 500,
    'Please verify your request parameters.'
  );
}

/**
 * Executes an HTTP call to the Apify API with Bearer token authentication
 */
async function callApify(endpoint, options = {}) {
  const url = `${APIFY_BASE_URL}${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${config.apifyToken}`,
    'Accept': 'application/json',
    ...(options.headers || {})
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers
    });

    if (!res.ok) {
      let data = {};
      try {
        data = await res.json();
      } catch {
        // Ignored if body is not JSON
      }
      throw handleApifyHttpError(res.status, data);
    }

    return await res.json();
  } catch (err) {
    if (err instanceof ApifyProxyError) {
      throw err;
    }
    // Network or DNS failure
    throw new ApifyProxyError(
      'upstream_unavailable',
      'Failed to establish network connection to Apify API.',
      503,
      'Verify your internet connection and try again.'
    );
  }
}

const PROFILE_ACTOR_ID = 'apify~instagram-profile-scraper';

/**
 * Fetches profile metadata for a list of usernames using apify/instagram-profile-scraper.
 * Called prior to any post scrape to inspect privacy status.
 * @param {string[]} usernames - Array of cleaned Instagram usernames
 * @returns {Promise<Array<Object>>} Standardized profile objects
 */
export async function fetchInstagramProfiles(usernames = []) {
  if (!Array.isArray(usernames) || usernames.length === 0) {
    return [];
  }

  const cleanUsernames = usernames.map(u => String(u).trim().replace(/^@/, '')).filter(Boolean);
  if (cleanUsernames.length === 0) return [];

  try {
    const rawItems = await callApify(`/acts/${PROFILE_ACTOR_ID}/run-sync-get-dataset-items?timeout=60`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        usernames: cleanUsernames
      })
    });

    const items = Array.isArray(rawItems) ? rawItems : [];

    return items.map(item => ({
      type: 'private_profile',
      username: item.username || item.input || '',
      fullName: item.fullName || '',
      biography: item.biography || '',
      profilePicUrl: item.profilePicUrl || item.profilePicUrlHD || null,
      followersCount: item.followersCount ?? 0,
      followingCount: item.followsCount ?? item.followingCount ?? 0,
      postsCount: item.postsCount ?? 0,
      isPrivate: Boolean(item.isPrivate)
    }));
  } catch (err) {
    console.warn('[Apify] Profile pre-check warning:', err.message);
    return [];
  }
}

/**
 * Fetches profile data for Profile Analyzer using apify/instagram-profile-scraper.
 * Server keeps strictly: username, fullName, biography, followersCount, followsCount,
 * profilePicUrlHD (fallback to profilePicUrl), private, verified, externalUrl.
 * Explicitly drops all posts, relatedProfiles, taggedUsers, or IGTV videos.
 */
export async function fetchProfileForAnalyzer(username) {
  const cleanUsername = String(username || '').trim().replace(/^@/, '');
  if (!cleanUsername) {
    throw new ApifyProxyError('validation_error', 'Instagram username is required.', 400);
  }

  // Call apify/instagram-profile-scraper synchronously
  const rawItems = await callApify(`/acts/${PROFILE_ACTOR_ID}/run-sync-get-dataset-items?timeout=45`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      usernames: [cleanUsername],
      includeAboutSection: false
    })
  });

  const items = Array.isArray(rawItems) ? rawItems : [];
  const profileItem = items.find(
    it => (it.username || it.input || '').toLowerCase() === cleanUsername.toLowerCase()
  ) || items[0];

  if (!profileItem) {
    throw new ApifyProxyError(
      'profile_not_found',
      `Instagram profile "@${cleanUsername}" was not found or is currently inaccessible.`,
      404,
      'Check the username spelling or verify that the profile is active on Instagram.'
    );
  }

  // Pick only the allowed profile fields and drop everything else
  const profilePic = profileItem.profilePicUrlHD || profileItem.profilePicUrl || null;
  const externalLink = profileItem.externalUrl || profileItem.external_url || null;

  return {
    username: profileItem.username || cleanUsername,
    fullName: profileItem.fullName || '',
    biography: profileItem.biography || '',
    followersCount: Number(profileItem.followersCount ?? 0),
    followsCount: Number(profileItem.followsCount ?? profileItem.followingCount ?? 0),
    profilePicUrl: profilePic,
    profilePicUrlHD: profilePic,
    private: Boolean(profileItem.isPrivate ?? profileItem.private),
    verified: Boolean(profileItem.verified ?? profileItem.isVerified),
    externalUrl: externalLink,
    hasExternalLink: Boolean(externalLink)
  };
}

/**
 * Start an actor run for apify/instagram-post-scraper
 */
export async function startActorRun(params) {
  // Concurrency check
  if (activeRuns.size >= config.maxConcurrentRuns) {
    throw new ApifyProxyError(
      'rate_limited',
      `Server concurrency limit reached (${activeRuns.size}/${config.maxConcurrentRuns} active runs). Please wait for ongoing runs to finish.`,
      429,
      'Try again in a few moments once active runs complete.'
    );
  }

  // Construct Actor input payload based on apify/instagram-post-scraper schema
  // Business rule: Turn off media download option; previews and links only
  const actorInput = {
    username: params.targets,
    resultsLimit: params.resultsLimit,
    skipPinnedPosts: params.skipPinnedPosts,
    downloadMedia: false,
    ...(params.onlyPostsNewerThan ? { onlyPostsNewerThan: params.onlyPostsNewerThan } : {}),
    ...(params.onlyPostsOlderThan ? { onlyPostsOlderThan: params.onlyPostsOlderThan } : {}),
    ...(params.dataDetailLevel ? { dataDetailLevel: params.dataDetailLevel } : {})
  };

  const response = await callApify(`/acts/${ACTOR_ID}/runs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(actorInput)
  });

  const runData = response.data;
  if (!runData?.id) {
    throw new ApifyProxyError(
      'actor_failed',
      'Failed to initiate actor run on Apify.',
      500,
      'Please try again.'
    );
  }

  // Track active run
  activeRuns.add(runData.id);

  return {
    runId: runData.id,
    datasetId: runData.defaultDatasetId,
    status: runData.status,
    startedAt: runData.startedAt,
    actorId: runData.actId
  };
}

/**
 * Get run status and metadata
 */
export async function getRunStatus(runId) {
  if (!runId || typeof runId !== 'string') {
    throw new ApifyProxyError('validation_error', 'Valid run ID is required.', 400);
  }

  const response = await callApify(`/actor-runs/${encodeURIComponent(runId)}`, {
    method: 'GET'
  });

  const run = response.data;
  if (!run) {
    throw new ApifyProxyError('not_found', `Run "${runId}" not found.`, 404);
  }

  // If run is finished, remove from active tracker
  const terminalStatuses = ['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT'];
  if (terminalStatuses.includes(run.status)) {
    activeRuns.delete(runId);
  }

  // Error mappings if run ended unsuccessfully
  let mappedStatus = run.status;
  let statusMessage = null;

  if (run.status === 'TIMED-OUT') {
    statusMessage = 'Actor run timed out before completion.';
  } else if (run.status === 'FAILED') {
    statusMessage = run.statusMessage || 'Actor run failed on Apify.';
  } else if (run.status === 'ABORTED') {
    statusMessage = 'Actor run was cancelled/aborted.';
  }

  return {
    id: run.id,
    status: mappedStatus,
    statusMessage,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    datasetId: run.defaultDatasetId,
    durationMs: run.finishedAt && run.startedAt
      ? new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()
      : null,
    stats: {
      computeUnits: run.stats?.computeUnits ?? 0,
      resurrectCount: run.stats?.resurrectCount ?? 0
    }
  };
}

/**
 * Abort an active run
 */
export async function abortRun(runId) {
  if (!runId || typeof runId !== 'string') {
    throw new ApifyProxyError('validation_error', 'Valid run ID is required.', 400);
  }

  const response = await callApify(`/actor-runs/${encodeURIComponent(runId)}/abort`, {
    method: 'POST'
  });

  activeRuns.delete(runId);

  return {
    id: response.data?.id || runId,
    status: response.data?.status || 'ABORTED',
    aborted: true
  };
}

/**
 * Fetch dataset items with tier-based field projection and pagination
 */
export async function getDatasetItems(datasetId, { limit = 50, offset = 0, tier = 'free' } = {}) {
  if (!datasetId || typeof datasetId !== 'string') {
    throw new ApifyProxyError('validation_error', 'Valid dataset ID is required.', 400);
  }

  const cleanLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
  const cleanOffset = Math.max(parseInt(offset, 10) || 0, 0);

  // Business rule: request allowed tier fields and media aliases from Apify dataset
  const allowedFields = tier === 'paid' ? PAID_FIELDS : FREE_FIELDS;
  const extraFields = tier === 'paid'
    ? ['display_url', 'thumbnailUrl', 'thumbnail_src', 'thumbnail', 'type', '__typename']
    : [];
  const requestedFields = [...new Set([...allowedFields, ...extraFields, 'id', 'shortCode', 'url'])].join(',');

  const query = new URLSearchParams({
    limit: cleanLimit.toString(),
    offset: cleanOffset.toString(),
    clean: 'true',
    fields: requestedFields
  });

  const rawItems = await callApify(`/datasets/${encodeURIComponent(datasetId)}/items?${query.toString()}`, {
    method: 'GET'
  });

  const itemsList = Array.isArray(rawItems) ? rawItems : [];

  // Second check: strictly strip any extra keys on the server according to fieldPolicy
  const sanitizedItems = itemsList.map(item => filterPostByTier(item, tier));

  return {
    items: sanitizedItems,
    limit: cleanLimit,
    offset: cleanOffset,
    count: sanitizedItems.length,
    tier
  };
}

/**
 * Returns current server concurrency stats
 */
export function getConcurrencyStats() {
  return {
    activeRunsCount: activeRuns.size,
    maxConcurrentRuns: config.maxConcurrentRuns
  };
}

// In-memory bounded cache for proxied media
const mediaCache = new Map();
const MAX_MEDIA_CACHE_SIZE = 150;

function setMediaCache(key, value) {
  if (mediaCache.size >= MAX_MEDIA_CACHE_SIZE) {
    const oldestKey = mediaCache.keys().next().value;
    mediaCache.delete(oldestKey);
  }
  mediaCache.set(key, value);
}

/**
 * Validates whether a target hostname is permitted for media proxying (SSRF protection)
 */
function isAllowedMediaHost(hostname) {
  if (!hostname) return false;
  const host = hostname.toLowerCase();
  return (
    host.endsWith('cdninstagram.com') ||
    host.endsWith('fbcdn.net') ||
    host.endsWith('instagram.com') ||
    host.endsWith('apify.com') ||
    host.endsWith('apifyusercontent.com') ||
    host.includes('cdninstagram') ||
    host.includes('fbcdn')
  );
}

/**
 * Proxies and caches a remote media URL (from Instagram CDN or Apify storage)
 * Sends Referer and User-Agent to prevent 403 Forbidden on signed URLs.
 */
export async function proxyMediaUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new ApifyProxyError('validation_error', 'Invalid media URL provided.', 400);
  }

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new ApifyProxyError('validation_error', 'Malformed media URL.', 400);
  }

  if (parsed.protocol !== 'https:') {
    throw new ApifyProxyError('validation_error', 'Only HTTPS media URLs are allowed.', 400);
  }

  if (!isAllowedMediaHost(parsed.hostname)) {
    throw new ApifyProxyError('validation_error', `Host "${parsed.hostname}" is not permitted for media proxying.`, 403);
  }

  // Check cache
  const cacheKey = parsed.href;
  const cached = mediaCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 1000 * 60 * 60 * 24) { // 24hr TTL
    return {
      buffer: cached.buffer,
      contentType: cached.contentType,
      isCached: true
    };
  }

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
  };

  // If fetching from Apify key-value store or API, include token
  if (parsed.hostname.endsWith('apify.com')) {
    headers['Authorization'] = `Bearer ${config.apifyToken}`;
  } else {
    // If fetching from Instagram CDN, supply Instagram referer to avoid 403 anti-hotlink block
    headers['Referer'] = 'https://www.instagram.com/';
  }

  try {
    const res = await fetch(parsed.href, { headers });
    if (!res.ok) {
      throw new ApifyProxyError('upstream_error', `Failed to retrieve media (status ${res.status}).`, res.status);
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Cache valid media
    setMediaCache(cacheKey, {
      buffer,
      contentType,
      timestamp: Date.now()
    });

    return {
      buffer,
      contentType,
      isCached: false
    };
  } catch (err) {
    if (err instanceof ApifyProxyError) throw err;
    throw new ApifyProxyError('upstream_unavailable', 'Could not connect to media host.', 502);
  }
}

/**
 * Proxies a Key-Value Store media record from Apify directly
 */
export async function getKeyValueStoreMedia(storeId, recordKey) {
  if (!storeId || !recordKey) {
    throw new ApifyProxyError('validation_error', 'Store ID and Record Key are required.', 400);
  }

  const kvsUrl = `${APIFY_BASE_URL}/key-value-stores/${encodeURIComponent(storeId)}/records/${encodeURIComponent(recordKey)}`;
  return await proxyMediaUrl(kvsUrl);
}

