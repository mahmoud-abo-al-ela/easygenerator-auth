export function FormAlert({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-lg border border-danger/40 bg-danger-surface px-3.5 py-3 text-sm text-danger"
    >
      {message}
    </p>
  );
}
