import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { Request } from 'express';

export interface RouteMetric {
  count: number;
  errors: number;
  totalMs: number;
  minMs: number;
  maxMs: number;
  p95Samples: number[];
}

export interface MetricsSnapshot {
  uptime: number;
  routes: Record<string, RouteMetric>;
  generatedAt: string;
}

const store = new Map<string, RouteMetric>();
const startTime = Date.now();
const P95_SAMPLE_CAP = 200;

function key(method: string, route: string): string {
  return `${method} ${route}`;
}

function record(k: string, ms: number, isError: boolean): void {
  let m = store.get(k);
  if (!m) {
    m = { count: 0, errors: 0, totalMs: 0, minMs: Infinity, maxMs: 0, p95Samples: [] };
    store.set(k, m);
  }
  m.count++;
  if (isError) m.errors++;
  m.totalMs += ms;
  if (ms < m.minMs) m.minMs = ms;
  if (ms > m.maxMs) m.maxMs = ms;
  if (m.p95Samples.length < P95_SAMPLE_CAP) m.p95Samples.push(ms);
}

export function getMetricsSnapshot(): MetricsSnapshot {
  const routes: Record<string, RouteMetric & { avgMs: number; p95Ms: number; errorRate: number }> = {};
  store.forEach((m, k) => {
    const sorted = [...m.p95Samples].sort((a, b) => a - b);
    const p95Idx = Math.floor(sorted.length * 0.95);
    routes[k] = {
      ...m,
      avgMs: m.count ? Math.round(m.totalMs / m.count) : 0,
      p95Ms: sorted[p95Idx] ?? 0,
      errorRate: m.count ? Math.round((m.errors / m.count) * 100) / 100 : 0,
    };
  });
  return { uptime: Math.floor((Date.now() - startTime) / 1000), routes, generatedAt: new Date().toISOString() };
}

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const start = Date.now();
    const route = (req.route?.path as string | undefined) ?? req.path ?? 'unknown';
    const k = key(req.method, route);

    return next.handle().pipe(
      tap(() => record(k, Date.now() - start, false)),
      catchError((err) => {
        record(k, Date.now() - start, true);
        return throwError(() => err);
      }),
    );
  }
}
