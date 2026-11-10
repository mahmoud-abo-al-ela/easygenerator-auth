import { accessTokenCookieOptions, baseCookieOptions } from './auth.cookie.js';

describe('auth cookie options', () => {
  it.each(['development', 'test'] as const)(
    'allows plain HTTP in %s (localhost)',
    (env) => {
      expect(baseCookieOptions(env).secure).toBe(false);
    },
  );

  it('is Secure in production', () => {
    expect(baseCookieOptions('production').secure).toBe(true);
  });

  it('is always httpOnly and SameSite=Lax', () => {
    expect(baseCookieOptions('production')).toMatchObject({
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });
  });

  it('derives maxAge from the token lifetime', () => {
    expect(accessTokenCookieOptions('production', 3600).maxAge).toBe(3_600_000);
  });
});
