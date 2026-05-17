import type { User, Project, Issue, Sprint, Column } from '../../types';

export const mockUser: User = {
  id: 'user-1',
  email: 'alice@test.com',
  name: 'Alice',
  avatar: null,
  systemRole: 'DEVELOPER',
  position: null,
  department: null,
  timezone: 'Europe/Moscow',
  language: 'ru',
  bio: null,
  twoFactorEnabled: false,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

export const mockUser2: User = {
  id: 'user-2',
  email: 'bob@test.com',
  name: 'Bob',
  avatar: null,
  systemRole: 'DEVELOPER',
  position: null,
  department: null,
  timezone: 'Europe/Moscow',
  language: 'ru',
  bio: null,
  twoFactorEnabled: false,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

export const mockColumn: Column = {
  id: 'col-1',
  title: 'Backlog',
  color: '#64748B',
  order: 0,
  projectId: 'proj-1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

export const mockProject: Project = {
  id: 'proj-1',
  name: 'Test Project',
  description: 'A test project',
  ownerId: 'user-1',
  owner: { id: 'user-1', name: 'Alice', email: 'alice@test.com', avatar: null },
  members: [],
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  _count: { issues: 0, members: 1 },
};

export const mockIssue: Issue = {
  id: 'issue-1',
  number: 1,
  title: 'Fix the bug',
  description: null,
  priority: 'MEDIUM',
  type: 'TASK',
  order: 1,
  dueDate: null,
  startDate: null,
  storyPoints: null,
  sprintId: null,
  projectId: 'proj-1',
  reporterId: 'user-1',
  reporter: { id: 'user-1', name: 'Alice', email: 'alice@test.com', avatar: null },
  assigneeId: null,
  assignee: null,
  columnId: 'col-1',
  column: { id: 'col-1', title: 'Backlog', color: '#64748B', order: 0 },
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

export const mockSprint: Sprint = {
  id: 'sprint-1',
  name: 'Sprint 1',
  goal: 'Ship the MVP',
  status: 'PLANNING',
  startDate: '2025-02-01T00:00:00.000Z',
  endDate: '2025-02-14T00:00:00.000Z',
  completedAt: null,
  capacity: null,
  velocity: null,
  projectId: 'proj-1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  _count: { issues: 0 },
};

export const mockActiveSprint: Sprint = {
  ...mockSprint,
  id: 'sprint-2',
  name: 'Sprint 2',
  status: 'ACTIVE',
};

export const mockAuthResponse = {
  user: mockUser,
};
