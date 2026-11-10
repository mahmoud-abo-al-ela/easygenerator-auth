import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import { configureApp, setupSwagger, SWAGGER_PATH } from './app.setup.js';
import type { EnvironmentVariables } from './config/env.validation.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = app.get(Logger);
  app.useLogger(logger);
  configureApp(app);
  setupSwagger(app);
  app.enableShutdownHooks();

  const config =
    app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);
  await app.listen(config.get('PORT', { infer: true }));

  // Nest doesn't print the address it listens on; log it (and the docs) for convenience.
  const url = (await app.getUrl()).replace('[::1]', 'localhost');
  logger.log(`API listening on ${url}`, 'Bootstrap');
  logger.log(`Swagger docs at ${url}/${SWAGGER_PATH}`, 'Bootstrap');
}
await bootstrap();
