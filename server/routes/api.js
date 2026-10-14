import { Router } from 'express';
import { config } from '../config.js';
import { validateScrapeInput } from '../services/validation.js';
import {
  startActorRun,
  getRunStatus,
  abortRun,
  getDatasetItems,
  proxyMediaUrl,
  fetchInstagramProfiles
} from '../services/apifyService.js';
import { filterProfileByTier } from '../../src/shared/fieldPolicy.js';
import { PLAN_LIMITS } from '../../src/shared/planLimits.js';
import { authenticateUser, requireEmailVerified, requireAppCheck } from '../middleware/auth.js';
import { scrapeLimiter, generalLimiter, signupLimiter } from '../middleware/rateLimiter.js';
import {
  getDailyQuotaStatus,
  checkAndConsumeDailyQuota,
  refundDailyQuota,
  reserveFeatureAccess,
  refundFeatureAccess,
  getActivePaidPlan,
  getUserTrialStatus,
  saveUserRun,
  updateRunPosts,
  getRunPostsForUser,
  getUserRuns,
  deleteUserRun,
  updateUserSubscription,
  deleteUserAccount
} from '../services/userService.js';
import { evaluateSignupAbuse } from '../services/antiAbuseService.js';
import {
  createRazorpaySubscription,
  cancelRazorpaySubscription,
  verifyPaymentHandlerSignature,
  verifyWebhookSignature
} from '../services/razorpayService.js';
import analyzerRoutes from './analyzerRoutes.js';

const router = Router();

// Profile Analyzer endpoints (POST /api/analyze, GET /api/analyses, etc.)
router.use(analyzerRoutes);

/**
 * GET /api/health
 * Public health check
 * Strictly returns { ok: true } without exposing any secrets or config details
 */
router.get('/health', (req, res) => {
  res.json({ ok: true });
});

/**
 * POST /api/auth/register-check
 * Pre-validation for sign-up: enforces rate-limit by IP (SIGNUPS_PER_IP_PER_DAY),
 * blocks disposable emails, normalizes email, and verifies App Check token.
 */
router.post('/auth/register-check', signupLimiter, requireAppCheck, async (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({
        error: { code: 'email_required', message: 'Email address is required.' }
      });
    }

    const abuseResult = await evaluateSignupAbuse(email, null, req.ip, req.headers['user-agent']);
    res.json({
      ok: true,
      normalizedEmail: abuseResult.normalizedEmail,
      isDuplicateFlagged: abuseResult.isDuplicate
    });
  } catch (err) {
    if (err.code === 'disposable_email_blocked') {
      return res.status(400).json({
        error: {
          code: 'disposable_email_blocked',
          message: err.message
        }
      });
    }
    next(err);
  }
});

/**
 * GET /api/me
 * Returns current user's profile, server-computed access tier, lifetime trial status, and subscription details
 */
router.get('/me', authenticateUser, async (req, res, next) => {
  try {
    const quota = await getDailyQuotaStatus(req.user.uid, req.user.plan);
    const activePaid = getActivePaidPlan(req.user.subscription);
    const trialStatus = getUserTrialStatus(req.user.profile || req.user);
    const effectivePlan = activePaid || (trialStatus.searchesRemaining > 0 ? 'trial' : 'locked');

    res.json({
      uid: req.user.uid,
      email: req.user.email,
      emailVerified: req.user.emailVerified,
      plan: activePaid ? 'paid' : (trialStatus.searchesRemaining > 0 ? 'trial' : 'locked'),
      tier: effectivePlan,
      isPaid: Boolean(activePaid),
      subscription: req.user.subscription,
      dailyQuota: quota,
      trial: trialStatus,
      limits: PLAN_LIMITS,
      prices: config.prices
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/scrape
 * Starts an Apify actor run. Protected by Auth, Email Verification, Quota, and Rate Limiting.
 */
router.post('/scrape', scrapeLimiter, authenticateUser, requireEmailVerified, requireAppCheck, async (req, res, next) => {
  try {
    // 1. Validate and sanitize inputs server-side
    const validatedInput = validateScrapeInput(req.body);

    // 2. Pre-check profile privacy status with Apify profile actor (apify/instagram-profile-scraper)
    const profileResults = await fetchInstagramProfiles(validatedInput.targets);

    const privateProfiles = [];
    const publicUsernames = [];

    for (const target of validatedInput.targets) {
      const cleanTarget = target.toLowerCase();
      const profile = profileResults.find(p => p.username?.toLowerCase() === cleanTarget);

      if (profile && profile.isPrivate) {
        // Return a profile-only result:
        // { type: "private_profile", username, fullName, biography, profilePicUrl, followersCount, followingCount, postsCount, isPrivate: true }
        privateProfiles.push(profile);
      } else {
        publicUsernames.push(target);
      }
    }

    // PRODUCT CHOICE / RULE:
    // Private accounts do NOT count toward post-scrape quotas (FREE_RUNS_PER_DAY, PAID_RUNS_PER_DAY).
    // If all targets are private, do NOT decrement quota and do NOT call post scraper.
    if (publicUsernames.length === 0) {
      const runId = `run_priv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const userQuota = await getDailyQuotaStatus(req.user.uid, req.user.plan);

      // Save run record with private profiles only, 0 post documents
      await saveUserRun(req.user.uid, {
        runId,
        input: validatedInput,
        status: 'SUCCEEDED',
        tier: req.user.plan,
        privateProfiles,
        isPrivateOnly: true,
        completedAt: new Date().toISOString()
      });

      const filteredProfiles = privateProfiles.map(p => filterProfileByTier(p, req.user.plan));

      return res.status(200).json({
        runId,
        status: 'SUCCEEDED',
        isPrivateOnly: true,
        privateProfiles: filteredProfiles,
        posts: filteredProfiles,
        quotaRemaining: userQuota.remaining
      });
    }

    // 3. For public accounts, enforce and consume Trial or Plan Quota
    let accessResult;
    try {
      accessResult = await reserveFeatureAccess(req.user.uid, 'search');
    } catch (err) {
      if (err.code === 'subscription_required') {
        return res.status(402).json({
          error: {
            code: 'subscription_required',
            message: 'Your free trial is used. Choose a plan to keep searching and analyzing.',
            feature: 'search',
            trialRemaining: 0,
            suggestedPlan: 'weekly'
          }
        });
      }
      if (err.code === 'quota_exceeded' || err.code === 'daily_ceiling_reached') {
        return res.status(429).json({
          error: {
            code: err.code,
            message: err.message,
            resetsAt: err.resetsAt
          }
        });
      }
      throw err;
    }

    // 4. Start Apify Actor run ONLY for public usernames (never call post scraper for private ones)
    let runResult;
    try {
      runResult = await startActorRun({
        ...validatedInput,
        targets: publicUsernames
      });
    } catch (err) {
      // System failure: refund trial or quota unit
      await refundFeatureAccess(req.user.uid, 'search');
      throw err;
    }

    // 5. Save run record in Firestore with private profiles attached
    await saveUserRun(req.user.uid, {
      runId: runResult.runId,
      input: validatedInput,
      status: runResult.status,
      apifyRunId: runResult.runId,
      apifyDatasetId: runResult.datasetId,
      tier: accessResult.plan,
      privateProfiles
    });

    res.status(202).json({
      runId: runResult.runId,
      datasetId: runResult.datasetId,
      status: runResult.status,
      privateProfiles: privateProfiles.map(p => filterProfileByTier(p, accessResult.plan)),
      quotaRemaining: accessResult.remaining
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/runs/:runId
 * Returns run status from Apify and run metadata
 */
router.get('/runs/:runId', generalLimiter, authenticateUser, async (req, res, next) => {
  try {
    const { runId } = req.params;

    if (runId.startsWith('run_priv_')) {
      const runRecord = await getRunPostsForUser(req.user.uid, runId, req.user.plan);
      return res.json({
        id: runId,
        status: 'SUCCEEDED',
        isPrivateOnly: true,
        startedAt: runRecord?.run?.createdAt,
        finishedAt: runRecord?.run?.completedAt,
        datasetId: null
      });
    }

    const runStatus = await getRunStatus(runId);
    res.json(runStatus);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/runs/:runId/abort
 * Aborts an active Apify run
 */
router.post('/runs/:runId/abort', generalLimiter, authenticateUser, async (req, res, next) => {
  try {
    const { runId } = req.params;
    if (runId.startsWith('run_priv_')) {
      return res.json({ id: runId, status: 'SUCCEEDED', aborted: false });
    }
    const result = await abortRun(runId);
    await refundFeatureAccess(req.user.uid, 'search');
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/runs/:runId/posts
 * Returns posts for a run from Firestore, filtered by the user's CURRENT tier on read.
 * For private profiles, returns only the profile card.
 * Mixed searches return profile cards for private accounts and post cards for public accounts.
 */
router.get('/runs/:runId/posts', generalLimiter, authenticateUser, async (req, res, next) => {
  try {
    const { runId } = req.params;
    const { limit = 50, offset = 0, datasetId } = req.query;

    let result = await getRunPostsForUser(req.user.uid, runId, req.user.plan);

    // If public posts are not yet in Firestore, empty, or if user is now paid but cached posts lack media, hydrate from Apify dataset
    const hasMedia = (result?.posts || []).some(p => Boolean(p.displayUrl || (Array.isArray(p.images) && p.images.length > 0)));
    const needsHydration = !result?.run?.isPrivateOnly && (
      !result ||
      !result.posts ||
      result.posts.length === 0 ||
      (req.user.plan === 'paid' && !hasMedia)
    );

    if (needsHydration) {
      const targetDatasetId = datasetId || result?.run?.apifyDatasetId;
      if (targetDatasetId) {
        const apifyData = await getDatasetItems(targetDatasetId, { limit: 100, offset: 0, tier: req.user.plan });
        await updateRunPosts(req.user.uid, runId, apifyData.items, req.user.plan);
        result = await getRunPostsForUser(req.user.uid, runId, req.user.plan);
      }
    }

    const privateProfiles = result?.privateProfiles || [];
    const posts = result?.posts || [];

    // Mixed results: Profile cards for private accounts + post cards for public accounts
    const allResults = [...privateProfiles, ...posts];

    const cleanLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    const cleanOffset = Math.max(parseInt(offset, 10) || 0, 0);

    const paginated = allResults.slice(cleanOffset, cleanOffset + cleanLimit);

    res.json({
      posts: paginated,
      items: paginated,
      privateProfiles,
      totalCount: allResults.length,
      limit: cleanLimit,
      offset: cleanOffset,
      tier: req.user.plan
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/runs/:runId/refresh
 * Refetches dataset items from Apify when preview URLs expire or user upgrades
 */
router.post('/runs/:runId/refresh', generalLimiter, authenticateUser, async (req, res, next) => {
  try {
    const { runId } = req.params;
    if (runId.startsWith('run_priv_')) {
      const result = await getRunPostsForUser(req.user.uid, runId, req.user.plan);
      return res.json({
        posts: result?.privateProfiles || [],
        items: result?.privateProfiles || [],
        tier: req.user.plan,
        refreshedAt: new Date().toISOString()
      });
    }
    const { datasetId } = req.body;

    const targetDatasetId = datasetId;
    if (!targetDatasetId) {
      return res.status(400).json({ error: { code: 'validation_error', message: 'datasetId required.' } });
    }

    const apifyData = await getDatasetItems(targetDatasetId, { limit: 100, offset: 0, tier: req.user.plan });
    await updateRunPosts(req.user.uid, runId, apifyData.items, req.user.plan);

    const refreshed = await getRunPostsForUser(req.user.uid, runId, req.user.plan);
    res.json({
      ok: true,
      posts: refreshed?.posts || [],
      tier: req.user.plan
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/runs
 * Returns the user's last 10 runs
 */
router.get('/runs', generalLimiter, authenticateUser, async (req, res, next) => {
  try {
    const runs = await getUserRuns(req.user.uid);
    res.json({ runs });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/runs/:runId
 * Deletes a run and its subcollection
 */
router.delete('/runs/:runId', generalLimiter, authenticateUser, async (req, res, next) => {
  try {
    const { runId } = req.params;
    await deleteUserRun(req.user.uid, runId);
    res.json({ ok: true, deletedRunId: runId });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/billing/subscribe
 * Creates a Razorpay recurring subscription
 */
router.post('/billing/subscribe', generalLimiter, authenticateUser, requireEmailVerified, async (req, res, next) => {
  try {
    const { plan } = req.body;
    if (!plan || !['weekly', 'monthly', 'yearly'].includes(plan)) {
      return res.status(400).json({
        error: { code: 'validation_error', message: 'Valid plan ("weekly", "monthly", or "yearly") required.' }
      });
    }

    const sub = await createRazorpaySubscription(plan, req.user.uid, req.user.email);
    res.json(sub);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/billing/verify
 * Verifies Razorpay checkout handler payment signature on server
 */
router.post('/billing/verify', generalLimiter, authenticateUser, requireEmailVerified, async (req, res, next) => {
  try {
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature, plan } = req.body;

    const isValid = verifyPaymentHandlerSignature(razorpay_payment_id, razorpay_subscription_id, razorpay_signature);
    if (!isValid) {
      return res.status(400).json({
        error: { code: 'invalid_signature', message: 'Payment verification signature mismatch.' }
      });
    }

    // Calculate period end
    const now = new Date();
    const periodEnd = new Date(now);
    if (plan === 'weekly') periodEnd.setDate(now.getDate() + 7);
    else if (plan === 'yearly') periodEnd.setFullYear(now.getFullYear() + 1);
    else periodEnd.setMonth(now.getMonth() + 1);

    await updateUserSubscription(req.user.uid, {
      plan: plan || 'monthly',
      status: 'active',
      subscriptionId: razorpay_subscription_id,
      paymentId: razorpay_payment_id,
      currentPeriodEnd: periodEnd.toISOString()
    });

    res.json({ ok: true, plan: 'paid' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/billing/promo
 * Redeems a promotional code (e.g. "SAMPLE22" to unlock Annual Elite plan)
 */
router.post('/billing/promo', generalLimiter, authenticateUser, async (req, res, next) => {
  try {
    const code = (req.body?.code || '').trim().toUpperCase();

    if (!code) {
      return res.status(400).json({
        error: { code: 'invalid_code', message: 'Please enter a promo code.' }
      });
    }

    const validCodes = ['SAMPLE22'];
    if (config.promoCode) validCodes.push(config.promoCode.toUpperCase());

    if (!validCodes.includes(code)) {
      return res.status(400).json({
        error: { code: 'invalid_code', message: 'Invalid promo code. Please check and try again.' }
      });
    }

    // 1 full year access for Annual Elite plan
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setFullYear(now.getFullYear() + 1);

    await updateUserSubscription(req.user.uid, {
      plan: 'yearly',
      status: 'active',
      subscriptionId: `promo_${code}_${req.user.uid.slice(0, 8)}`,
      paymentId: 'promo_unlocked',
      currentPeriodEnd: periodEnd.toISOString(),
      promoCode: code,
      unlockedAt: now.toISOString()
    });

    res.json({
      ok: true,
      plan: 'paid',
      tier: 'yearly',
      message: `Promo code ${code} applied successfully! You now have full Annual Elite access for 1 year.`
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/billing/cancel
 * Cancels user's active subscription at period end
 */
router.post('/billing/cancel', generalLimiter, authenticateUser, async (req, res, next) => {
  try {
    const subId = req.user.subscription?.subscriptionId;
    if (!subId) {
      return res.status(400).json({
        error: { code: 'no_active_subscription', message: 'No active subscription found to cancel.' }
      });
    }

    await cancelRazorpaySubscription(subId);

    // Keep access until cycle end, mark status as cancelled
    await updateUserSubscription(req.user.uid, {
      ...req.user.subscription,
      status: 'cancelled',
      cancelAtPeriodEnd: true
    });

    res.json({
      ok: true,
      message: 'Subscription will cancel at the end of the current billing cycle.'
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/razorpay/webhook
 * Webhook handler with raw body HMAC SHA-256 signature verification
 */
router.post('/razorpay/webhook', async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = req.body instanceof Buffer ? req.body.toString('utf-8') : JSON.stringify(req.body);

  const isValid = verifyWebhookSignature(rawBody, signature);
  if (!isValid) {
    console.warn('Razorpay webhook signature verification failed.');
    return res.status(400).send('Invalid signature');
  }

  try {
    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const subEntity = payload.payload?.subscription?.entity;
    const uid = subEntity?.notes?.uid;

    if (uid && subEntity) {
      const plan = subEntity.notes?.plan || 'monthly';
      const periodEnd = subEntity.current_end
        ? new Date(subEntity.current_end * 1000).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      if (event === 'subscription.activated' || event === 'subscription.charged') {
        await updateUserSubscription(uid, {
          plan,
          status: 'active',
          subscriptionId: subEntity.id,
          currentPeriodEnd: periodEnd
        });
      } else if (event === 'subscription.pending' || event === 'subscription.halted') {
        await updateUserSubscription(uid, {
          plan,
          status: 'past_due',
          subscriptionId: subEntity.id,
          currentPeriodEnd: periodEnd
        });
      } else if (event === 'subscription.cancelled' || event === 'subscription.completed') {
        await updateUserSubscription(uid, {
          plan,
          status: 'cancelled',
          subscriptionId: subEntity.id,
          currentPeriodEnd: periodEnd
        });
      }
    }

    res.json({ status: 'ok' });
  } catch (err) {
    console.error('Error processing Razorpay webhook:', err.message);
    res.status(500).send('Webhook processing error');
  }
});

/**
 * DELETE /api/account
 * Deletes user subscription, Firestore documents, and Firebase Auth account
 */
router.delete('/account', generalLimiter, authenticateUser, async (req, res, next) => {
  try {
    const subId = req.user.subscription?.subscriptionId;
    if (subId) {
      try {
        await cancelRazorpaySubscription(subId);
      } catch (err) {
        console.warn('Failed to cancel subscription during account deletion:', err.message);
      }
    }

    await deleteUserAccount(req.user.uid);
    res.json({ ok: true, message: 'Account and associated data deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/proxy-image
 * Proxies and caches an Instagram or Apify CDN media file
 */
router.get('/proxy-image', generalLimiter, async (req, res, next) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: { code: 'validation_error', message: 'Query parameter "url" is required.' } });
    }

    const media = await proxyMediaUrl(url);
    res.set('Content-Type', media.contentType);
    res.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    res.send(media.buffer);
  } catch (err) {
    next(err);
  }
});

export default router;
