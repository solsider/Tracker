import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, registerTestUser, authHeader, TestUser } from './helpers/app.helper';

describe('Projects (e2e)', () => {
  let app: INestApplication;
  let owner: TestUser;
  let member: TestUser;
  let outsider: TestUser;

  beforeAll(async () => {
    app = await createTestApp();
    const tag = Date.now();
    [owner, member, outsider] = await Promise.all([
      registerTestUser(app, `owner_${tag}`),
      registerTestUser(app, `member_${tag}`),
      registerTestUser(app, `outsider_${tag}`),
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  async function createProject(token: string, name: string): Promise<any> {
    const res = await request(app.getHttpServer())
      .post('/projects')
      .set(authHeader(token))
      .send({ name });
    expect(res.status).toBe(201);
    return res.body;
  }

  // ── Create ──────────────────────────────────────────────────────────────────

  describe('POST /projects', () => {
    it('201: creates a project and returns it', async () => {
      const res = await request(app.getHttpServer())
        .post('/projects')
        .set(authHeader(owner.token))
        .send({ name: 'My Project', description: 'A test project' });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe('My Project');
      expect(res.body.description).toBe('A test project');
      expect(res.body.ownerId).toBe(owner.userId);
    });

    it('201: creates project without optional description', async () => {
      const res = await request(app.getHttpServer())
        .post('/projects')
        .set(authHeader(owner.token))
        .send({ name: 'Minimal Project' });

      expect(res.status).toBe(201);
      expect(res.body.description).toBeNull();
    });

    it('400: rejects missing name', async () => {
      const res = await request(app.getHttpServer())
        .post('/projects')
        .set(authHeader(owner.token))
        .send({ description: 'No name' });

      expect(res.status).toBe(400);
    });

    it('401: rejects unauthenticated request', async () => {
      const res = await request(app.getHttpServer())
        .post('/projects')
        .send({ name: 'Anon Project' });

      expect(res.status).toBe(401);
    });
  });

  // ── Read ────────────────────────────────────────────────────────────────────

  describe('GET /projects', () => {
    it('200: returns only projects the user owns or is a member of', async () => {
      await createProject(owner.token, 'Owner Project');

      const ownerRes = await request(app.getHttpServer())
        .get('/projects')
        .set(authHeader(owner.token));
      const outsiderRes = await request(app.getHttpServer())
        .get('/projects')
        .set(authHeader(outsider.token));

      expect(ownerRes.status).toBe(200);
      expect(Array.isArray(ownerRes.body)).toBe(true);

      const ownerProjectNames = ownerRes.body.map((p: any) => p.name);
      expect(ownerProjectNames.some((n: string) => n === 'Owner Project')).toBe(true);

      const outsiderProjectNames = outsiderRes.body.map((p: any) => p.name);
      expect(outsiderProjectNames).not.toContain('Owner Project');
    });
  });

  describe('GET /projects/:id', () => {
    it('200: returns project detail for member', async () => {
      const project = await createProject(owner.token, 'Detail Project');

      const res = await request(app.getHttpServer())
        .get(`/projects/${project.id}`)
        .set(authHeader(owner.token));

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(project.id);
    });

    it('403: returns 403 for non-member', async () => {
      const project = await createProject(owner.token, 'Private Project');

      const res = await request(app.getHttpServer())
        .get(`/projects/${project.id}`)
        .set(authHeader(outsider.token));

      expect(res.status).toBe(403);
    });

    it('404: returns 404 for non-existent project', async () => {
      const res = await request(app.getHttpServer())
        .get('/projects/non-existent-id')
        .set(authHeader(owner.token));

      expect(res.status).toBe(404);
    });
  });

  // ── Update ──────────────────────────────────────────────────────────────────

  describe('PATCH /projects/:id', () => {
    it('200: owner can update project name', async () => {
      const project = await createProject(owner.token, 'Old Name');

      const res = await request(app.getHttpServer())
        .patch(`/projects/${project.id}`)
        .set(authHeader(owner.token))
        .send({ name: 'New Name' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('New Name');
    });

    it('403: non-member cannot update project', async () => {
      const project = await createProject(owner.token, 'Protected Project');

      const res = await request(app.getHttpServer())
        .patch(`/projects/${project.id}`)
        .set(authHeader(outsider.token))
        .send({ name: 'Hacked' });

      expect(res.status).toBe(403);
    });
  });

  // ── Members ─────────────────────────────────────────────────────────────────

  describe('Member management', () => {
    it('adds a member and grants them access', async () => {
      const project = await createProject(owner.token, 'Shared Project');

      // Before adding: member cannot access
      const beforeRes = await request(app.getHttpServer())
        .get(`/projects/${project.id}`)
        .set(authHeader(member.token));
      expect(beforeRes.status).toBe(403);

      // Add member
      const addRes = await request(app.getHttpServer())
        .post(`/projects/${project.id}/members`)
        .set(authHeader(owner.token))
        .send({ userId: member.userId, role: 'MEMBER' });
      expect(addRes.status).toBe(201);

      // After adding: member can access
      const afterRes = await request(app.getHttpServer())
        .get(`/projects/${project.id}`)
        .set(authHeader(member.token));
      expect(afterRes.status).toBe(200);
    });

    it('removes a member and revokes their access', async () => {
      const project = await createProject(owner.token, 'Remove Member Project');

      // Add member
      await request(app.getHttpServer())
        .post(`/projects/${project.id}/members`)
        .set(authHeader(owner.token))
        .send({ userId: member.userId, role: 'MEMBER' });

      // Remove member
      const removeRes = await request(app.getHttpServer())
        .delete(`/projects/${project.id}/members/${member.userId}`)
        .set(authHeader(owner.token));
      expect(removeRes.status).toBe(200);

      // After removing: member cannot access
      const afterRes = await request(app.getHttpServer())
        .get(`/projects/${project.id}`)
        .set(authHeader(member.token));
      expect(afterRes.status).toBe(403);
    });
  });

  // ── Delete ──────────────────────────────────────────────────────────────────

  describe('DELETE /projects/:id', () => {
    it('204: owner can delete their project', async () => {
      const project = await createProject(owner.token, 'Deletable Project');

      const res = await request(app.getHttpServer())
        .delete(`/projects/${project.id}`)
        .set(authHeader(owner.token));

      expect(res.status).toBe(200);

      const getRes = await request(app.getHttpServer())
        .get(`/projects/${project.id}`)
        .set(authHeader(owner.token));
      expect(getRes.status).toBe(404);
    });
  });
});
