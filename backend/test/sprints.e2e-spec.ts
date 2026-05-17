import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, registerTestUser, authHeader, createTestProject, TestUser } from './helpers/app.helper';

describe('Sprints (e2e)', () => {
  let app: INestApplication;
  let user: TestUser;
  let projectId: string;

  beforeAll(async () => {
    app = await createTestApp();
    user = await registerTestUser(app, `sprint_${Date.now()}`);
    projectId = await createTestProject(app, user.token);
  });

  afterAll(async () => {
    await app.close();
  });

  async function createSprint(data: {
    name: string;
    goal?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const res = await request(app.getHttpServer())
      .post(`/projects/${projectId}/sprints`)
      .set(authHeader(user.token))
      .send(data);
    expect(res.status).toBe(201);
    return res.body;
  }

  // ── Create sprint ────────────────────────────────────────────────────────────

  describe('POST /projects/:id/sprints', () => {
    it('201: creates sprint with PLANNING status', async () => {
      const res = await request(app.getHttpServer())
        .post(`/projects/${projectId}/sprints`)
        .set(authHeader(user.token))
        .send({ name: 'Sprint Alpha' });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Sprint Alpha');
      expect(res.body.status).toBe('PLANNING');
      expect(res.body.projectId).toBe(projectId);
    });

    it('201: creates sprint with goal and dates', async () => {
      const res = await request(app.getHttpServer())
        .post(`/projects/${projectId}/sprints`)
        .set(authHeader(user.token))
        .send({
          name: 'Sprint Beta',
          goal: 'Ship the MVP',
          startDate: '2025-02-01',
          endDate: '2025-02-14',
        });

      expect(res.status).toBe(201);
      expect(res.body.goal).toBe('Ship the MVP');
      expect(res.body.startDate).toBeDefined();
      expect(res.body.endDate).toBeDefined();
    });

    it('400: rejects sprint without name', async () => {
      const res = await request(app.getHttpServer())
        .post(`/projects/${projectId}/sprints`)
        .set(authHeader(user.token))
        .send({});

      expect(res.status).toBe(400);
    });

    it('401: rejects unauthenticated request', async () => {
      const res = await request(app.getHttpServer())
        .post(`/projects/${projectId}/sprints`)
        .send({ name: 'Anon Sprint' });

      expect(res.status).toBe(401);
    });
  });

  // ── List sprints ─────────────────────────────────────────────────────────────

  describe('GET /projects/:id/sprints', () => {
    it('200: returns list of sprints for the project', async () => {
      const res = await request(app.getHttpServer())
        .get(`/projects/${projectId}/sprints`)
        .set(authHeader(user.token));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ── Sprint lifecycle ──────────────────────────────────────────────────────────

  describe('Sprint lifecycle: PLANNING → ACTIVE → COMPLETED', () => {
    let sprintId: string;

    beforeEach(async () => {
      const sprint = await createSprint({ name: `Lifecycle ${Date.now()}` });
      sprintId = sprint.id;
    });

    it('starts a PLANNING sprint', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/sprints/${sprintId}/start`)
        .set(authHeader(user.token));

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ACTIVE');
    });

    it('completes an ACTIVE sprint', async () => {
      await request(app.getHttpServer())
        .patch(`/sprints/${sprintId}/start`)
        .set(authHeader(user.token));

      const res = await request(app.getHttpServer())
        .patch(`/sprints/${sprintId}/complete`)
        .set(authHeader(user.token));

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('COMPLETED');
      expect(res.body.completedAt).toBeDefined();
    });

    it('blocks starting a second sprint when one is already active', async () => {
      // Start the first sprint
      await request(app.getHttpServer())
        .patch(`/sprints/${sprintId}/start`)
        .set(authHeader(user.token));

      // Create a second sprint
      const sprint2 = await createSprint({ name: `Second ${Date.now()}` });

      // Try to start the second sprint — should fail
      const res = await request(app.getHttpServer())
        .patch(`/sprints/${sprint2.id}/start`)
        .set(authHeader(user.token));

      expect(res.status).toBe(400);

      // Cleanup: complete the first sprint
      await request(app.getHttpServer())
        .patch(`/sprints/${sprintId}/complete`)
        .set(authHeader(user.token));
    });

    it('cannot start a COMPLETED sprint', async () => {
      // Start then complete
      await request(app.getHttpServer())
        .patch(`/sprints/${sprintId}/start`)
        .set(authHeader(user.token));
      await request(app.getHttpServer())
        .patch(`/sprints/${sprintId}/complete`)
        .set(authHeader(user.token));

      // Try to start again
      const res = await request(app.getHttpServer())
        .patch(`/sprints/${sprintId}/start`)
        .set(authHeader(user.token));

      expect(res.status).toBe(400);
    });

    it('cannot complete a PLANNING sprint directly', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/sprints/${sprintId}/complete`)
        .set(authHeader(user.token));

      expect(res.status).toBe(400);
    });
  });

  // ── Update sprint ─────────────────────────────────────────────────────────────

  describe('PATCH /sprints/:id', () => {
    it('200: updates sprint name and goal', async () => {
      const sprint = await createSprint({ name: 'Old Name' });

      const res = await request(app.getHttpServer())
        .patch(`/sprints/${sprint.id}`)
        .set(authHeader(user.token))
        .send({ name: 'New Name', goal: 'New Goal' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('New Name');
      expect(res.body.goal).toBe('New Goal');
    });

    it('400: cannot update a COMPLETED sprint', async () => {
      const sprint = await createSprint({ name: 'Completed Sprint' });

      await request(app.getHttpServer())
        .patch(`/sprints/${sprint.id}/start`)
        .set(authHeader(user.token));
      await request(app.getHttpServer())
        .patch(`/sprints/${sprint.id}/complete`)
        .set(authHeader(user.token));

      const res = await request(app.getHttpServer())
        .patch(`/sprints/${sprint.id}`)
        .set(authHeader(user.token))
        .send({ name: 'Try Update' });

      expect(res.status).toBe(400);
    });
  });

  // ── Delete sprint ─────────────────────────────────────────────────────────────

  describe('DELETE /sprints/:id', () => {
    it('200: deletes a PLANNING sprint', async () => {
      const sprint = await createSprint({ name: 'To Delete' });

      const res = await request(app.getHttpServer())
        .delete(`/sprints/${sprint.id}`)
        .set(authHeader(user.token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('400: cannot delete an ACTIVE sprint', async () => {
      const sprint = await createSprint({ name: 'Active Sprint' });

      await request(app.getHttpServer())
        .patch(`/sprints/${sprint.id}/start`)
        .set(authHeader(user.token));

      const res = await request(app.getHttpServer())
        .delete(`/sprints/${sprint.id}`)
        .set(authHeader(user.token));

      expect(res.status).toBe(400);

      // Cleanup
      await request(app.getHttpServer())
        .patch(`/sprints/${sprint.id}/complete`)
        .set(authHeader(user.token));
    });
  });

  // ── Backlog ───────────────────────────────────────────────────────────────────

  describe('GET /projects/:id/backlog', () => {
    it('200: returns issues with no sprint', async () => {
      const res = await request(app.getHttpServer())
        .get(`/projects/${projectId}/backlog`)
        .set(authHeader(user.token));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach((issue: any) => {
        expect(issue.sprintId).toBeNull();
      });
    });
  });
});
