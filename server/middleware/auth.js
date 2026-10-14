import { adminAuth, adminAppCheck } from '../services/firebaseAdmin.js';
import { getOrCreateUserProfile } from '../services/userService.js';
import { config } from '../config.js';

/**
 * App Check verification middleware
 * Enforces valid Firebase App Check tokens on protected API routes
 */
export async function requireAppCheck(req, res, next) {
  if (!config.enforceAppCheck || !adminAppCheck) {
    return next();
  }

  const appCheckToken = req.headers['x-firebase-appcheck'];
  if (!appCheckToken) {
    return res.status(401).json({
      error: {
        code: 'app_check_required',
        message: 'Valid Firebase App Check token is required for this endpoint.',
        retryHint: 'Verify that reCAPTCHA v3 or App Check client initialization succeeded.'
      }
    });
  }

  try {
    const claims = await adminAppCheck.verifyToken(appCheckToken);
    req.appCheckClaims = claims;
    next();
  } catch (err) {
    return res.status(401).json({
      error: {
        code: 'app_check_invalid',
        message: 'Firebase App Check token verification failed.',
        retryHint: 'Refresh the page and re-verify the App Check token.'
      }
    });
  }
}

/**
 * Authentication middleware for protected /api routes.
 * 1. Extracts Bearer ID token from Authorization header
 * 2. Verifies token with firebase-admin verifyIdToken()
 * 3. Enforces email/password provider ONLY (rejects google, anonymous, etc. with 401)
 * 4. Loads/creates user in Firestore and calculates tier server-side
 */
export async function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        code: 'unauthorized',
        message: 'Authentication token required. Please sign in.',
        retryHint: 'Sign in with your email and password.'
      }
    });
  }

  const idToken = authHeader.split('Bearer ')[1].trim();

  // If Firebase Admin is initialized, verify token
  if (adminAuth) {
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);

      // Business Rule: Accept ONLY firebase.sign_in_provider === 'password'
      const signInProvider = decoded.firebase?.sign_in_provider;
      if (signInProvider && signInProvider !== 'password') {
        return res.status(401).json({
          error: {
            code: 'invalid_auth_provider',
            message: 'Only Email/Password authentication is permitted. Other providers are blocked.',
            retryHint: 'Sign in using your email and password.'
          }
        });
      }

      // Fetch or initialize Firestore user profile
      const userProfile = await getOrCreateUserProfile(decoded);

      req.user = {
        uid: decoded.uid,
        email: decoded.email,
        emailVerified: Boolean(decoded.email_verified),
        plan: userProfile.plan || 'free',
        subscription: userProfile.subscription || null,
        profile: userProfile
      };

      return next();
    } catch (err) {
      return res.status(401).json({
        error: {
          code: 'invalid_token',
          message: 'Authentication session expired or invalid. Please sign in again.',
          retryHint: 'Sign in again with your email and password.'
        }
      });
    }
  }

  // Development/Mock fallback if Firebase Admin is not yet configured with real service account
  try {
    // In local dev without service account, allow mock or decoded tokens
    const mockUid = idToken.startsWith('mock_') ? idToken : `user_${idToken.slice(0, 10)}`;
    const mockProfile = await getOrCreateUserProfile({
      uid: mockUid,
      email: `${mockUid}@example.com`,
      email_verified: true
    });

    req.user = {
      uid: mockUid,
      email: mockProfile.email,
      emailVerified: true,
      plan: mockProfile.plan || 'free',
      subscription: mockProfile.subscription || null,
      profile: mockProfile
    };
    return next();
  } catch (err) {
    return res.status(401).json({
      error: {
        code: 'unauthorized',
        message: 'Invalid authorization token.'
      }
    });
  }
}

/**
 * Middleware ensuring the authenticated user has verified their email address
 */
export function requireEmailVerified(req, res, next) {
  if (!req.user || !req.user.emailVerified) {
    return res.status(403).json({
      error: {
        code: 'email_not_verified',
        message: 'Email verification required. Please verify your email before proceeding.',
        retryHint: 'Check your inbox for the verification email, or tap resend in the application.'
      }
    });
  }
  next();
}
