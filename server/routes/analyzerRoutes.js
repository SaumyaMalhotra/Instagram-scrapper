import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { validateAnalyzerUsername } from '../services/validation.js';
import { fetchProfileForAnalyzer, getConcurrencyStats } from '../services/apifyService.js';
import { analyzeProfileWithGemini } from '../services/geminiService.js';
import {
  calculateBioHash,
  getCachedAnalysis,
  getLatestAnalysisForUsername,
  checkAndConsumeAnalyzerQuota,
  saveAnalysis,
  getAnalysisById,
  getUserAnalyses,
  deleteUserAnalysis
} from '../services/analyzerService.js';
import { reserveFeatureAccess, refundFeatureAccess } from '../services/userService.js';

const router = Router();

/**
 * POST /api/analyze
 * Analyzes an Instagram profile presentation using apify/instagram-profile-scraper and Gemini.
 * Synchronous execution under standard request timeout.
 */
router.post('/analyze', authenticateUser, async (req, res, next) => {
  try {
    const rawUsername = req.body?.username;
    const cleanUsername = validateAnalyzerUsername(rawUsername);

    // 1. Check if a recent cached analysis exists within ANALYZER_CACHE_HOURS
    const forceRefresh = req.query?.force === 'true' || req.body?.force === true;
    if (!forceRefresh) {
      const cached = await getLatestAnalysisForUsername(req.user.uid, cleanUsername);
      if (cached) {
        return res.json({
          ok: true,
          cached: true,
          analysis: cached
        });
      }
    }

    // 2. Check global concurrency before running Apify profile actor
    const concurrency = getConcurrencyStats();
    if (concurrency.activeRunsCount >= concurrency.maxConcurrentRuns) {
      return res.status(429).json({
        error: {
          code: 'rate_limited',
          message: `Server concurrency limit reached (${concurrency.activeRunsCount}/${concurrency.maxConcurrentRuns} active runs). Please wait a few moments.`,
          retryHint: 'Wait 10-15 seconds and try again.'
        }
      });
    }

    // 3. Fetch profile metadata from Apify (strictly stripped of all posts/tagged/related)
    const profile = await fetchProfileForAnalyzer(cleanUsername);
    const bioHash = calculateBioHash(profile.biography);

    // 4. If an analysis with the exact same bioHash already exists within cache TTL, return it (free of quota)
    const exactCached = await getCachedAnalysis(req.user.uid, cleanUsername, bioHash);
    if (exactCached && !forceRefresh) {
      return res.json({
        ok: true,
        cached: true,
        analysis: exactCached
      });
    }

    // 5. Check and reserve trial unit or paid plan quota
    let accessResult;
    try {
      accessResult = await reserveFeatureAccess(req.user.uid, 'analysis');
    } catch (err) {
      if (err.code === 'subscription_required') {
        return res.status(402).json({
          error: {
            code: 'subscription_required',
            message: 'Your free trial is used. Choose a plan to keep searching and analyzing.',
            feature: 'analysis',
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

    // 6. Call Gemini to perform structured scoring and feedback (refunds trial on system error)
    let analysisOutput;
    try {
      analysisOutput = await analyzeProfileWithGemini(profile);
    } catch (err) {
      await refundFeatureAccess(req.user.uid, 'analysis');
      throw err;
    }

    // 7. Save to Firestore under users/{uid}/analyses/{analysisId} (keeps last 10, sets 30-day TTL)
    const saved = await saveAnalysis(req.user.uid, {
      username: cleanUsername,
      profile,
      bioHash,
      analysis: analysisOutput
    });

    return res.json({
      ok: true,
      cached: false,
      analysis: saved,
      remainingQuota: accessResult.remaining
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/analyses
 * Returns user's last 10 profile analyses
 */
router.get('/analyses', authenticateUser, async (req, res, next) => {
  try {
    const analyses = await getUserAnalyses(req.user.uid);
    res.json({
      ok: true,
      analyses
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/analyses/:analysisId
 * Returns the owner's analysis only. 404 for anyone else.
 */
router.get('/analyses/:analysisId', authenticateUser, async (req, res, next) => {
  try {
    const { analysisId } = req.params;
    const analysis = await getAnalysisById(req.user.uid, analysisId);

    if (!analysis) {
      return res.status(404).json({
        error: {
          code: 'not_found',
          message: 'Analysis record not found or you do not have permission to access it.'
        }
      });
    }

    res.json({
      ok: true,
      analysis
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/analyses/:analysisId
 * Deletes an analysis record owned by the user
 */
router.delete('/analyses/:analysisId', authenticateUser, async (req, res, next) => {
  try {
    const { analysisId } = req.params;
    const deleted = await deleteUserAnalysis(req.user.uid, analysisId);

    if (!deleted) {
      return res.status(404).json({
        error: {
          code: 'not_found',
          message: 'Analysis record not found.'
        }
      });
    }

    res.json({
      ok: true,
      deleted: true
    });
  } catch (err) {
    next(err);
  }
});

export default router;
