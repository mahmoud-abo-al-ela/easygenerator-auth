import type { TransformFnParams } from 'class-transformer';

/** For `@Transform`: trims strings, leaves other values for the validators to reject. */
export const trim = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;

/** For `@Transform` on emails: trims and lowercases so lookups are case-insensitive. */
export const trimLowercase = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;
