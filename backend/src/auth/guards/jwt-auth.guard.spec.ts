import { type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ACCESS_TOKEN_COOKIE } from '../auth.cookie.js';
import { type AuthenticatedRequest, JwtAuthGuard } from './jwt-auth.guard.js';

const SECRET = 'test-secret-that-is-at-least-32-characters-long';

function contextFor(request: Partial<AuthenticatedRequest>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  const jwtService = new JwtService({ secret: SECRET });
  const guard = new JwtAuthGuard(jwtService);

  it('rejects a request without the cookie', async () => {
    await expect(
      guard.canActivate(contextFor({ cookies: {} })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a request when cookie parsing did not run', async () => {
    await expect(guard.canActivate(contextFor({}))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects a tampered token', async () => {
    const token = await jwtService.signAsync({ sub: 'u1' });
    const request = { cookies: { [ACCESS_TOKEN_COOKIE]: `${token}x` } };
    await expect(guard.canActivate(contextFor(request))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects a token signed with another secret', async () => {
    const other = new JwtService({
      secret: 'another-secret-that-is-also-32-characters',
    });
    const request = {
      cookies: { [ACCESS_TOKEN_COOKIE]: await other.signAsync({ sub: 'u1' }) },
    };
    await expect(guard.canActivate(contextFor(request))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects an expired token', async () => {
    const token = await jwtService.signAsync({ sub: 'u1' }, { expiresIn: -10 });
    const request = { cookies: { [ACCESS_TOKEN_COOKIE]: token } };
    await expect(guard.canActivate(contextFor(request))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects a valid token without a subject', async () => {
    const request = {
      cookies: { [ACCESS_TOKEN_COOKIE]: await jwtService.signAsync({}) },
    };
    await expect(guard.canActivate(contextFor(request))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('accepts a valid token and attaches the user', async () => {
    const request: Partial<AuthenticatedRequest> = {
      cookies: {
        [ACCESS_TOKEN_COOKIE]: await jwtService.signAsync({ sub: 'u1' }),
      },
    };
    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(request.user).toEqual({ id: 'u1' });
  });
});
