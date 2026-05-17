import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppLogger } from '../logger/app-logger.service';

const isProd = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new AppLogger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = request.requestId ?? '-';

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[];
    if (isHttp) {
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any)?.message ?? exception.message;
    } else {
      message = isProd ? 'Internal server error' : String((exception as any)?.message ?? exception);
    }

    if (status >= 500) {
      this.logger.error(
        `[${requestId}] ${request.method} ${request.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
        { requestId, method: request.method, url: request.url, statusCode: status } as any,
      );
    } else if (status >= 400) {
      this.logger.warn(`[${requestId}] ${request.method} ${request.url} → ${status}`, {
        requestId,
        method: request.method,
        url: request.url,
        statusCode: status,
        message: JSON.stringify(message),
      } as any);
    }

    response.status(status).json({
      statusCode: status,
      message,
      requestId,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
