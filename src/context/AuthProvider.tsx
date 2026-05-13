import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { auth } from '../config/firebase';
import { getUserSubscriptions, summarizePremiumEntitlements } from '../services/subscriptionService';
import { AuthContext } from './auth-context';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [premiumPending, setPremiumPending] = useState(false);
  const [premiumRole, setPremiumRole] = useState<string | null>(null);
  const [premiumStatusLabel, setPremiumStatusLabel] = useState('Free plan');

  const refreshPremiumStatus = useCallback(async () => {
    if (!auth.currentUser) {
      setIsPremium(false);
      setPremiumPending(false);
      setPremiumRole(null);
      setPremiumStatusLabel('Free plan');
      return;
    }

    try {
      const subscriptions = await getUserSubscriptions();
      const summary = summarizePremiumEntitlements(subscriptions);
      setIsPremium(summary.isPremium);
      setPremiumPending(summary.isPending);
      setPremiumRole(summary.primaryRole);
      setPremiumStatusLabel(summary.label);
    } catch {
      setIsPremium(false);
      setPremiumPending(false);
      setPremiumRole(null);
      setPremiumStatusLabel('Subscription status unavailable');
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      setAuthError(null);

      if (nextUser) {
        await refreshPremiumStatus();
      } else {
        setIsPremium(false);
        setPremiumPending(false);
        setPremiumRole(null);
        setPremiumStatusLabel('Free plan');
      }
    });

    return unsubscribe;
  }, [refreshPremiumStatus]);

  const signIn = async (email: string, password: string) => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      await refreshPremiumStatus();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unable to sign in.');
      throw error;
    } finally {
      setAuthBusy(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      await refreshPremiumStatus();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unable to create account.');
      throw error;
    } finally {
      setAuthBusy(false);
    }
  };

  const signOutUser = async () => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      await signOut(auth);
    } finally {
      setAuthBusy(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authReady,
        authBusy,
        authError,
        isPremium,
        premiumPending,
        premiumRole,
        premiumStatusLabel,
        signIn,
        signUp,
        signOutUser,
        clearAuthError: () => setAuthError(null),
        refreshPremiumStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
