"use client";

/**
 * Authentication session.
 *
 * The access token lives in memory only; the refresh token is an HTTP-only
 * cookie the browser sends automatically. On a cold load the provider tries
 * `POST /auth/refresh` once — if the cookie is still valid the session is
 * restored without the user seeing a login screen.
 *
 * The provider also registers the client's 401 handler, so any request that
 * finds an expired token refreshes and retries instead of bouncing the user out.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import * as authApi from "@/lib/api/auth";
import { ApiError, setAccessToken, setRefreshHandler } from "@/lib/api/client";
import { ROLE_CAPABILITIES, type TeamRole } from "@/types/team";

export type SessionStatus = "loading" | "authenticated" | "anonymous";

export interface SessionValue {
  user: authApi.AuthUser | null;
  status: SessionStatus;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Re-read the signed-in user (for example after a role change). */
  reload: () => Promise<void>;
  /** True when the signed-in user holds any of the given roles. */
  hasRole: (...roles: TeamRole[]) => boolean;
  /** Capability flags derived from the signed-in user's role. */
  capabilities: (typeof ROLE_CAPABILITIES)[TeamRole] | null;
}

const SessionContext = React.createContext<SessionValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = React.useState<authApi.AuthUser | null>(null);
  const [status, setStatus] = React.useState<SessionStatus>("loading");
  const refreshInFlight = React.useRef<Promise<boolean> | null>(null);

  const applySession = React.useCallback((session: authApi.AuthSession) => {
    setAccessToken(session.accessToken);
    setUser(session.user);
    setStatus("authenticated");
  }, []);

  const clearSession = React.useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setStatus("anonymous");
  }, []);

  /**
   * Single-flight refresh: concurrent 401s share one request, so a burst of
   * parallel calls cannot rotate the refresh token several times at once.
   */
  const refreshSession = React.useCallback((): Promise<boolean> => {
    if (!refreshInFlight.current) {
      refreshInFlight.current = authApi
        .refreshSession()
        .then((session) => {
          applySession(session);
          return true;
        })
        .catch(() => {
          clearSession();
          return false;
        })
        .finally(() => {
          refreshInFlight.current = null;
        });
    }
    return refreshInFlight.current;
  }, [applySession, clearSession]);

  // Give the API client a way to recover from an expired access token.
  React.useEffect(() => {
    setRefreshHandler(refreshSession);
    return () => setRefreshHandler(null);
  }, [refreshSession]);

  // Restore the session from the refresh cookie on first load.
  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      const restored = await refreshSession();
      if (!restored && !cancelled) setStatus("anonymous");
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshSession]);

  const login = React.useCallback(
    async (email: string, password: string) => {
      const session = await authApi.login(email, password);
      applySession(session);
    },
    [applySession],
  );

  const logout = React.useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // A failed logout must not trap the user in the app: the token is cleared
      // locally either way.
      if (!(error instanceof ApiError)) throw error;
    }
    clearSession();
    router.replace("/login");
  }, [clearSession, router]);

  const reload = React.useCallback(async () => {
    try {
      setUser(await authApi.currentUser());
    } catch (error) {
      if (error instanceof ApiError && error.isAuthError) clearSession();
    }
  }, [clearSession]);

  const value = React.useMemo<SessionValue>(() => {
    const capabilities = user ? ROLE_CAPABILITIES[user.role] : null;
    return {
      user,
      status,
      login,
      logout,
      reload,
      hasRole: (...roles: TeamRole[]) => Boolean(user && roles.includes(user.role)),
      capabilities,
    };
  }, [user, status, login, logout, reload]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const context = React.useContext(SessionContext);
  if (!context) throw new Error("useSession must be used inside <AuthProvider>.");
  return context;
}
