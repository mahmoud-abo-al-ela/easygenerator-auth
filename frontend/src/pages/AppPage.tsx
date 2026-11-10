import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/auth-context.ts";
import { Button } from "../components/Button.tsx";
import { FormAlert } from "../components/FormAlert.tsx";
import { ApiError } from "../lib/api.ts";

export function AppPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function handleLogOut() {
    setPending(true);
    setError(undefined);
    try {
      await signOut();
      navigate("/sign-in", { replace: true });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't log out. Please try again.");
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col justify-center px-4 py-12">
      <title>Welcome</title>
      <h1 className="font-display text-5xl font-bold tracking-tight text-ink sm:text-6xl">
        Welcome to the application.
      </h1>
      {user && (
        <p className="mt-5 text-lg text-ink-muted">
          You're signed in as <span className="font-bold text-ink">{user.name}</span> ({user.email}).
        </p>
      )}
      <div className="mt-10 flex flex-col items-start gap-4">
        <FormAlert message={error} />
        <Button variant="secondary" onClick={handleLogOut} pending={pending} pendingLabel="Logging out…">
          Log out
        </Button>
      </div>
    </main>
  );
}
