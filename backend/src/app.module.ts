import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { AuthModule } from './auth/auth.module.js';
import { AUTH_MESSAGES } from './common/validation/validation-contract.js';
import {
  type EnvironmentVariables,
  type NodeEnv,
  validateEnv,
} from './config/env.validation.js';
import { HealthController } from './health/health.controller.js';
import { UsersModule } from './users/users.module.js';

type Config = ConfigService<EnvironmentVariables, true>;

const LOG_LEVELS: Record<NodeEnv, string> = {
  development: 'debug',
  test: 'silent',
  production: 'info',
};

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: Config) => {
        const env = config.get('NODE_ENV', { infer: true });
        return {
          pinoHttp: {
            level: LOG_LEVELS[env],
            redact: [
              'req.headers.cookie',
              'req.headers.authorization',
              'req.body.password',
              'res.headers["set-cookie"]',
            ],
            // Human-readable logs locally; JSON everywhere else for log aggregation.
            // pino-pretty is a devDependency, so only reference it in development.
            transport:
              env === 'development'
                ? {
                    target: 'pino-pretty',
                    options: {
                      singleLine: true,
                      translateTime: 'SYS:HH:MM:ss',
                      ignore: 'pid,hostname',
                    },
                  }
                : undefined,
          },
        };
      },
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: Config) => ({
        uri: config.get('MONGODB_URI', { infer: true }),
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: Config) => ({
        throttlers: [{ ttl: 60_000, limit: 100 }],
        errorMessage: AUTH_MESSAGES.tooManyAttempts,
        // e2e tests sign up many users from one IP; rate limits would make them flaky.
        skipIf: () => config.get('NODE_ENV', { infer: true }) === 'test',
      }),
    }),
    AuthModule,
    UsersModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
