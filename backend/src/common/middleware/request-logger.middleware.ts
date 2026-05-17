import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

// Request logging is handled by LoggingInterceptor (global APP_INTERCEPTOR).
// This middleware is kept for static asset and pre-guard requests not seen by the interceptor.
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  use(_req: Request, _res: Response, next: NextFunction) {
    next();
  }
}
