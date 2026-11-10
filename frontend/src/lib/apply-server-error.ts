import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiError } from "./api.ts";

const FALLBACK_MESSAGE = "Something went wrong. Please try again.";

/**
 * Shows an API failure on the form: per-field messages from a 400 go under
 * their inputs (first one focused); anything else becomes a form-level alert.
 */
export function applyServerError<T extends FieldValues>(
  error: unknown,
  fields: readonly Path<T>[],
  setError: UseFormSetError<T>,
): void {
  if (!(error instanceof ApiError)) {
    setError("root.server", { type: "server", message: FALLBACK_MESSAGE });
    return;
  }

  const fieldEntries = Object.entries(error.fieldErrors ?? {}).filter(
    (entry): entry is [Path<T>, string[]] =>
      fields.includes(entry[0] as Path<T>) && entry[1].length > 0,
  );

  if (fieldEntries.length === 0) {
    setError("root.server", { type: "server", message: error.message });
    return;
  }

  fieldEntries.forEach(([field, messages], index) =>
    setError(field, { type: "server", message: messages[0] }, { shouldFocus: index === 0 }),
  );
}
