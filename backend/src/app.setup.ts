import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { ACCESS_TOKEN_COOKIE } from './auth/auth.cookie.js';
import { requireJsonBody } from './common/http/require-json.middleware.js';
import { validationExceptionFactory } from './common/validation/validation-exception.factory.js';
import type { EnvironmentVariables } from './config/env.validation.js';

/** Global middleware, pipes and CORS. Shared by main.ts and the e2e tests. */
export function configureApp(app: INestApplication): void {
  const config =
    app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);

  // Behind a proxy, req.ip (used by the rate limiter) must come from X-Forwarded-For.
  const proxyHops = config.get('TRUST_PROXY_HOPS', { infer: true });
  if (proxyHops > 0) {
    (app as NestExpressApplication).set('trust proxy', proxyHops);
  }

  app.use(helmet());
  app.use(requireJsonBody);
  app.use(cookieParser());
  app.enableCors({
    origin: config.get('CORS_ORIGIN', { infer: true }),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: validationExceptionFactory,
    }),
  );
}

export const SWAGGER_PATH = 'api/docs';

export function setupSwagger(app: INestApplication): void {
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Easygenerator Auth API')
      .setVersion('1.0')
      .addCookieAuth(ACCESS_TOKEN_COOKIE)
      .build(),
  );
  SwaggerModule.setup(SWAGGER_PATH, app, document);
}
