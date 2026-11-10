import { PASSWORD_RULES } from "../lib/auth-schemas.ts";

/**
 * Live password requirements. The bar fills left to right like a highlighter as
 * rules are met; the list says which ones, so color is never the only signal.
 */
export function PasswordChecklist({ password }: { password: string }) {
  const results = PASSWORD_RULES.map((rule) => ({ ...rule, met: rule.test(password) }));
  const metCount = results.filter((r) => r.met).length;

  return (
    <div>
      <div className="flex gap-1" aria-hidden="true">
        {results.map((rule, index) => (
          <span
            key={rule.id}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 motion-reduce:transition-none ${
              index < metCount ? "bg-mark" : "bg-line"
            }`}
          />
        ))}
      </div>
      <ul className="mt-2.5 grid gap-1 text-sm sm:grid-cols-2">
        {results.map((rule) => (
          <li
            key={rule.id}
            className={`flex items-center gap-2 ${rule.met ? "text-ink" : "text-ink-muted"}`}
          >
            <CheckIcon met={rule.met} />
            {rule.label}
            <span className="sr-only">{rule.met ? "(done)" : "(not yet)"}</span>
          </li>
        ))}
      </ul>
      <p className="sr-only" aria-live="polite">
        {metCount} of {results.length} password requirements met
      </p>
    </div>
  );
}

function CheckIcon({ met }: { met: boolean }) {
  return (
    <svg viewBox="0 0 16 16" className="size-4 shrink-0" aria-hidden="true">
      <circle
        cx="8"
        cy="8"
        r="7"
        className={met ? "fill-primary" : "fill-none stroke-field"}
        strokeWidth="1.5"
      />
      {met && (
        <path
          d="M5 8.2l2 2L11 6"
          fill="none"
          className="stroke-on-primary"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
