import {
  createParamDecorator,
  type ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthUser } from '../auth.types.js';
import type { AuthenticatedRequest } from '../guards/jwt-auth.guard.js';

/** The user set by JwtAuthGuard. Only use on routes protected by that guard. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user) throw new UnauthorizedException();
    return request.user;
  },
);
