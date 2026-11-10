import { Navigate, Outlet } from "react-router-dom";
import { FullPageSpinner } from "../components/FullPageSpinner.tsx";
import { useAuth } from "./auth-context.ts";

/** Renders child routes only for signed-in users; everyone else goes to sign-in. */
export function RequireAuth() {
  const { status } = useAuth();
  if (status === "loading") return <FullPageSpinner />;
  return status === "authenticated" ? <Outlet /> : <Navigate to="/sign-in" replace />;
}

/** Sign-in and sign-up are for guests; signed-in users go to the app. */
export function RequireGuest() {
  const { status } = useAuth();
  if (status === "loading") return <FullPageSpinner />;
  return status === "guest" ? <Outlet /> : <Navigate to="/" replace />;
}
