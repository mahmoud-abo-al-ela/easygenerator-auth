import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { validateEnv } from './env.validation.js';

const base = {
  MONGODB_URI: 'mongodb://localhost:27017/test',
  JWT_SECRET: 'a-real-random-secret-that-is-long-enough-123',
};

function exampleSecret(): string {
  const file = readFileSync(
    join(import.meta.dirname, '../../.env.example'),
    'utf8',
  );
  const line = file.split(/\r?\n/).find((l) => l.startsWith('JWT_SECRET='));
  if (!line) throw new Error('JWT_SECRET missing from .env.example');
  return line.slice('JWT_SECRET='.length);
}

describe('validateEnv', () => {
  it('accepts a valid environment and applies defaults', () => {
    const env = validateEnv(base);
    expect(env.PORT).toBe(3000);
    expect(env.JWT_EXPIRES_IN_SECONDS).toBe(3600);
    expect(env.NODE_ENV).toBe('production');
    expect(env.TRUST_PROXY_HOPS).toBe(0);
  });

  it('rejects a short JWT secret', () => {
    expect(() => validateEnv({ ...base, JWT_SECRET: 'short' })).toThrow(
      /JWT_SECRET/,
    );
  });

  it('rejects the placeholder secret from .env.example', () => {
    const placeholder = exampleSecret();
    // Guard against the test passing for the wrong reason: the placeholder is long enough.
    expect(placeholder.length).toBeGreaterThanOrEqual(32);
    expect(() => validateEnv({ ...base, JWT_SECRET: placeholder })).toThrow(
      /still the \.env\.example placeholder/,
    );
  });

  it('rejects a missing MongoDB URI', () => {
    expect(() => validateEnv({ JWT_SECRET: base.JWT_SECRET })).toThrow(
      /MONGODB_URI/,
    );
  });
});
