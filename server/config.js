import dotenv from 'dotenv';
dotenv.config();

/**
 * Validates and exposes server configuration.
 * APIFY_TOKEN is validated here and fails fast if missing.
 * Secrets are strictly never printed, logged, or exposed in error messages.
 */
function validateConfig() {
  const token = process.env.APIFY_TOKEN?.trim();

  if (!token) {
    console.error('FATAL CONFIGURATION ERROR: Environment variable APIFY_TOKEN is required but was not provided.');
    console.error('Please set APIFY_TOKEN in your environment or .env file before starting the server.');
    process.exit(1);
  }

  // Parse private key formatting (replace literal \n with newlines)
  let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  return {
    apifyToken: token,
    port: parseInt(process.env.PORT, 10) || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
    appOrigin: process.env.APP_ORIGIN || 'http://localhost:5173',

    // Quotas, Trial & Concurrency
    trialSearches: Math.max(parseInt(process.env.TRIAL_SEARCHES, 10) || 1, 1),
    trialAnalyses: Math.max(parseInt(process.env.TRIAL_ANALYSES, 10) || 1, 1),
    signupsPerIpPerDay: Math.max(parseInt(process.env.SIGNUPS_PER_IP_PER_DAY, 10) || 3, 1),
    paidRunsPerDay: Math.max(parseInt(process.env.PAID_RUNS_PER_DAY, 10) || 20, 1),
    maxConcurrentRuns: Math.max(parseInt(process.env.MAX_CONCURRENT_RUNS, 10) || 3, 1),
    maxResultsPerProfile: Math.min(Math.max(parseInt(process.env.MAX_RESULTS_PER_PROFILE, 10) || 100, 1), 500),
    maxUsernamesPerRequest: Math.max(parseInt(process.env.MAX_USERNAMES_PER_REQUEST, 10) || 10, 1),
    scrapeRateLimitPerHour: Math.max(parseInt(process.env.SCRAPE_RATE_LIMIT_PER_HOUR, 10) || 10, 1),
    previewTtlHours: Math.max(parseInt(process.env.PREVIEW_TTL_HOURS, 10) || 12, 1),

    // Firebase Admin
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID?.trim() || null,
    firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL?.trim() || null,
    firebasePrivateKey: privateKey || null,
    enforceAppCheck: process.env.ENFORCE_APP_CHECK === 'true' || process.env.NODE_ENV === 'production',

    // Razorpay Billing Configuration
    razorpayKeyId: process.env.RAZORPAY_KEY_ID?.trim() || 'rzp_test_placeholder_key',
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET?.trim() || 'rzp_test_placeholder_secret',
    razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET?.trim() || 'rzp_webhook_secret_default',
    razorpayCurrency: process.env.RAZORPAY_CURRENCY?.trim() || 'INR',

    // Razorpay Plan IDs (Weekly: ₹199, Monthly: ₹499, Yearly: ₹1,299)
    razorpayPlanWeekly: process.env.RAZORPAY_PLAN_WEEKLY?.trim() || 'plan_TmehMoLNCpq83K',
    razorpayPlanMonthly: process.env.RAZORPAY_PLAN_MONTHLY?.trim() || 'plan_TmejNgNi0tA7zp',
    razorpayPlanYearly: process.env.RAZORPAY_PLAN_YEARLY?.trim() || 'plan_TmejNvGn7WC7aj',

    // Promo codes
    promoCode: process.env.PROMO_CODE?.trim().toUpperCase() || 'SAMPLE22',

    // Gemini AI Configuration (Profile Analyzer)
    geminiApiKey: process.env.GEMINI_API_KEY?.trim() || '',
    geminiModel: process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash-lite',

    // Profile Analyzer Quotas, Caching, and TTL
    analyzerRunsPerDayPaid: Math.max(parseInt(process.env.ANALYZER_RUNS_PER_DAY_PAID, 10) || 30, 1),
    analyzerCacheHours: Math.max(parseInt(process.env.ANALYZER_CACHE_HOURS, 10) || 24, 1),
    analyzerResultTtlDays: Math.max(parseInt(process.env.ANALYZER_RESULT_TTL_DAYS, 10) || 30, 1),

    // Prices in INR for display and reference
    prices: {
      weekly: { amount: 199, label: 'Weekly', interval: 'week', amountPaise: 19900 },
      monthly: { amount: 499, label: 'Monthly', interval: 'month', amountPaise: 49900 },
      yearly: { amount: 1299, label: 'Yearly', interval: 'year', amountPaise: 129900, isBestValue: true }
    }
  };
}

export const config = validateConfig();
