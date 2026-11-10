import { ValidateBy, type ValidationOptions } from 'class-validator';
import {
  HAS_LETTER,
  HAS_NUMBER,
  HAS_SPECIAL_CHAR,
} from './validation-contract.js';

/**
 * class-validator reports errors keyed by constraint name, so two `@Matches`
 * on one property would overwrite each other. Each rule gets its own name.
 */
function matchesRule(
  name: string,
  pattern: RegExp,
  options?: ValidationOptions,
) {
  return ValidateBy(
    {
      name,
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' && pattern.test(value),
      },
    },
    options,
  );
}

export const HasLetter = (options?: ValidationOptions) =>
  matchesRule('hasLetter', HAS_LETTER, options);

export const HasNumber = (options?: ValidationOptions) =>
  matchesRule('hasNumber', HAS_NUMBER, options);

export const HasSpecialChar = (options?: ValidationOptions) =>
  matchesRule('hasSpecialChar', HAS_SPECIAL_CHAR, options);
