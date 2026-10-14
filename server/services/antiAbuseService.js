import crypto from 'crypto';
import { adminDb } from './firebaseAdmin.js';

export const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  'temp-mail.org',
  'temp-mail.io',
  '10minutemail.com',
  '10minutemail.net',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'throwawaymail.com',
  'sharklasers.com',
  'getairmail.com',
  'dispostable.com',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'fakeinbox.com',
  'trashmail.com',
  'trashmail.net',
  'generator.email',
  'burnermail.io',
  'maildrop.cc'
]);

/**
 * In-memory map of normalized emails for development/testing when Firestore is not connected
 */
export const memoryNormalizedEmails = new Map();

/**
 * Normalizes email:
 * - Lowercase and trims
 * - For Gmail/Googlemail: removes all '.' in username, strips everything after '+'
 * - For other domains: strips '+' alias tags
 *
 * @param {string} email
 * @returns {string} Normalized email address
 */
export function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return '';
  const trimmed = email.trim().toLowerCase();
  const parts = trimmed.split('@');
  if (parts.length !== 2) return trimmed;

  let [local, domain] = parts;

  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    domain = 'gmail.com';
    local = local.replace(/\./g, '');
    const plusIdx = local.indexOf('+');
    if (plusIdx !== -1) {
      local = local.substring(0, plusIdx);
    }
  } else {
    const plusIdx = local.indexOf('+');
    if (plusIdx !== -1) {
      local = local.substring(0, plusIdx);
    }
  }

  return `${local}@${domain}`;
}

/**
 * Checks whether an email domain is in the known disposable list
 * @param {string} email
 * @returns {boolean} True if disposable domain
 */
export function isDisposableEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2) return false;
  const domain = parts[1];
  return DISPOSABLE_EMAIL_DOMAINS.has(domain);
}

/**
 * Generates SHA-256 fingerprint from client IP and User-Agent
 * @param {string} ip
 * @param {string} userAgent
 * @returns {string} Hex hash string
 */
export function generateDeviceFingerprint(ip = '', userAgent = '') {
  return crypto.createHash('sha256').update(`${ip}::${userAgent}`).digest('hex');
}

/**
 * Validates signup email for disposable domains and duplicate normalized accounts
 * @param {string} email
 * @param {string} uid
 * @param {string} [ip]
 * @param {string} [userAgent]
 * @returns {Promise<{ normalizedEmail: string, isDisposable: boolean, isDuplicate: boolean, fingerprint: string }>}
 */
export async function evaluateSignupAbuse(email, uid, ip = '', userAgent = '') {
  const normalized = normalizeEmail(email);
  const disposable = isDisposableEmail(email);

  if (disposable) {
    const err = new Error('Disposable email addresses are not permitted. Please use a valid email address.');
    err.code = 'disposable_email_blocked';
    err.status = 400;
    throw err;
  }

  const fingerprint = generateDeviceFingerprint(ip, userAgent);
  let isDuplicate = false;

  if (adminDb) {
    try {
      const snap = await adminDb.collection('users').where('normalizedEmail', '==', normalized).limit(2).get();
      if (!snap.empty) {
        // If an account with different uid exists with this normalized email, flag it
        for (const doc of snap.docs) {
          if (doc.id !== uid) {
            isDuplicate = true;
            break;
          }
        }
      }
    } catch {
      // In-memory fallback on query error
      if (memoryNormalizedEmails.has(normalized) && memoryNormalizedEmails.get(normalized) !== uid) {
        isDuplicate = true;
      }
    }
  } else {
    if (memoryNormalizedEmails.has(normalized) && memoryNormalizedEmails.get(normalized) !== uid) {
      isDuplicate = true;
    }
  }

  if (uid) {
    memoryNormalizedEmails.set(normalized, uid);
  }

  return {
    normalizedEmail: normalized,
    isDisposable: false,
    isDuplicate,
    fingerprint
  };
}
