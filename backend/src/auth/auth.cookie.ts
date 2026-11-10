import type { CookieOptions } from 'express';
import type { NodeEnv } from '../config/env.validation.js';

export const ACCESS_TOKEN_COOKIE = 'access_token';

/**
 * Environments allowed to send the cookie over plain HTTP (localhost).
 * Every other environment gets `Secure`, so a misconfigured deploy fails safe.
 */
const PLAIN_HTTP_ENVS: ReadonlySet<NodeEnv> = new Set(['development', 'test']);
export function baseCookieOptions(env: NodeEnv): CookieOptions {
  return {
    httpOnly: true,
    secure: !PLAIN_HTTP_ENVS.has(env),
    sameSite: 'lax',
    path: '/',
  };
}

export function accessTokenCookieOptions(
  env: NodeEnv,
  expiresInSeconds: number,
): CookieOptions {
  return {
    ...baseCookieOptions(env),
    maxAge: expiresInSeconds * 1000,
  };
}
