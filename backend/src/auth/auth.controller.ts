import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import type {
  EnvironmentVariables,
  NodeEnv,
} from '../config/env.validation.js';
import {
  toUserResponse,
  UserResponseDto,
} from '../users/dto/user-response.dto.js';
import type { UserDocument } from '../users/schemas/user.schema.js';
import { AUTH_MESSAGES } from '../common/validation/validation-contract.js';
import {
  ACCESS_TOKEN_COOKIE,
  accessTokenCookieOptions,
  baseCookieOptions,
} from './auth.cookie.js';
import { AuthService } from './auth.service.js';
import { SignInDto } from './dto/sign-in.dto.js';
import { SignUpDto } from './dto/sign-up.dto.js';

const STRICT_THROTTLE = { default: { limit: 5, ttl: 60_000 } };

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  @Post('sign-up')
  @Throttle(STRICT_THROTTLE)
  @ApiCreatedResponse({
    type: UserResponseDto,
    description: 'Account created; session cookie set',
  })
  @ApiBadRequestResponse({
    description: 'Validation failed; per-field messages in `errors`',
  })
  @ApiConflictResponse({ description: AUTH_MESSAGES.emailTaken })
  @ApiTooManyRequestsResponse()
  async signUp(
    @Body() dto: SignUpDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserResponseDto> {
    const user = await this.authService.signUp(dto);
    await this.setSessionCookie(res, user);
    return toUserResponse(user);
  }

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  @Throttle(STRICT_THROTTLE)
  @ApiOkResponse({
    type: UserResponseDto,
    description: 'Signed in; session cookie set',
  })
  @ApiUnauthorizedResponse({ description: AUTH_MESSAGES.invalidCredentials })
  @ApiTooManyRequestsResponse()
  async signIn(
    @Body() dto: SignInDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserResponseDto> {
    const user = await this.authService.signIn(dto);
    await this.setSessionCookie(res, user);
    return toUserResponse(user);
  }

  @Post('sign-out')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Session cookie cleared' })
  signOut(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie(ACCESS_TOKEN_COOKIE, baseCookieOptions(this.nodeEnv()));
  }

  private async setSessionCookie(
    res: Response,
    user: UserDocument,
  ): Promise<void> {
    const token = await this.authService.issueToken(user);
    res.cookie(
      ACCESS_TOKEN_COOKIE,
      token,
      accessTokenCookieOptions(
        this.nodeEnv(),
        this.config.get('JWT_EXPIRES_IN_SECONDS', { infer: true }),
      ),
    );
  }

  private nodeEnv(): NodeEnv {
    return this.config.get('NODE_ENV', { infer: true });
  }
}
