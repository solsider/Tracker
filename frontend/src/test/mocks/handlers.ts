import { http, HttpResponse } from 'msw';
import {
  mockAuthResponse,
  mockProject,
  mockIssue,
  mockSprint,
  mockActiveSprint,
  mockUser,
  mockColumn,
} from './data';

const BASE = '/api';

export const handlers = [
  // ── Auth ────────────────────────────────────────────────────────────────────

  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const body = await request.json() as any;
    if (body.email === 'alice@test.com' && body.password === 'password123') {
      return HttpResponse.json(mockAuthResponse, { status: 200 });
    }
    return HttpResponse.json(
      { message: 'Invalid credentials' },
      { status: 401 },
    );
  }),

  http.post(`${BASE}/auth/register`, async ({ request }) => {
    const body = await request.json() as any;
    if (body.email === 'existing@test.com') {
      return HttpResponse.json(
        { message: 'User with this email already exists' },
        { status: 409 },
      );
    }
    return HttpResponse.json(mockAuthResponse, { status: 201 });
  }),

  http.get(`${BASE}/auth/me`, () => {
    return HttpResponse.json(mockUser, { status: 200 });
  }),

  // ── Projects ────────────────────────────────────────────────────────────────

  http.get(`${BASE}/projects`, () => {
    return HttpResponse.json([mockProject]);
  }),

  http.get(`${BASE}/projects/:id`, ({ params }) => {
    if (params.id === mockProject.id) {
      return HttpResponse.json(mockProject);
    }
    return HttpResponse.json({ message: 'Project not found' }, { status: 404 });
  }),

  http.post(`${BASE}/projects`, async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({ ...mockProject, name: body.name }, { status: 201 });
  }),

  // ── Issues ──────────────────────────────────────────────────────────────────

  http.get(`${BASE}/projects/:projectId/issues`, () => {
    return HttpResponse.json([mockIssue]);
  }),

  http.get(`${BASE}/projects/:projectId/issues/:number`, ({ params }) => {
    if (Number(params.number) === mockIssue.number) {
      return HttpResponse.json(mockIssue);
    }
    return HttpResponse.json({ message: 'Issue not found' }, { status: 404 });
  }),

  http.post(`${BASE}/projects/:projectId/issues`, async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({ ...mockIssue, title: body.title }, { status: 201 });
  }),

  http.patch(`${BASE}/projects/:projectId/issues/:number`, async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({ ...mockIssue, ...body });
  }),

  // ── Columns ─────────────────────────────────────────────────────────────────

  http.get(`${BASE}/projects/:projectId/columns`, () => {
    return HttpResponse.json([mockColumn]);
  }),

  // ── Sprints ──────────────────────────────────────────────────────────────────

  http.get(`${BASE}/projects/:projectId/sprints`, () => {
    return HttpResponse.json([mockSprint, mockActiveSprint]);
  }),

  http.get(`${BASE}/projects/:projectId/backlog`, () => {
    return HttpResponse.json([mockIssue]);
  }),

  http.post(`${BASE}/projects/:projectId/sprints`, async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({ ...mockSprint, name: body.name }, { status: 201 });
  }),

  http.patch(`${BASE}/sprints/:id`, async ({ params, request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({ ...mockSprint, id: params.id as string, ...body });
  }),

  http.patch(`${BASE}/sprints/:id/start`, ({ params }) => {
    return HttpResponse.json({ ...mockSprint, id: params.id as string, status: 'ACTIVE' });
  }),

  http.patch(`${BASE}/sprints/:id/complete`, ({ params }) => {
    return HttpResponse.json({
      ...mockSprint,
      id: params.id as string,
      status: 'COMPLETED',
      completedAt: new Date().toISOString(),
    });
  }),

  http.delete(`${BASE}/sprints/:id`, () => {
    return HttpResponse.json({ success: true });
  }),
];
