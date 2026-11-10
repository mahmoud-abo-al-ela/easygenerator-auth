import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, type User } from "../lib/api.ts";
import { AuthContext, type AuthContextValue, type AuthStatus } from "./auth-context.ts";

/**
 * Session state. The JWT is an httpOnly cookie the page can't read, so the
 * server is asked who the user is (`GET /users/me`) on load.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const setSession = useCallback((next: User | null) => {
    setUser(next);
    setStatus(next ? "authenticated" : "guest");
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .getMe()
      .then((me) => !cancelled && setSession(me))
      .catch(() => !cancelled && setSession(null));
    return () => {
      cancelled = true;
    };
  }, [setSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      signIn: async (data) => setSession(await api.signIn(data)),
      signUp: async (data) => setSession(await api.signUp(data)),
      signOut: async () => {
        await api.signOut();
        setSession(null);
      },
    }),
    [status, user, setSession],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
