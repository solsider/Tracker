import { NestFactory } from '@nestjs/core';
import { ValidationPipe, ShutdownSignal } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { promises as fs } from 'fs';
import * as cookieParser from 'cookie-parser';
import * as helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AppLogger } from './common/logger/app-logger.service';

const logger = new AppLogger('Bootstrap');

function validateEnv() {
  const required = ['JWT_SECRET', 'DATABASE_URL'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      logger.warn('Running in development mode with missing env vars — MUST fix before production');
    }
  }
}

async function bootstrap() {
  validateEnv();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new AppLogger('NestFactory'),
  });

  // ── Security headers ────────────────────────────────────────────────────────
  const isProd = process.env.NODE_ENV === 'production';
  app.use(
    (helmet as unknown as typeof import('helmet').default)({
      // CSP disabled in dev; strict in production
      contentSecurityPolicy: isProd
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", 'data:', 'blob:'],
              connectSrc: ["'self'", 'ws:', 'wss:'],
              fontSrc: ["'self'", 'https://fonts.gstatic.com'],
              objectSrc: ["'none'"],
              upgradeInsecureRequests: [],
            },
          }
        : false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // ── Upload directories ───────────────────────────────────────────────────────
  const uploadDir = join(process.cwd(), 'uploads');
  await fs.mkdir(join(uploadDir, 'tmp'), { recursive: true });
  app.useStaticAssets(uploadDir, { prefix: '/uploads' });

  app.use(cookieParser());
  // Allow text/plain body (used by navigator.sendBeacon from frontend crash reporter)
  app.use('/api/telemetry', require('express').text({ type: 'text/plain', limit: '8kb' }));
  app.useWebSocketAdapter(new IoAdapter(app));

  // ── Global filters & pipes ──────────────────────────────────────────────────
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // ── CORS ────────────────────────────────────────────────────────────────────
  const corsOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
    credentials: true,
  });

  // ── Graceful shutdown ───────────────────────────────────────────────────────
  app.enableShutdownHooks([ShutdownSignal.SIGTERM, ShutdownSignal.SIGINT]);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`Server running on http://localhost:${port} [${process.env.NODE_ENV || 'development'}]`);
}

bootstrap();
