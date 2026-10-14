import crypto from 'crypto';
import { adminDb } from './firebaseAdmin.js';
import { config } from '../config.js';

// In-memory fallback for testing / dev when Firestore is unavailable
const memoryAnalyzerStore = {
  analyses: new Map(), // uid -> Array<AnalysisDoc>
  dailyUsage: new Map() // `${uid}_${today}` -> count
};

/**
 * Calculates SHA-256 hash of bio text to detect changes
 */
export function calculateBioHash(bio) {
  const normalized = (bio || '').trim();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

import { reserveFeatureAccess } from './userService.js';

/**
 * Checks and consumes daily quota / trial unit for the Profile Analyzer
 * Uses reserveFeatureAccess to guarantee atomic trial and plan quota reservation.
 */
export async function checkAndConsumeAnalyzerQuota(uid, plan = 'free') {
  try {
    const res = await reserveFeatureAccess(uid, 'analysis');
    return {
      allowed: true,
      used: res.used || 1,
      limit: res.limit || 1,
      remaining: res.remaining
    };
  } catch (err) {
    return {
      allowed: false,
      error: err,
      code: err.code || 'quota_exceeded',
      used: 1,
      limit: 1,
      remaining: 0
    };
  }
}

/**
 * Checks if a valid cached analysis exists for the given user and username with matching bioHash.
 * Cache TTL is ANALYZER_CACHE_HOURS (default 24h).
 */
export async function getCachedAnalysis(uid, username, bioHash) {
  const cleanUsername = String(username || '').toLowerCase();
  const maxAgeMs = config.analyzerCacheHours * 60 * 60 * 1000;
  const now = Date.now();

  if (adminDb) {
    const snapshot = await adminDb
      .collection('users')
      .doc(uid)
      .collection('analyses')
      .where('username', '==', cleanUsername)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      const ageMs = now - new Date(data.createdAt).getTime();

      if (ageMs < maxAgeMs && (!bioHash || data.bioHash === bioHash)) {
        return {
          ...data,
          analysisId: snapshot.docs[0].id,
          isCached: true
        };
      }
    }
    return null;
  }

  // In-memory fallback
  const userAnalyses = memoryAnalyzerStore.analyses.get(uid) || [];
  const match = userAnalyses.find(
    a => a.username.toLowerCase() === cleanUsername && (!bioHash || a.bioHash === bioHash)
  );

  if (match) {
    const ageMs = now - new Date(match.createdAt).getTime();
    if (ageMs < maxAgeMs) {
      return {
        ...match,
        isCached: true
      };
    }
  }

  return null;
}

/**
 * Gets the latest cached analysis for a username within ANALYZER_CACHE_HOURS regardless of bioHash
 */
export async function getLatestAnalysisForUsername(uid, username) {
  return getCachedAnalysis(uid, username, null);
}

/**
 * Saves a completed analysis to Firestore under users/{uid}/analyses/{analysisId}
 * Keeps the last 10 per user, batch-deleting older ones.
 * Sets expiresAt to 30 days after creation.
 */
export async function saveAnalysis(uid, analysisPayload) {
  const analysisId = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + config.analyzerResultTtlDays * 24 * 60 * 60 * 1000).toISOString();

  const record = {
    analysisId,
    username: (analysisPayload.username || '').toLowerCase(),
    profileSnapshot: {
      fullName: analysisPayload.profile.fullName || '',
      biography: analysisPayload.profile.biography || '',
      followersCount: analysisPayload.profile.followersCount ?? 0,
      followsCount: analysisPayload.profile.followsCount ?? 0,
      profilePicUrl: analysisPayload.profile.profilePicUrl || analysisPayload.profile.profilePicUrlHD || null,
      private: Boolean(analysisPayload.profile.private),
      verified: Boolean(analysisPayload.profile.verified),
      hasExternalLink: Boolean(analysisPayload.profile.hasExternalLink || analysisPayload.profile.externalUrl)
    },
    bioHash: analysisPayload.bioHash,
    score: analysisPayload.analysis.score,
    breakdown: analysisPayload.analysis.breakdown,
    summary: analysisPayload.analysis.summary,
    strengths: analysisPayload.analysis.strengths,
    improvements: analysisPayload.analysis.improvements,
    example_bio: analysisPayload.analysis.example_bio,
    model: analysisPayload.analysis.model || config.geminiModel,
    createdAt: now.toISOString(),
    expiresAt
  };

  if (adminDb) {
    const analysesRef = adminDb.collection('users').doc(uid).collection('analyses');
    await analysesRef.doc(analysisId).set(record);

    // Keep last 10: delete older ones
    const snap = await analysesRef.orderBy('createdAt', 'desc').get();
    if (snap.size > 10) {
      const toDelete = snap.docs.slice(10);
      const batch = adminDb.batch();
      toDelete.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }

    return record;
  }

  // In-memory fallback
  const list = memoryAnalyzerStore.analyses.get(uid) || [];
  list.unshift(record);
  memoryAnalyzerStore.analyses.set(uid, list.slice(0, 10));
  return record;
}

/**
 * Retrieves the owner's analysis by ID only.
 * Returns null if not found or belongs to another user.
 */
export async function getAnalysisById(uid, analysisId) {
  if (!uid || !analysisId) return null;

  if (adminDb) {
    const doc = await adminDb
      .collection('users')
      .doc(uid)
      .collection('analyses')
      .doc(analysisId)
      .get();

    if (!doc.exists) return null;
    return doc.data();
  }

  const list = memoryAnalyzerStore.analyses.get(uid) || [];
  const found = list.find(a => a.analysisId === analysisId);
  return found || null;
}

/**
 * Returns the user's last 10 analyses (summary projection: id, username, score, createdAt, profileSnapshot)
 */
export async function getUserAnalyses(uid) {
  if (!uid) return [];

  if (adminDb) {
    const snap = await adminDb
      .collection('users')
      .doc(uid)
      .collection('analyses')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    return snap.docs.map(d => {
      const data = d.data();
      return {
        analysisId: d.id,
        username: data.username,
        score: data.score,
        createdAt: data.createdAt,
        expiresAt: data.expiresAt,
        profilePicUrl: data.profileSnapshot?.profilePicUrl || null
      };
    });
  }

  const list = memoryAnalyzerStore.analyses.get(uid) || [];
  return list.slice(0, 10).map(data => ({
    analysisId: data.analysisId,
    username: data.username,
    score: data.score,
    createdAt: data.createdAt,
    expiresAt: data.expiresAt,
    profilePicUrl: data.profileSnapshot?.profilePicUrl || null
  }));
}

/**
 * Deletes an analysis document owned by the user
 */
export async function deleteUserAnalysis(uid, analysisId) {
  if (!uid || !analysisId) return false;

  if (adminDb) {
    const ref = adminDb.collection('users').doc(uid).collection('analyses').doc(analysisId);
    const doc = await ref.get();
    if (!doc.exists) return false;
    await ref.delete();
    return true;
  }

  const list = memoryAnalyzerStore.analyses.get(uid) || [];
  const idx = list.findIndex(a => a.analysisId === analysisId);
  if (idx !== -1) {
    list.splice(idx, 1);
    memoryAnalyzerStore.analyses.set(uid, list);
    return true;
  }
  return false;
}
