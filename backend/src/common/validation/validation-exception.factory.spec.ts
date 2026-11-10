import { BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { VALIDATION_MESSAGES } from './validation-contract.js';
import {
  toFieldErrors,
  validationExceptionFactory,
} from './validation-exception.factory.js';

function error(
  property: string,
  constraints: Record<string, string>,
): ValidationError {
  return { property, constraints, children: [] } as ValidationError;
}

describe('toFieldErrors', () => {
  it('groups messages by field', () => {
    expect(
      toFieldErrors([
        error('email', { isEmail: 'bad email' }),
        error('password', { minLength: 'too short', hasNumber: 'no number' }),
      ]),
    ).toEqual({ email: ['bad email'], password: ['too short', 'no number'] });
  });

  it('keeps only the "required" message when a value is missing', () => {
    expect(
      toFieldErrors([
        error('email', { isNotEmpty: 'required', isEmail: 'bad email' }),
      ]),
    ).toEqual({ email: ['required'] });
  });

  it('replaces the whitelist error with a friendly message', () => {
    expect(
      toFieldErrors([
        error('role', {
          whitelistValidation: 'property role should not exist',
        }),
      ]),
    ).toEqual({ role: [VALIDATION_MESSAGES.unknownField] });
  });

  it('skips errors without constraints', () => {
    expect(
      toFieldErrors([{ property: 'x', children: [] } as ValidationError]),
    ).toEqual({});
  });
});

describe('validationExceptionFactory', () => {
  it('returns a 400 with a summary and per-field errors', () => {
    const exception = validationExceptionFactory([
      error('name', { minLength: 'too short' }),
    ]);

    expect(exception).toBeInstanceOf(BadRequestException);
    expect(exception.getResponse()).toEqual({
      statusCode: 400,
      error: 'Bad Request',
      message: VALIDATION_MESSAGES.summary,
      errors: { name: ['too short'] },
    });
  });
});
