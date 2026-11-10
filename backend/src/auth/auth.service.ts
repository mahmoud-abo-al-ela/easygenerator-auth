import { randomBytes } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import type { UserDocument } from '../users/schemas/user.schema.js';
import { AUTH_MESSAGES } from '../common/validation/validation-contract.js';
import { UsersService } from '../users/users.service.js';
import type { JwtPayload } from './auth.types.js';
import type { SignInDto } from './dto/sign-in.dto.js';
import type { SignUpDto } from './dto/sign-up.dto.js';

@Injectable()
export class AuthService {
  private dummyHash?: Promise<string>;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signUp(dto: SignUpDto): Promise<UserDocument> {
    const passwordHash = await argon2.hash(dto.password);
    return this.usersService.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
    });
  }

  async signIn(dto: SignInDto): Promise<UserDocument> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    const hash = user?.passwordHash ?? (await this.getDummyHash());
    const valid = await argon2.verify(hash, dto.password);
    if (!user || !valid) {
      throw new UnauthorizedException(AUTH_MESSAGES.invalidCredentials);
    }
    return user;
  }

  issueToken(user: UserDocument): Promise<string> {
    const payload: JwtPayload = { sub: user.id as string };
    return this.jwtService.signAsync(payload);
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= argon2.hash(randomBytes(32).toString('hex'));
    return this.dummyHash;
  }
}
