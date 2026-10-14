import { config } from '../config.js';

export class ValidationError extends Error {
  constructor(message, retryHint = 'Verify the input fields adhere to required constraints.') {
    super(message);
    this.name = 'ValidationError';
    this.code = 'validation_error';
    this.status = 400;
    this.retryHint = retryHint;
  }
}

// Strict regex patterns
// Instagram username: letters, numbers, periods, and underscores, 1 to 30 characters
const USERNAME_REGEX = /^[a-zA-Z0-9._]{1,30}$/;

// Instagram profile URL: https://(www.)instagram.com/username/?...
const PROFILE_URL_REGEX = /^https?:\/\/(?:www\.)?instagram\.com\/([a-zA-Z0-9._]{1,30})\/?(?:\?.*)?$/i;

// Instagram post / reel / tv URL: https://(www.)instagram.com/(p|reel|tv)/CODE/?...
const POST_URL_REGEX = /^https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)\/?(?:\?.*)?$/i;

// ISO 8601 date (YYYY-MM-DD or full timestamp)
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?)?$/;

const MAX_TARGETS_LIMIT = 10;

/**
 * Validates and sanitizes a single Instagram target (username or URL)
 * Returns the sanitized string or throws a ValidationError.
 */
export function sanitizeTarget(rawInput) {
  if (typeof rawInput !== 'string') {
    throw new ValidationError('Each target entry must be a valid text string.');
  }

  const trimmed = rawInput.trim();
  if (!trimmed) {
    throw new ValidationError('Target entry cannot be empty.');
  }

  // Remove leading @ if user entered @username
  const withoutAt = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;

  // 1. Direct username
  if (USERNAME_REGEX.test(withoutAt)) {
    return withoutAt.toLowerCase();
  }

  // 2. Profile URL
  const profileMatch = trimmed.match(PROFILE_URL_REGEX);
  if (profileMatch) {
    return profileMatch[1].toLowerCase();
  }

  // 3. Direct Post / Reel URL
  if (POST_URL_REGEX.test(trimmed)) {
    // Return the clean canonical URL
    return trimmed.split('?')[0];
  }

  throw new ValidationError(
    `Invalid Instagram target: "${trimmed}". Must be a valid username (e.g. "natgeo") or a valid Instagram profile/post URL.`,
    'Remove spaces or invalid characters and ensure it matches standard Instagram formats.'
  );
}

/**
 * Validates an optional ISO date string
 */
export function validateIsoDate(dateStr) {
  if (!dateStr) return null;
  if (typeof dateStr !== 'string') {
    throw new ValidationError('Date must be a string.');
  }
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  if (!ISO_DATE_REGEX.test(trimmed)) {
    throw new ValidationError(
      `Invalid date format for "${trimmed}". Must be an ISO date (e.g. YYYY-MM-DD).`,
      'Use the date picker or format as YYYY-MM-DD.'
    );
  }

  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) {
    throw new ValidationError(`Invalid date value: "${trimmed}".`);
  }

  return trimmed;
}

/**
 * Validates and normalizes the full scrape request body
 */
export function validateScrapeInput(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('Request body must be a valid JSON object.');
  }

  const {
    targets,
    usernames,
    directUrls,
    resultsLimit,
    onlyPostsNewerThan,
    skipPinnedPosts = true,
    dataDetailLevel = 'basicData',
    downloadMedia = true
  } = body;

  // Combine targets, usernames, and directUrls into a single unified list
  const rawList = [];
  if (Array.isArray(targets)) rawList.push(...targets);
  if (Array.isArray(usernames)) rawList.push(...usernames);
  if (Array.isArray(directUrls)) rawList.push(...directUrls);
  if (typeof targets === 'string') rawList.push(targets);

  if (rawList.length === 0) {
    throw new ValidationError(
      'At least one Instagram username, profile URL, or post URL is required.',
      'Enter one or more targets in the input field.'
    );
  }

  if (rawList.length > MAX_TARGETS_LIMIT) {
    throw new ValidationError(
      `Too many targets provided (${rawList.length}). Maximum allowed is ${MAX_TARGETS_LIMIT} targets per request.`,
      `Reduce targets to ${MAX_TARGETS_LIMIT} or fewer.`
    );
  }

  // Sanitize each item and deduplicate
  const sanitizedSet = new Set();
  for (const item of rawList) {
    const sanitized = sanitizeTarget(item);
    sanitizedSet.add(sanitized);
  }

  const cleanTargets = Array.from(sanitizedSet);
  if (cleanTargets.length === 0) {
    throw new ValidationError('No valid Instagram targets found after parsing.');
  }

  // Validate resultsLimit
  let parsedLimit = 20;
  if (resultsLimit !== undefined && resultsLimit !== null) {
    const num = parseInt(resultsLimit, 10);
    if (isNaN(num) || num < 1) {
      throw new ValidationError('resultsLimit must be a positive integer.');
    }
    // Clamp to server max
    parsedLimit = Math.min(num, config.maxResultsPerProfile);
  }

  // Validate date if present
  const cleanDate = validateIsoDate(onlyPostsNewerThan);

  // Validate detail level
  const allowedDetails = ['basicData', 'detailedData'];
  const cleanDetail = allowedDetails.includes(dataDetailLevel) ? dataDetailLevel : 'basicData';

  return {
    targets: cleanTargets,
    resultsLimit: parsedLimit,
    skipPinnedPosts: Boolean(skipPinnedPosts),
    onlyPostsNewerThan: cleanDate,
    dataDetailLevel: cleanDetail,
    downloadMedia: Boolean(downloadMedia)
  };
}

/**
 * Validates and normalizes an Instagram username for Profile Analyzer.
 * Accepts "@username" or profile URL (e.g. https://instagram.com/username).
 * Enforces: 1 to 30 characters, letters, numbers, periods, and underscores only.
 */
export function validateAnalyzerUsername(rawInput) {
  if (typeof rawInput !== 'string') {
    throw new ValidationError('Username must be a valid text string.');
  }

  const trimmed = rawInput.trim();
  if (!trimmed) {
    throw new ValidationError('Please enter an Instagram username or profile URL.');
  }

  let candidate = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;

  // If input looks like a URL or contains slashes, parse the username segment
  if (candidate.includes('/') || candidate.startsWith('http://') || candidate.startsWith('https://')) {
    const match = candidate.match(PROFILE_URL_REGEX);
    if (match) {
      candidate = match[1];
    } else {
      try {
        const parsed = new URL(candidate.startsWith('http') ? candidate : `https://${candidate}`);
        const segments = parsed.pathname.split('/').filter(Boolean);
        if (segments.length > 0 && USERNAME_REGEX.test(segments[0])) {
          candidate = segments[0];
        } else {
          throw new ValidationError('Invalid Instagram profile URL format.');
        }
      } catch {
        throw new ValidationError('Invalid Instagram profile URL format.');
      }
    }
  }

  if (!USERNAME_REGEX.test(candidate)) {
    throw new ValidationError(
      'Username must be between 1 and 30 characters and contain only letters, numbers, periods, and underscores.',
      'Check the username format (e.g. "natgeo" or "@cristiano").'
    );
  }

  return candidate.toLowerCase();
}
