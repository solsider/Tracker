import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { Request, Response } from 'express';
import { AppLogger } from '../logger/app-logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new AppLogger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const start = Date.now();
    const requestId = req.requestId ?? '-';

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - start;
        const status = res.statusCode;
        const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'log';
        (this.logger[level] as (msg: string, meta: Record<string, unknown>) => void)(
          `${req.method} ${req.originalUrl} ${status} +${ms}ms`,
          { requestId, method: req.method, url: req.originalUrl, statusCode: status, durationMs: ms },
        );
      }),
      catchError((err) => {
        const ms = Date.now() - start;
        this.logger.error(`${req.method} ${req.originalUrl} ERROR +${ms}ms`, err?.stack, {
          requestId,
          method: req.method,
          url: req.originalUrl,
          durationMs: ms,
          errorMessage: err?.message,
        } as any);
        return throwError(() => err);
      }),
    );
  }
}
