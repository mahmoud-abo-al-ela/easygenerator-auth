import type { ComponentProps } from "react";

interface ButtonProps extends ComponentProps<"button"> {
  pending?: boolean;
  pendingLabel?: string;
  variant?: "primary" | "secondary";
}

const VARIANTS = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  secondary: "border border-field bg-surface text-ink hover:border-ink-muted",
} as const;

export function Button({
  pending = false,
  pendingLabel,
  variant = "primary",
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={`inline-flex cursor-pointer items-center justify-center rounded-lg px-5 py-2.5 font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
    >
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
