import { useId, type ComponentProps, type ReactNode } from "react";

interface TextFieldProps extends ComponentProps<"input"> {
  label: string;
  error?: string;
  /** Extra content under the input (e.g. a checklist); linked via aria-describedby. */
  description?: ReactNode;
  /** Rendered inside the input row, at the end (e.g. a show/hide button). */
  trailing?: ReactNode;
}

export function TextField({
  label,
  error,
  description,
  trailing,
  id,
  className,
  ...inputProps
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const descriptionId = `${inputId}-description`;
  const describedBy =
    [error && errorId, description && descriptionId].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1.5 block font-bold text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`block w-full rounded-lg border bg-surface px-3.5 py-2.5 text-base text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted focus:ring-4 ${
            error
              ? "border-danger focus:ring-danger/20"
              : "border-field hover:border-ink-muted focus:border-primary focus:ring-primary/20"
          } ${trailing ? "pr-12" : ""}`}
          {...inputProps}
        />
        {trailing && (
          <div className="absolute inset-y-0 right-1.5 flex items-center">{trailing}</div>
        )}
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      )}
      {description && (
        <div id={descriptionId} className="mt-2">
          {description}
        </div>
      )}
    </div>
  );
}
