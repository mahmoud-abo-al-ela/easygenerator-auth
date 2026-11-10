import { Navigate, type RouteObject } from "react-router-dom";
import { RequireAuth, RequireGuest } from "./auth/route-guards.tsx";
import { AppPage } from "./pages/AppPage.tsx";
import { SignInPage } from "./pages/SignInPage.tsx";
import { SignUpPage } from "./pages/SignUpPage.tsx";

export const routes: RouteObject[] = [
  { element: <RequireAuth />, children: [{ path: "/", element: <AppPage /> }] },
  {
    element: <RequireGuest />,
    children: [
      { path: "/sign-in", element: <SignInPage /> },
      { path: "/sign-up", element: <SignUpPage /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
];
