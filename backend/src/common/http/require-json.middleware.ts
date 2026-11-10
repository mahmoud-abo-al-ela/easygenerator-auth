import { HttpStatus } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

const METHODS_WITH_BODY = new Set(['POST', 'PUT', 'PATCH']);

export const JSON_ONLY_MESSAGE = 'Send the request body as JSON';

function hasNonEmptyBody(req: Request): boolean {
  if (req.headers['transfer-encoding'] !== undefined) return true;
  return Number(req.headers['content-length'] ?? 0) > 0;
}

/**
 * Rejects request bodies that aren't JSON with 415.
 *
 * HTML forms can POST `application/x-www-form-urlencoded`, `multipart/form-data`
 * or `text/plain` cross-site without a CORS preflight. Accepting only JSON
 * (which needs a preflight cross-origin) closes login CSRF, where an attacker's
 * page signs the victim into the attacker's account.
 */
export function requireJsonBody(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // Body-less POSTs (sign-out) must pass. Clients often send `Content-Length: 0`,
  // which `req.is()` treats as a body, so check for a non-empty body explicitly.
  if (
    METHODS_WITH_BODY.has(req.method) &&
    hasNonEmptyBody(req) &&
    !req.is('application/json')
  ) {
    res.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE).json({
      statusCode: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
      error: 'Unsupported Media Type',
      message: JSON_ONLY_MESSAGE,
    });
    return;
  }
  next();
}
