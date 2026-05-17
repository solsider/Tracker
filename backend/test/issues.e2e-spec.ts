import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Issues (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );
    await app.init();

    const email = `e2e_${Date.now()}@test.com`;
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, name: 'E2E User', password: 'testpass123' });

    const setCookies: string[] = (res.headers['set-cookie'] as unknown as string[]) ?? [];
    const match = setCookies.find((c) => c.startsWith('access_token='));
    if (!match) throw new Error('access_token cookie missing in register response');
    token = match.match(/^access_token=([^;]+)/)![1];
  });

  afterAll(async () => {
    await app.close();
  });

  async function createProject(name: string): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name });
    return res.body.id;
  }

  describe('A: Create issue without column', () => {
    it('returns 201 and auto-assigns a columnId', async () => {
      const projectId = await createProject('Project A');

      const res = await request(app.getHttpServer())
        .post(`/projects/${projectId}/issues`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Issue without column' });

      expect(res.status).toBe(201);
      expect(res.body.columnId).toBeDefined();
      expect(typeof res.body.columnId).toBe('string');
    });
  });

  describe('B: Backlog race condition', () => {
    it('places all parallel issues in the same column with no duplicate Backlog', async () => {
      const projectId = await createProject('Race Project');

      const responses = await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
          request(app.getHttpServer())
            .post(`/projects/${projectId}/issues`)
            .set('Authorization', `Bearer ${token}`)
            .send({ title: `Parallel issue ${i + 1}` }),
        ),
      );

      expect(responses.every((r) => r.status === 201)).toBe(true);

      const fetchRes = await request(app.getHttpServer())
        .get(`/projects/${projectId}/issues`)
        .set('Authorization', `Bearer ${token}`);

      const issues: Array<{ columnId: string }> = fetchRes.body;
      expect(issues).toHaveLength(5);

      const distinctColumns = new Set(issues.map((i) => i.columnId));
      expect(distinctColumns.size).toBe(1);
    });
  });

  describe('C: Issue ordering', () => {
    it('returns issues sorted by order ascending', async () => {
      const projectId = await createProject('Order Project');

      for (const title of ['First', 'Second', 'Third']) {
        await request(app.getHttpServer())
          .post(`/projects/${projectId}/issues`)
          .set('Authorization', `Bearer ${token}`)
          .send({ title });
      }

      const res = await request(app.getHttpServer())
        .get(`/projects/${projectId}/issues`)
        .set('Authorization', `Bearer ${token}`);

      const orders: number[] = res.body.map((i: { order: number }) => i.order);
      expect(orders.length).toBeGreaterThanOrEqual(3);
      expect(orders).toEqual([...orders].sort((a, b) => a - b));
    });
  });
});
