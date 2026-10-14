import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged
} from 'firebase/auth';
import { initializeAppCheck, ReCaptchaV3Provider, getToken } from 'firebase/app-check';

// Client Firebase configuration from Vite environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoKeyNotForProduction',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'instascrape-demo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'instascrape-demo',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'instascrape-demo.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1234567890:web:abcdef123456'
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Auth
export const auth = getAuth(app);

// Initialize App Check (reCAPTCHA v3) if site key configured
let appCheck = null;
if (typeof window !== 'undefined' && import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
  try {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true
    });
  } catch (err) {
    console.warn('App Check initialization failed or skipped:', err.message);
  }
}

/**
 * Gets current App Check token if available
 */
export async function getAppCheckToken() {
  if (!appCheck) return null;
  try {
    const result = await getToken(appCheck, false);
    return result.token;
  } catch {
    return null;
  }
}

/**
 * Sign up with Email and Password
 * Automatically sends verification email
 */
export async function registerWithEmail(email, password) {
  if (!email || !password) throw new Error('Email and password are required.');
  if (password.length < 8) throw new Error('Password must be at least 8 characters long.');

  const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (userCredential.user) {
    try {
      await sendEmailVerification(userCredential.user);
    } catch (err) {
      console.warn('Failed to send verification email automatically:', err.message);
    }
  }
  return userCredential.user;
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail() {
  if (!auth.currentUser) throw new Error('No signed-in user found.');
  await sendEmailVerification(auth.currentUser);
}

/**
 * Sign in with Email and Password
 */
export async function loginWithEmail(email, password) {
  if (!email || !password) throw new Error('Email and password are required.');
  const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
  return userCredential.user;
}

/**
 * Send password reset email
 */
export async function resetPassword(email) {
  if (!email) throw new Error('Email is required.');
  await sendPasswordResetEmail(auth, email.trim());
}

/**
 * Sign out user
 */
export async function logoutUser() {
  await signOut(auth);
}

/**
 * Change password
 */
export async function changeUserPassword(oldPassword, newPassword) {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('User not authenticated.');
  if (newPassword.length < 8) throw new Error('New password must be at least 8 characters long.');

  // Re-authenticate
  const credential = EmailAuthProvider.credential(user.email, oldPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}

/**
 * Gets Firebase ID token for Authorization header
 */
export async function getIdToken(forceRefresh = false) {
  const user = auth.currentUser;
  if (!user) return null;
  return await user.getIdToken(forceRefresh);
}

export { onAuthStateChanged };
