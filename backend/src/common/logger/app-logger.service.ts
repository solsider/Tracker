import { Injectable, LoggerService, Scope, Optional } from '@nestjs/common';

export type LogLevel = 'error' | 'warn' | 'log' | 'debug' | 'verbose';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context?: string;
  message: string;
  requestId?: string;
  [key: string]: unknown;
}

const isProd = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging';

function emit(entry: LogEntry): void {
  if (isProd) {
    process.stdout.write(JSON.stringify(entry) + '\n');
  } else {
    const prefix = `[${entry.context ?? 'App'}]`;
    const ts = entry.timestamp.slice(11, 23);
    const rid = entry.requestId ? ` (${entry.requestId})` : '';
    // eslint-disable-next-line no-console
    console.log(`${ts} ${entry.level.toUpperCase().padEnd(7)} ${prefix}${rid} ${entry.message}`);
  }
}

@Injectable({ scope: Scope.DEFAULT })
export class AppLogger implements LoggerService {
  private context?: string;

  constructor(@Optional() context?: string) {
    this.context = context;
  }

  setContext(context: string) {
    this.context = context;
  }

  private write(level: LogLevel, message: unknown, contextOrMeta?: string | Record<string, unknown>) {
    const extra: Record<string, unknown> =
      typeof contextOrMeta === 'object' && contextOrMeta !== null ? contextOrMeta : {};
    const ctx =
      typeof contextOrMeta === 'string' ? contextOrMeta : this.context;

    emit({
      timestamp: new Date().toISOString(),
      level,
      context: ctx,
      message: String(message),
      ...extra,
    });
  }

  log(message: unknown, contextOrMeta?: string | Record<string, unknown>) { this.write('log', message, contextOrMeta); }
  error(message: unknown, trace?: string, context?: string) {
    this.write('error', message, context);
    if (trace && !isProd) console.error(trace);
    else if (trace) process.stdout.write(JSON.stringify({ level: 'error', stack: trace, timestamp: new Date().toISOString() }) + '\n');
  }
  warn(message: unknown, contextOrMeta?: string | Record<string, unknown>) { this.write('warn', message, contextOrMeta); }
  debug(message: unknown, contextOrMeta?: string | Record<string, unknown>) { this.write('debug', message, contextOrMeta); }
  verbose(message: unknown, contextOrMeta?: string | Record<string, unknown>) { this.write('verbose', message, contextOrMeta); }

  withMeta(meta: Record<string, unknown>): AppLogger {
    const child = new AppLogger(this.context);
    const originalWrite = child['write'].bind(child);
    child['write'] = (level: LogLevel, message: unknown, contextOrMeta?: string | Record<string, unknown>) => {
      const extra = typeof contextOrMeta === 'object' ? { ...meta, ...contextOrMeta } : meta;
      originalWrite(level, message, extra);
    };
    return child;
  }
}
