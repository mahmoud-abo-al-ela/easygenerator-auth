import { BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { VALIDATION_MESSAGES } from './validation-contract.js';

export type FieldErrors = Record<string, string[]>;

/** Constraints that mean "no value given"; when one fails, the other messages are noise. */
const PRESENCE_CONSTRAINTS = ['isNotEmpty', 'isDefined'];
/** Raised by `forbidNonWhitelisted` for properties the DTO doesn't declare. */
const UNKNOWN_FIELD_CONSTRAINT = 'whitelistValidation';

function messagesFor(error: ValidationError): string[] {
  const constraints = error.constraints ?? {};
  if (UNKNOWN_FIELD_CONSTRAINT in constraints) {
    return [VALIDATION_MESSAGES.unknownField];
  }
  const missing = PRESENCE_CONSTRAINTS.find((key) => key in constraints);
  if (missing) {
    return [constraints[missing]];
  }
  return Object.values(constraints);
}

/** Maps class-validator errors to `{ field: [messages] }`, preserving the first-seen field order. */
export function toFieldErrors(errors: ValidationError[]): FieldErrors {
  const result: FieldErrors = {};
  for (const error of errors) {
    const messages = messagesFor(error);
    if (messages.length > 0) {
      result[error.property] = [...(result[error.property] ?? []), ...messages];
    }
  }
  return result;
}

/**
 * Builds a 400 response the frontend can map straight onto form fields:
 * `{ statusCode, error, message, errors: { email: [...], password: [...] } }`.
 */
export function validationExceptionFactory(
  errors: ValidationError[],
): BadRequestException {
  return new BadRequestException({
    statusCode: 400,
    error: 'Bad Request',
    message: VALIDATION_MESSAGES.summary,
    errors: toFieldErrors(errors),
  });
}
