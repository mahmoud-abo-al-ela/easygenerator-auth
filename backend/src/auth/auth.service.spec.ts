import { UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import type { UserDocument } from '../users/schemas/user.schema.js';
import type { UsersService } from '../users/users.service.js';
import { AUTH_MESSAGES } from '../common/validation/validation-contract.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  const usersService = {
    create: vi.fn(),
    findByEmailWithPassword: vi.fn(),
  };
  const jwtService = { signAsync: vi.fn() };
  let service: AuthService;

  beforeEach(() => {
    vi.resetAllMocks();
    service = new AuthService(
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
    );
  });

  describe('signUp', () => {
    it('stores an argon2 hash, never the plain password', async () => {
      usersService.create.mockImplementation((data: unknown) =>
        Promise.resolve(data),
      );

      await service.signUp({
        email: 'jane@example.com',
        name: 'Jane',
        password: 'S3cure!pass',
      });

      const [data] = usersService.create.mock.calls[0] as [
        { email: string; name: string; passwordHash: string },
      ];
      expect(data.email).toBe('jane@example.com');
      expect(data.name).toBe('Jane');
      expect(data).not.toHaveProperty('password');
      expect(data.passwordHash).toMatch(/^\$argon2id\$/);
      await expect(
        argon2.verify(data.passwordHash, 'S3cure!pass'),
      ).resolves.toBe(true);
    });
  });

  describe('signIn', () => {
    it('returns the user when the password matches', async () => {
      const user = { id: 'u1', passwordHash: await argon2.hash('S3cure!pass') };
      usersService.findByEmailWithPassword.mockResolvedValue(user);

      await expect(
        service.signIn({ email: 'jane@example.com', password: 'S3cure!pass' }),
      ).resolves.toBe(user);
    });

    it('rejects a wrong password with a generic message', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue({
        id: 'u1',
        passwordHash: await argon2.hash('S3cure!pass'),
      });

      const result = service.signIn({
        email: 'jane@example.com',
        password: 'wrong',
      });
      await expect(result).rejects.toBeInstanceOf(UnauthorizedException);
      await expect(result).rejects.toThrow(AUTH_MESSAGES.invalidCredentials);
    });

    it('rejects an unknown email with the same generic message', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(null);

      const result = service.signIn({
        email: 'nobody@example.com',
        password: 'S3cure!pass',
      });
      await expect(result).rejects.toBeInstanceOf(UnauthorizedException);
      await expect(result).rejects.toThrow(AUTH_MESSAGES.invalidCredentials);
    });
  });

  describe('issueToken', () => {
    it('signs a token whose subject is the user id', async () => {
      jwtService.signAsync.mockResolvedValue('token');

      await expect(
        service.issueToken({ id: 'u1' } as UserDocument),
      ).resolves.toBe('token');
      expect(jwtService.signAsync).toHaveBeenCalledWith({ sub: 'u1' });
    });
  });
});
