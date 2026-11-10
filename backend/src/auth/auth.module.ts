import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module.js';
import { AuthJwtModule } from './auth-jwt.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

@Module({
  imports: [UsersModule, AuthJwtModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
