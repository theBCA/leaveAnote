import { createContext } from 'react';
import type { User } from 'firebase/auth';

export interface AuthContextValue {
  user: User | null;
  authReady: boolean;
  authBusy: boolean;
  authError: string | null;
  isPremium: boolean;
  premiumPending: boolean;
  premiumRole: string | null;
  premiumStatusLabel: string;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  clearAuthError: () => void;
  refreshPremiumStatus: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
