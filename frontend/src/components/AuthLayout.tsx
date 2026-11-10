import type { ReactNode } from "react";

/** Single left-aligned column; the heading carries the page. */
export function AuthLayout({
  title,
  children,
  footer,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[26rem] flex-col justify-center px-4 py-12 sm:px-0">
      <title>{title}</title>
      <h1 className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
        {title}
      </h1>
      <div className="mt-8">{children}</div>
      {footer && <p className="mt-8 text-ink-muted">{footer}</p>}
    </main>
  );
}
