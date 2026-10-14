import rateLimit from 'express-rate-limit';
import { config } from '../config.js';

/**
 * Stricter rate limiter for POST /api/scrape
 * Default: config.scrapeRateLimitPerHour per IP per 1 hour window
 */
export const scrapeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: config.scrapeRateLimitPerHour,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'rate_limited',
      message: `Hourly scraping limit reached (${config.scrapeRateLimitPerHour} scrape requests per hour per IP).`,
      retryHint: 'Please wait an hour before launching more scrape tasks.'
    }
  }
});

/**
 * General read rate limiter for status polling and dataset fetching
 * 120 requests per minute per IP
 */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'rate_limited',
      message: 'Too many requests. Please slow down polling.',
      retryHint: 'Wait a few seconds before sending another request.'
    }
  }
});

/**
 * Signup rate limiter: limits new registrations per IP per 24h day
 * Default: config.signupsPerIpPerDay (3)
 */
export const signupLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: config.signupsPerIpPerDay,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'signup_rate_limited',
      message: `Daily sign-up limit reached (${config.signupsPerIpPerDay} accounts per day per IP address).`,
      retryHint: 'Only 3 new signups per IP address are allowed per day to prevent abuse.'
    }
  }
});

