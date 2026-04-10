import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";

import { getSupabaseClient } from "@/modules/supabase/client";
import {
  fetchMembershipStatus,
  getEffectiveMembershipState,
  type MembershipStatus,
} from "@/modules/membership/api/fetchMembershipStatus";

export type AuthContextValue = {
  isReady: boolean;
  isAuthenticated: boolean;
  session: Session | null;
  membership: MembershipStatus | null;
  refreshMembership: () => Promise<MembershipStatus | null>;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [membership, setMembership] = useState<MembershipStatus | null>(null);

  const refreshMembership = useCallback(async () => {
    try {
      const nextMembership = await fetchMembershipStatus();
      const effectiveMembership = getEffectiveMembershipState(nextMembership);
      setMembership(effectiveMembership);
      return effectiveMembership;
    } catch {
      const fallback = getEffectiveMembershipState(null);
      setMembership(fallback);
      return fallback;
    }
  }, []);

  useEffect(() => {
    const supabase = getSupabaseClient();

    void supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session ?? null);
      if (data.session) {
        await refreshMembership();
      } else {
        setMembership(getEffectiveMembershipState(null));
      }
      setIsReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) {
        void refreshMembership();
      } else {
        setMembership(getEffectiveMembershipState(null));
      }
      setIsReady(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshMembership]);

  const signIn = useCallback(async () => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    setSession(data.session ?? null);
    await refreshMembership();
  }, [refreshMembership]);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    setSession(null);
    setMembership(getEffectiveMembershipState(null));
  }, []);

  const value = useMemo(
    () => ({
      isReady,
      isAuthenticated: Boolean(session),
      session,
      membership,
      refreshMembership,
      signIn,
      signOut,
    }),
    [isReady, membership, refreshMembership, session, signIn, signOut],
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
