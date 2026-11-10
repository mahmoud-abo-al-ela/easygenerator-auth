import { createContext, useContext } from "react";
import type { User } from "../lib/api.ts";

export type AuthStatus = "loading" | "authenticated" | "guest";

export interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  signIn: (data: { email: string; password: string }) => Promise<void>;
  signUp: (data: { email: string; name: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
}
