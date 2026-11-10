// `@Type()` needs the Reflect metadata API; load it here so this module works without Nest booted.
import 'reflect-metadata';
import { plainToInstance, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  MinLength,
  NotContains,
  validateSync,
} from 'class-validator';

/** Marker contained in the .env.example placeholder secret. */
export const JWT_SECRET_PLACEHOLDER_MARKER = 'change-me';

const NODE_ENVS = ['development', 'production', 'test'] as const;
export type NodeEnv = (typeof NODE_ENVS)[number];

export class EnvironmentVariables {
  /**
   * Defaults to production so a deployment that forgets NODE_ENV still gets
   * Secure cookies and production logging. Local dev sets it in .env.
   */
  @IsIn(NODE_ENVS)
  NODE_ENV: NodeEnv = 'production';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT = 3000;

  @IsString()
  @IsNotEmpty()
  MONGODB_URI: string;

  @IsString()
  @MinLength(32)
  // The .env.example placeholder is long enough to pass MinLength; refuse it so
  // a copied example file can't run with a publicly known signing secret.
  @NotContains(JWT_SECRET_PLACEHOLDER_MARKER, {
    message:
      'JWT_SECRET is still the .env.example placeholder; generate a random secret',
  })
  JWT_SECRET: string;

  @Type(() => Number)
  @IsInt()
  @Min(60)
  JWT_EXPIRES_IN_SECONDS = 3600;

  @IsString()
  @IsNotEmpty()
  CORS_ORIGIN = 'http://localhost:5173';

  /**
   * Number of reverse proxies in front of the app (Express `trust proxy`).
   * 0 = use the socket address. Behind one load balancer, set 1 so rate limits
   * apply per client IP (from X-Forwarded-For) rather than to the proxy's IP.
   * Never set it higher than the real number of proxies, or clients can spoof their IP.
   */
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  TRUST_PROXY_HOPS = 0;
}

/** Fails fast at startup when required variables are missing or malformed. */
export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const env = plainToInstance(EnvironmentVariables, config, {
    exposeDefaultValues: true,
  });
  const errors = validateSync(env);
  if (errors.length > 0) {
    const details = errors
      .map(
        (e) =>
          `  ${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`,
      )
      .join('\n');
    throw new Error(`Invalid environment variables:\n${details}`);
  }
  return env;
}
