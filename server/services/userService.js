import { adminDb, adminAuth } from './firebaseAdmin.js';
import { config } from '../config.js';
import { filterPostByTier, filterProfileByTier } from '../../src/shared/fieldPolicy.js';
import { PLAN_LIMITS, YEARLY_SERVER_CEILING } from '../../src/shared/planLimits.js';
import {
  evaluateSignupAbuse,
  normalizeEmail,
  generateDeviceFingerprint
} from './antiAbuseService.js';

// Fallback in-memory store for development/testing if Firestore is offline
export const memoryStore = {
  users: new Map(),
  dailyUsage: new Map(),
  runs: new Map(),
  posts: new Map()
};

// Async in-memory mutex per user to serialize concurrent requests in fallback/tests
const userLocks = new Map();
export async function withUserLock(uid, fn) {
  let lock = userLocks.get(uid) || Promise.resolve();
  let release;
  const nextLock = new Promise((resolve) => { release = resolve; });
  userLocks.set(uid, lock.then(() => nextLock));
  try {
    await lock;
    return await fn();
  } finally {
    release();
    if (userLocks.get(uid) === nextLock) {
      userLocks.delete(uid);
    }
  }
}

/**
 * Returns midnight UTC ISO string for quota reset timestamps
 */
export function getMidnightUtcIso() {
  const tomorrow = new Date();
  tomorrow.setUTCHours(24, 0, 0, 0);
  return tomorrow.toISOString();
}

/**
 * Computes whether user has an active, valid paid subscription
 * Rule: status is 'active' or 'trialing', AND currentPeriodEnd is in the future
 */
export function getActivePaidPlan(subscription) {
  if (!subscription || typeof subscription !== 'object') return null;
  const isActive = subscription.status === 'active' || subscription.status === 'trialing';
  const periodEnd = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null;
  const isPeriodValid = periodEnd && periodEnd.getTime() > Date.now();
  if (isActive && isPeriodValid) {
    return subscription.plan || 'monthly';
  }
  return null;
}

/**
 * Legacy tier helper for compatibility: 'paid' if active subscription, else 'free'
 */
export function computeUserPlan(subscription) {
  return getActivePaidPlan(subscription) ? 'paid' : 'free';
}

/**
 * Computes effective access state per feature ('search' | 'analysis')
 * Never trusts client-sent values.
 */
export function getEffectiveAccessState(userData, feature = 'search') {
  const activePaid = getActivePaidPlan(userData?.subscription);
  if (activePaid) {
    return {
      plan: activePaid,
      isPaid: true,
      isTrial: false,
      isLocked: false
    };
  }

  const trial = userData?.trial || { searchesUsed: 0, analysesUsed: 0, startedAt: null };
  const used = feature === 'search' ? (trial.searchesUsed || 0) : (trial.analysesUsed || 0);
  const total = feature === 'search' ? PLAN_LIMITS.trial.searchesTotal : PLAN_LIMITS.trial.analysesTotal;

  if (used < total) {
    return {
      plan: 'trial',
      isPaid: false,
      isTrial: true,
      isLocked: false,
      remaining: total - used
    };
  }

  return {
    plan: 'locked',
    isPaid: false,
    isTrial: false,
    isLocked: true,
    remaining: 0
  };
}

/**
 * Returns trial counter status object for user
 */
export function getUserTrialStatus(userData) {
  const trial = userData?.trial || { searchesUsed: 0, analysesUsed: 0, startedAt: null };
  const searchesUsed = trial.searchesUsed || 0;
  const analysesUsed = trial.analysesUsed || 0;
  const searchesTotal = PLAN_LIMITS.trial.searchesTotal;
  const analysesTotal = PLAN_LIMITS.trial.analysesTotal;

  return {
    searchesUsed,
    searchesRemaining: Math.max(0, searchesTotal - searchesUsed),
    searchesTotal,
    analysesUsed,
    analysesRemaining: Math.max(0, analysesTotal - analysesUsed),
    analysesTotal,
    startedAt: trial.startedAt || null,
    isSearchTrialUsed: searchesUsed >= searchesTotal,
    isAnalysisTrialUsed: analysesUsed >= analysesTotal,
    isTrialExhausted: searchesUsed >= searchesTotal && analysesUsed >= analysesTotal
  };
}

/**
 * Gets or creates user profile in Firestore
 */
export async function getOrCreateUserProfile(decodedToken, clientIp = '', userAgent = '') {
  const { uid, email, email_verified } = decodedToken;
  const rawEmail = email || '';
  const normalized = normalizeEmail(rawEmail);

  if (adminDb) {
    const userRef = adminDb.collection('users').doc(uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      let abuseInfo = null;
      try {
        abuseInfo = await evaluateSignupAbuse(rawEmail, uid, clientIp, userAgent);
      } catch {
        abuseInfo = { normalizedEmail: normalized, isDuplicate: false, fingerprint: generateDeviceFingerprint(clientIp, userAgent) };
      }

      const newUser = {
        uid,
        email: rawEmail,
        normalizedEmail: normalized,
        emailVerified: Boolean(email_verified),
        plan: 'free',
        subscription: null,
        trial: {
          searchesUsed: 0,
          analysesUsed: 0,
          startedAt: null
        },
        flaggedForReview: Boolean(abuseInfo?.isDuplicate),
        deviceFingerprint: abuseInfo?.fingerprint || null,
        createdAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString()
      };
      await userRef.set(newUser);
      return newUser;
    }

    const userData = doc.data();
    const currentPlan = computeUserPlan(userData.subscription);
    const updates = {};

    if (userData.plan !== currentPlan) updates.plan = currentPlan;
    if (userData.emailVerified !== Boolean(email_verified)) updates.emailVerified = Boolean(email_verified);
    if (!userData.trial) {
      updates.trial = { searchesUsed: 0, analysesUsed: 0, startedAt: null };
    }
    if (!userData.normalizedEmail && rawEmail) {
      updates.normalizedEmail = normalized;
    }
    updates.lastSeenAt = new Date().toISOString();

    if (Object.keys(updates).length > 0) {
      await userRef.update(updates);
      Object.assign(userData, updates);
    }
    return userData;
  }

  // Fallback in-memory
  let user = memoryStore.users.get(uid);
  if (!user) {
    let abuseInfo = null;
    try {
      abuseInfo = await evaluateSignupAbuse(rawEmail, uid, clientIp, userAgent);
    } catch {
      abuseInfo = { normalizedEmail: normalized, isDuplicate: false, fingerprint: generateDeviceFingerprint(clientIp, userAgent) };
    }

    user = {
      uid,
      email: rawEmail,
      normalizedEmail: normalized,
      emailVerified: Boolean(email_verified),
      plan: 'free',
      subscription: null,
      trial: {
        searchesUsed: 0,
        analysesUsed: 0,
        startedAt: null
      },
      flaggedForReview: Boolean(abuseInfo?.isDuplicate),
      deviceFingerprint: abuseInfo?.fingerprint || null,
      createdAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString()
    };
    memoryStore.users.set(uid, user);
  } else {
    user.emailVerified = Boolean(email_verified);
    user.plan = computeUserPlan(user.subscription);
    if (!user.trial) user.trial = { searchesUsed: 0, analysesUsed: 0, startedAt: null };
    if (!user.normalizedEmail && rawEmail) user.normalizedEmail = normalized;
  }
  return user;
}

/**
 * Updates subscription details in user document
 * Subscribing does NOT reset the trial counter.
 */
export async function updateUserSubscription(uid, subscriptionData) {
  const computedPlan = computeUserPlan(subscriptionData);

  if (adminDb) {
    const userRef = adminDb.collection('users').doc(uid);
    await userRef.set({
      subscription: subscriptionData,
      plan: computedPlan,
      lastSeenAt: new Date().toISOString()
    }, { merge: true });
    return;
  }

  let user = memoryStore.users.get(uid);
  if (user) {
    user.subscription = subscriptionData;
    user.plan = computedPlan;
  } else {
    user = {
      uid,
      email: `${uid}@example.com`,
      emailVerified: true,
      plan: computedPlan,
      subscription: subscriptionData,
      trial: { searchesUsed: 0, analysesUsed: 0, startedAt: null }
    };
    memoryStore.users.set(uid, user);
  }
}

/**
 * Reserves access for a feature ('search' | 'analysis') inside a Firestore transaction.
 * Concurrency rule: Two parallel requests with one trial unit left -> exactly one succeeds.
 *
 * @param {string} uid
 * @param {'search'|'analysis'} feature
 * @returns {Promise<{ allowed: boolean, plan: string, isPaid: boolean, isTrial: boolean, remaining: number }>}
 */
export async function reserveFeatureAccess(uid, feature = 'search') {
  const isSearch = feature === 'search';
  const today = new Date().toISOString().split('T')[0];

  if (adminDb) {
    const userRef = adminDb.collection('users').doc(uid);
    const usageRef = adminDb
      .collection('users')
      .doc(uid)
      .collection(isSearch ? 'dailyUsage' : 'analyzerDailyUsage')
      .doc(today);

    return await adminDb.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        const err = new Error('User profile not found.');
        err.status = 401;
        throw err;
      }
      const userData = userDoc.data();
      const activePaidPlan = getActivePaidPlan(userData.subscription);

      if (activePaidPlan) {
        // Active paid plan: weekly, monthly, or yearly
        const usageDoc = await transaction.get(usageRef);
        const currentDailyUsed = usageDoc.exists ? (usageDoc.data().count || 0) : 0;
        const planLimitConfig = PLAN_LIMITS[activePaidPlan] || PLAN_LIMITS.monthly;
        const dailyLimit = isSearch ? planLimitConfig.searchesPerDay : planLimitConfig.analysesPerDay;

        if (dailyLimit === 'unlimited') {
          const ceiling = isSearch ? YEARLY_SERVER_CEILING.searchesPerDay : YEARLY_SERVER_CEILING.analysesPerDay;
          if (currentDailyUsed >= ceiling) {
            const err = new Error('Daily request ceiling reached. Quota resets tomorrow.');
            err.code = 'daily_ceiling_reached';
            err.status = 429;
            err.resetsAt = getMidnightUtcIso();
            throw err;
          }
        } else {
          if (currentDailyUsed >= dailyLimit) {
            const err = new Error(`Daily ${feature} quota reached (${currentDailyUsed}/${dailyLimit} runs today).`);
            err.code = 'quota_exceeded';
            err.status = 429;
            err.resetsAt = getMidnightUtcIso();
            throw err;
          }
        }

        // Increment daily usage inside transaction
        transaction.set(usageRef, {
          count: currentDailyUsed + 1,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        const remainingCount = dailyLimit === 'unlimited'
          ? 'unlimited'
          : Math.max(0, dailyLimit - (currentDailyUsed + 1));

        return {
          allowed: true,
          plan: activePaidPlan,
          isPaid: true,
          isTrial: false,
          used: currentDailyUsed + 1,
          limit: dailyLimit,
          remaining: remainingCount
        };
      }

      // Non-paid user: Lifetime Trial
      const trial = userData.trial || { searchesUsed: 0, analysesUsed: 0, startedAt: null };
      const currentTrialUsed = isSearch ? (trial.searchesUsed || 0) : (trial.analysesUsed || 0);
      const trialTotal = isSearch ? PLAN_LIMITS.trial.searchesTotal : PLAN_LIMITS.trial.analysesTotal;

      if (currentTrialUsed >= trialTotal) {
        const err = new Error('Your free trial is used. Choose a plan to keep searching and analyzing.');
        err.code = 'subscription_required';
        err.status = 402;
        err.feature = feature;
        err.trialRemaining = 0;
        err.suggestedPlan = 'weekly';
        throw err;
      }

      const updatedTrial = {
        searchesUsed: isSearch ? currentTrialUsed + 1 : (trial.searchesUsed || 0),
        analysesUsed: !isSearch ? currentTrialUsed + 1 : (trial.analysesUsed || 0),
        startedAt: trial.startedAt || new Date().toISOString()
      };

      transaction.update(userRef, {
        trial: updatedTrial,
        lastSeenAt: new Date().toISOString()
      });

      return {
        allowed: true,
        plan: 'trial',
        isPaid: false,
        isTrial: true,
        used: currentTrialUsed + 1,
        limit: trialTotal,
        remaining: Math.max(0, trialTotal - (currentTrialUsed + 1))
      };
    });
  }

  // In-memory fallback (serialized via per-user lock)
  return await withUserLock(uid, async () => {
    let user = memoryStore.users.get(uid);
    if (!user) {
      user = {
        uid,
        email: `${uid}@example.com`,
        emailVerified: true,
        plan: 'free',
        subscription: null,
        trial: { searchesUsed: 0, analysesUsed: 0, startedAt: null }
      };
      memoryStore.users.set(uid, user);
    }

    const activePaidPlan = getActivePaidPlan(user.subscription);
    if (activePaidPlan) {
      const usageKey = `${uid}_${feature}_${today}`;
      const currentDailyUsed = memoryStore.dailyUsage.get(usageKey) || 0;
      const planLimitConfig = PLAN_LIMITS[activePaidPlan] || PLAN_LIMITS.monthly;
      const dailyLimit = isSearch ? planLimitConfig.searchesPerDay : planLimitConfig.analysesPerDay;

      if (dailyLimit === 'unlimited') {
        const ceiling = isSearch ? YEARLY_SERVER_CEILING.searchesPerDay : YEARLY_SERVER_CEILING.analysesPerDay;
        if (currentDailyUsed >= ceiling) {
          const err = new Error('Daily request ceiling reached. Quota resets tomorrow.');
          err.code = 'daily_ceiling_reached';
          err.status = 429;
          err.resetsAt = getMidnightUtcIso();
          throw err;
        }
      } else {
        if (currentDailyUsed >= dailyLimit) {
          const err = new Error(`Daily ${feature} quota reached (${currentDailyUsed}/${dailyLimit} runs today).`);
          err.code = 'quota_exceeded';
          err.status = 429;
          err.resetsAt = getMidnightUtcIso();
          throw err;
        }
      }

      memoryStore.dailyUsage.set(usageKey, currentDailyUsed + 1);
      const remainingCount = dailyLimit === 'unlimited'
        ? 'unlimited'
        : Math.max(0, dailyLimit - (currentDailyUsed + 1));

      return {
        allowed: true,
        plan: activePaidPlan,
        isPaid: true,
        isTrial: false,
        used: currentDailyUsed + 1,
        limit: dailyLimit,
        remaining: remainingCount
      };
    }

    // Trial check
    const trial = user.trial || { searchesUsed: 0, analysesUsed: 0, startedAt: null };
    const currentTrialUsed = isSearch ? (trial.searchesUsed || 0) : (trial.analysesUsed || 0);
    const trialTotal = isSearch ? PLAN_LIMITS.trial.searchesTotal : PLAN_LIMITS.trial.analysesTotal;

    if (currentTrialUsed >= trialTotal) {
      const err = new Error('Your free trial is used. Choose a plan to keep searching and analyzing.');
      err.code = 'subscription_required';
      err.status = 402;
      err.feature = feature;
      err.trialRemaining = 0;
      err.suggestedPlan = 'weekly';
      throw err;
    }

    trial[isSearch ? 'searchesUsed' : 'analysesUsed'] = currentTrialUsed + 1;
    trial.startedAt = trial.startedAt || new Date().toISOString();
    user.trial = trial;

    return {
      allowed: true,
      plan: 'trial',
      isPaid: false,
      isTrial: true,
      used: currentTrialUsed + 1,
      limit: trialTotal,
      remaining: Math.max(0, trialTotal - (currentTrialUsed + 1))
    };
  });
}

/**
 * Refunds 1 trial or daily quota unit when a run fails upstream
 */
export async function refundFeatureAccess(uid, feature = 'search') {
  const isSearch = feature === 'search';
  const today = new Date().toISOString().split('T')[0];

  if (adminDb) {
    const userRef = adminDb.collection('users').doc(uid);
    const usageRef = adminDb
      .collection('users')
      .doc(uid)
      .collection(isSearch ? 'dailyUsage' : 'analyzerDailyUsage')
      .doc(today);

    return await adminDb.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) return;
      const userData = userDoc.data();
      const activePaid = getActivePaidPlan(userData.subscription);

      if (activePaid) {
        const usageDoc = await transaction.get(usageRef);
        if (usageDoc.exists) {
          const current = usageDoc.data().count || 0;
          if (current > 0) {
            transaction.update(usageRef, { count: current - 1 });
          }
        }
      } else {
        const trial = userData.trial || { searchesUsed: 0, analysesUsed: 0 };
        const key = isSearch ? 'searchesUsed' : 'analysesUsed';
        if ((trial[key] || 0) > 0) {
          trial[key] = trial[key] - 1;
          transaction.update(userRef, { trial });
        }
      }
    });
  }

  // In-memory fallback
  return await withUserLock(uid, async () => {
    const user = memoryStore.users.get(uid);
    if (!user) return;
    const activePaid = getActivePaidPlan(user.subscription);

    if (activePaid) {
      const usageKey = `${uid}_${feature}_${today}`;
      const current = memoryStore.dailyUsage.get(usageKey) || 0;
      if (current > 0) {
        memoryStore.dailyUsage.set(usageKey, current - 1);
      }
    } else {
      const trial = user.trial || { searchesUsed: 0, analysesUsed: 0 };
      const key = isSearch ? 'searchesUsed' : 'analysesUsed';
      if ((trial[key] || 0) > 0) {
        trial[key] = trial[key] - 1;
        user.trial = trial;
      }
    }
  });
}

/**
 * Backward compatibility wrappers
 */
export async function checkAndConsumeDailyQuota(uid, plan) {
  try {
    const res = await reserveFeatureAccess(uid, 'search');
    return {
      allowed: true,
      used: res.used || 1,
      limit: res.limit || 1,
      remaining: res.remaining
    };
  } catch (err) {
    if (err.code === 'subscription_required') {
      return {
        allowed: false,
        error: err,
        code: 'subscription_required',
        used: 1,
        limit: 1,
        remaining: 0
      };
    }
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

export async function refundDailyQuota(uid) {
  return await refundFeatureAccess(uid, 'search');
}

/**
 * Fetches user quota/trial status
 */
export async function getDailyQuotaStatus(uid, plan) {
  const user = adminDb
    ? (await adminDb.collection('users').doc(uid).get()).data()
    : memoryStore.users.get(uid);

  const trialStatus = getUserTrialStatus(user);
  const activePaid = getActivePaidPlan(user?.subscription);

  if (activePaid) {
    const today = new Date().toISOString().split('T')[0];
    let used = 0;
    if (adminDb) {
      const doc = await adminDb.collection('users').doc(uid).collection('dailyUsage').doc(today).get();
      used = doc.exists ? (doc.data().count || 0) : 0;
    } else {
      used = memoryStore.dailyUsage.get(`${uid}_search_${today}`) || 0;
    }
    const planLimitConfig = PLAN_LIMITS[activePaid] || PLAN_LIMITS.monthly;
    const limit = planLimitConfig.searchesPerDay;
    const remaining = limit === 'unlimited' ? 'unlimited' : Math.max(0, limit - used);

    return {
      plan: activePaid,
      isPaid: true,
      used,
      limit,
      remaining,
      trial: trialStatus
    };
  }

  return {
    plan: trialStatus.searchesRemaining > 0 ? 'trial' : 'locked',
    isPaid: false,
    used: trialStatus.searchesUsed,
    limit: trialStatus.searchesTotal,
    remaining: trialStatus.searchesRemaining,
    trial: trialStatus
  };
}

/**
 * Saves a new run and preserves only the last 10 runs per user
 */
export async function saveUserRun(uid, runData) {
  const { runId, input, status, apifyRunId, apifyDatasetId, tier, privateProfiles = [], isPrivateOnly = false, completedAt } = runData;

  const runPayload = {
    runId,
    input,
    status: status || 'RUNNING',
    apifyRunId: apifyRunId || null,
    apifyDatasetId: apifyDatasetId || null,
    tier: tier || 'free',
    isPrivateOnly: Boolean(isPrivateOnly),
    privateProfiles: privateProfiles || [],
    createdAt: new Date().toISOString(),
    completedAt: completedAt || null
  };

  if (adminDb) {
    const runsRef = adminDb.collection('users').doc(uid).collection('runs');
    await runsRef.doc(runId).set(runPayload);

    // Keep last 10: query all, sort desc by createdAt, delete older than 10
    const snapshot = await runsRef.orderBy('createdAt', 'desc').get();
    if (snapshot.size > 10) {
      const batch = adminDb.batch();
      snapshot.docs.slice(10).forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }
    return runPayload;
  }

  // In-memory fallback
  const userRuns = memoryStore.runs.get(uid) || [];
  userRuns.unshift(runPayload);
  memoryStore.runs.set(uid, userRuns.slice(0, 10));
  return runPayload;
}

/**
 * Updates an existing run with completed posts and marks it SUCCEEDED
 */
export async function updateRunPosts(uid, runId, posts, status = 'SUCCEEDED') {
  if (adminDb) {
    const runRef = adminDb.collection('users').doc(uid).collection('runs').doc(runId);
    await runRef.update({
      status,
      completedAt: new Date().toISOString(),
      postCount: posts.length
    });

    const postsColl = runRef.collection('posts');
    const batch = adminDb.batch();
    for (const post of posts) {
      const postRef = postsColl.doc(String(post.id || Math.random().toString(36).slice(2)));
      batch.set(postRef, post);
    }
    await batch.commit();
    return;
  }

  // In-memory fallback
  const userRuns = memoryStore.runs.get(uid) || [];
  const run = userRuns.find(r => r.runId === runId);
  if (run) {
    run.status = status;
    run.completedAt = new Date().toISOString();
    run.postCount = posts.length;
  }
  memoryStore.posts.set(`${uid}_${runId}`, posts);
}

/**
 * Returns user's run history (last 10 runs)
 */
export async function getUserRuns(uid) {
  if (adminDb) {
    const snapshot = await adminDb
      .collection('users')
      .doc(uid)
      .collection('runs')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    return snapshot.docs.map(doc => doc.data());
  }

  return memoryStore.runs.get(uid) || [];
}

/**
 * Retrieves a single run and its posts, applying the user's CURRENT tier field filtering
 */
export async function getRunPostsForUser(uid, runId, currentTier = 'free') {
  if (adminDb) {
    const runRef = adminDb.collection('users').doc(uid).collection('runs').doc(runId);
    const runDoc = await runRef.get();
    if (!runDoc.exists) return null;

    const runData = runDoc.data();

    // If private-only run, return the stored private profile cards
    if (runData.isPrivateOnly && Array.isArray(runData.privateProfiles)) {
      const filteredProfiles = runData.privateProfiles.map(p => filterProfileByTier(p, currentTier));
      return {
        run: runData,
        posts: [],
        privateProfiles: filteredProfiles,
        items: filteredProfiles
      };
    }

    const postsSnap = await runRef.collection('posts').get();
    const rawPosts = postsSnap.docs.map(d => d.data());

    // Apply strict field policy based on user's CURRENT tier at read-time
    const filteredPosts = rawPosts.map(p => {
      if (p.type === 'private_profile') {
        return filterProfileByTier(p, currentTier);
      }
      return filterPostByTier(p, currentTier);
    });

    const filteredPrivateProfiles = Array.isArray(runData.privateProfiles)
      ? runData.privateProfiles.map(p => filterProfileByTier(p, currentTier))
      : [];

    return {
      run: runData,
      posts: filteredPosts,
      privateProfiles: filteredPrivateProfiles,
      items: [...filteredPrivateProfiles, ...filteredPosts]
    };
  }

  // In-memory fallback
  const userRuns = memoryStore.runs.get(uid) || [];
  const run = userRuns.find(r => r.runId === runId);
  if (!run) return null;

  if (run.isPrivateOnly && Array.isArray(run.privateProfiles)) {
    const filteredProfiles = run.privateProfiles.map(p => filterProfileByTier(p, currentTier));
    return {
      run,
      posts: [],
      privateProfiles: filteredProfiles,
      items: filteredProfiles
    };
  }

  const rawPosts = memoryStore.posts.get(`${uid}_${runId}`) || [];
  const filteredPosts = rawPosts.map(p => {
    if (p.type === 'private_profile') {
      return filterProfileByTier(p, currentTier);
    }
    return filterPostByTier(p, currentTier);
  });

  const filteredPrivateProfiles = Array.isArray(run.privateProfiles)
    ? run.privateProfiles.map(p => filterProfileByTier(p, currentTier))
    : [];

  return {
    run,
    posts: filteredPosts,
    privateProfiles: filteredPrivateProfiles,
    items: [...filteredPrivateProfiles, ...filteredPosts]
  };
}

/**
 * Deletes a run and its subcollection posts from Firestore
 */
export async function deleteUserRun(uid, runId) {
  if (adminDb) {
    const runRef = adminDb.collection('users').doc(uid).collection('runs').doc(runId);
    const postsSnap = await runRef.collection('posts').get();
    const batch = adminDb.batch();
    postsSnap.forEach(pDoc => batch.delete(pDoc.ref));
    batch.delete(runRef);
    await batch.commit();
    return true;
  }

  const userRuns = memoryStore.runs.get(uid) || [];
  memoryStore.runs.set(uid, userRuns.filter(r => r.runId !== runId));
  memoryStore.posts.delete(`${uid}_${runId}`);
  return true;
}

/**
 * Complete account deletion:
 * 1. Cancels active subscription if any
 * 2. Recursively deletes all Firestore runs & posts
 * 3. Deletes user document
 * 4. Deletes Firebase Auth user
 */
export async function deleteUserAccount(uid) {
  if (adminDb) {
    // 1. Delete all runs and subcollections
    const runsSnap = await adminDb.collection('users').doc(uid).collection('runs').get();
    for (const rDoc of runsSnap.docs) {
      const postsSnap = await rDoc.ref.collection('posts').get();
      const batch = adminDb.batch();
      postsSnap.forEach(pDoc => batch.delete(pDoc.ref));
      batch.delete(rDoc.ref);
      await batch.commit();
    }

    // 2. Delete dailyUsage
    const quotaSnap = await adminDb.collection('users').doc(uid).collection('dailyUsage').get();
    const quotaBatch = adminDb.batch();
    quotaSnap.forEach(qDoc => quotaBatch.delete(qDoc.ref));
    await quotaBatch.commit();

    // 3. Delete user document
    await adminDb.collection('users').doc(uid).delete();
  }

  // 4. Delete Auth user
  if (adminAuth) {
    try {
      await adminAuth.deleteUser(uid);
    } catch (err) {
      console.warn(`Could not delete Auth user ${uid}:`, err.message);
    }
  }

  // Clear memory
  memoryStore.users.delete(uid);
  memoryStore.runs.delete(uid);
  return true;
}
