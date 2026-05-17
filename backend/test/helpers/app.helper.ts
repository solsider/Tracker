import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.init();
  return app;
}

export interface TestUser {
  token: string;
  cookie: string;
  userId: string;
  email: string;
}

function extractAccessToken(setCookieHeaders: string[]): string {
  for (const header of setCookieHeaders) {
    const match = header.match(/^access_token=([^;]+)/);
    if (match) return match[1];
  }
  throw new Error('access_token cookie not found in Set-Cookie headers');
}

export async function registerTestUser(
  app: INestApplication,
  suffix?: string,
): Promise<TestUser> {
  const tag = suffix ?? String(Date.now());
  const email = `test_${tag}@test.com`;

  const res = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, name: `Test User ${tag}`, password: 'testpass123' });

  if (res.status !== 201) {
    throw new Error(`Failed to register test user: ${JSON.stringify(res.body)}`);
  }

  const setCookies: string[] = (res.headers['set-cookie'] as unknown as string[]) ?? [];
  const token = extractAccessToken(setCookies);
  const cookie = setCookies.map((c) => c.split(';')[0]).join('; ');

  return { token, cookie, userId: res.body.user.id, email };
}

export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

export async function createTestProject(
  app: INestApplication,
  token: string,
  name?: string,
): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/projects')
    .set(authHeader(token))
    .send({ name: name ?? `Project ${Date.now()}` });

  if (res.status !== 201) {
    throw new Error(`Failed to create project: ${JSON.stringify(res.body)}`);
  }

  return res.body.id;
}
