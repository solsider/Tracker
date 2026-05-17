import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, authHeader } from './helpers/app.helper';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  const uid = Date.now();
  const testEmail = `auth_${uid}@test.com`;
  const testPassword = 'testpass123';
  let token: string;

  // ── Registration ────────────────────────────────────────────────────────────

  describe('POST /auth/register', () => {
    it('201: registers a new user and sets auth cookies', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: testEmail, name: 'Test User', password: testPassword });

      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe(testEmail);
      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body.user).not.toHaveProperty('twoFactorSecret');

      const setCookies: string[] = (res.headers['set-cookie'] as unknown as string[]) ?? [];
      const match = setCookies.find((c) => c.startsWith('access_token='));
      expect(match).toBeDefined();
      token = match!.match(/^access_token=([^;]+)/)![1];
    });

    it('409: rejects duplicate email', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: testEmail, name: 'Duplicate', password: testPassword });

      expect(res.status).toBe(409);
    });

    it('400: rejects invalid email format', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'not-an-email', name: 'Bad', password: testPassword });

      expect(res.status).toBe(400);
    });

    it('400: rejects password shorter than 8 characters', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: `short_${uid}@test.com`, name: 'Short', password: '1234567' });

      expect(res.status).toBe(400);
    });

    it('400: rejects missing name', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: `noname_${uid}@test.com`, password: testPassword });

      expect(res.status).toBe(400);
    });

    it('400: rejects unknown extra fields (forbidNonWhitelisted)', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `extra_${uid}@test.com`,
          name: 'Extra',
          password: testPassword,
          hacker: 'payload',
        });

      expect(res.status).toBe(400);
    });
  });

  // ── Login ───────────────────────────────────────────────────────────────────

  describe('POST /auth/login', () => {
    it('200: logs in with correct credentials and sets auth cookies', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testEmail, password: testPassword });

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(testEmail);
      const setCookies: string[] = (res.headers['set-cookie'] as unknown as string[]) ?? [];
      expect(setCookies.some((c) => c.startsWith('access_token='))).toBe(true);
    });

    it('401: rejects wrong password', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testEmail, password: 'wrongpassword' });

      expect(res.status).toBe(401);
    });

    it('401: rejects non-existent email', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nobody@ghost.com', password: testPassword });

      expect(res.status).toBe(401);
    });

    it('400: rejects missing password field', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testEmail });

      expect(res.status).toBe(400);
    });
  });

  // ── Me ──────────────────────────────────────────────────────────────────────

  describe('GET /auth/me', () => {
    it('200: returns current user profile with valid token', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.email).toBe(testEmail);
      expect(res.body).not.toHaveProperty('password');
    });

    it('401: rejects request without token', async () => {
      const res = await request(app.getHttpServer()).get('/auth/me');
      expect(res.status).toBe(401);
    });

    it('401: rejects request with malformed token', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer not.a.real.token');

      expect(res.status).toBe(401);
    });
  });
});
