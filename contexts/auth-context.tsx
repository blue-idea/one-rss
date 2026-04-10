import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  AUTH_SESSION_STORAGE_KEY,
  MEMBERSHIP_STORAGE_KEY,
} from "@/constants/auth";

const SESSION_VALUE = "1";

export type MembershipTier = "free" | "premium";

export type MembershipStatus = "active" | "expired" | "canceled" | "pending";

export type Membership = {
  tier: MembershipTier;
  status: MembershipStatus;
};

export type AuthContextValue = {
  isReady: boolean;
  isAuthenticated: boolean;
  membership: Membership;
  isPremium: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  updateMembership: (membership: Membership) => Promise<void>;
};

const defaultMembership: Membership = {
  tier: "free",
  status: "active",
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [membership, setMembership] = useState<Membership>(defaultMembership);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(AUTH_SESSION_STORAGE_KEY);
        if (!cancelled) {
          setIsAuthenticated(stored === SESSION_VALUE);
        }
      } finally {
        if (!cancelled) {
          setIsReady(true);
        }
      }
    })();
    // Load membership
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(MEMBERSHIP_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Membership;
          setMembership(parsed);
        }
      } catch {
        // Ignore parse errors
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async () => {
    await AsyncStorage.setItem(AUTH_SESSION_STORAGE_KEY, SESSION_VALUE);
    setIsAuthenticated(true);
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    setIsAuthenticated(false);
    setMembership(defaultMembership);
  }, []);

  const updateMembership = useCallback(async (newMembership: Membership) => {
    await AsyncStorage.setItem(
      MEMBERSHIP_STORAGE_KEY,
      JSON.stringify(newMembership),
    );
    setMembership(newMembership);
  }, []);

  const isPremium = useMemo(
    () => membership.tier === "premium" && membership.status === "active",
    [membership],
  );

  const value = useMemo(
    () => ({
      isReady,
      isAuthenticated,
      membership,
      isPremium,
      signIn,
      signOut,
      updateMembership,
    }),
    [
      isAuthenticated,
      isReady,
      membership,
      isPremium,
      signIn,
      signOut,
      updateMembership,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth 必须在 AuthProvider 内使用");
  }
  return ctx;
}
