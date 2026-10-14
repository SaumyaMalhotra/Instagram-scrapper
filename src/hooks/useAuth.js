import { useState, useEffect } from 'react';
import {
  auth,
  onAuthStateChanged,
  registerWithEmail,
  loginWithEmail,
  logoutUser,
  resetPassword,
  resendVerificationEmail,
  changeUserPassword
} from '../services/firebase.js';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const refreshUser = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setUser({ ...auth.currentUser });
    }
  };

  return {
    user,
    loading,
    isAuthenticated: Boolean(user),
    isEmailVerified: Boolean(user?.emailVerified),
    email: user?.email || '',
    uid: user?.uid || null,
    register: registerWithEmail,
    login: loginWithEmail,
    logout: logoutUser,
    sendPasswordReset: resetPassword,
    resendVerification: resendVerificationEmail,
    changePassword: changeUserPassword,
    refreshUser
  };
}
