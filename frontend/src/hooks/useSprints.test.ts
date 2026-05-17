import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mockSprint, mockActiveSprint } from '../test/mocks/data';
import {
  useSprints,
  useCreateSprint,
  useStartSprint,
  useCompleteSprint,
  useDeleteSprint,
  useBacklog,
} from './useSprints';

// Mock the API module so no real HTTP is made
vi.mock('../api/sprints.api', () => ({
  sprintsApi: {
    getByProject: vi.fn(),
    getBacklog: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    start: vi.fn(),
    complete: vi.fn(),
    delete: vi.fn(),
  },
}));

// Import after mocking so we get the mock version
import { sprintsApi } from '../api/sprints.api';
const api = sprintsApi as unknown as Record<string, ReturnType<typeof vi.fn>>;

const PROJECT_ID = 'proj-1';

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── useSprints ──────────────────────────────────────────────────────────────

describe('useSprints', () => {
  it('fetches and returns sprints for a project', async () => {
    api.getByProject.mockResolvedValue([mockSprint, mockActiveSprint]);

    const { result } = renderHook(() => useSprints(PROJECT_ID), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data![0].name).toBe(mockSprint.name);
    expect(result.current.data![1].status).toBe('ACTIVE');
    expect(api.getByProject).toHaveBeenCalledWith(PROJECT_ID);
  });

  it('does not fetch when projectId is empty', () => {
    const { result } = renderHook(() => useSprints(''), {
      wrapper: makeWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
    expect(api.getByProject).not.toHaveBeenCalled();
  });

  it('surfaces a fetch error', async () => {
    api.getByProject.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useSprints(PROJECT_ID), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeTruthy();
  });
});

// ── useBacklog ──────────────────────────────────────────────────────────────

describe('useBacklog', () => {
  it('fetches backlog issues (no sprint assigned)', async () => {
    const backlogIssue = { id: 'issue-1', title: 'Backlog', sprintId: null };
    api.getBacklog.mockResolvedValue([backlogIssue]);

    const { result } = renderHook(() => useBacklog(PROJECT_ID), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].sprintId).toBeNull();
  });
});

// ── useCreateSprint ─────────────────────────────────────────────────────────

describe('useCreateSprint', () => {
  it('creates a sprint and returns it', async () => {
    api.create.mockResolvedValue({ ...mockSprint, name: 'New Sprint' });

    const { result } = renderHook(() => useCreateSprint(PROJECT_ID), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      result.current.mutate({ name: 'New Sprint' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.name).toBe('New Sprint');
    expect(api.create).toHaveBeenCalledWith(PROJECT_ID, { name: 'New Sprint' });
  });

  it('surfaces a mutation error', async () => {
    api.create.mockRejectedValue(new Error('Bad request'));

    const { result } = renderHook(() => useCreateSprint(PROJECT_ID), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      result.current.mutate({ name: '' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ── useStartSprint ──────────────────────────────────────────────────────────

describe('useStartSprint', () => {
  it('starts a sprint and returns ACTIVE status', async () => {
    api.start.mockResolvedValue({ ...mockSprint, status: 'ACTIVE' });

    const { result } = renderHook(() => useStartSprint(PROJECT_ID), {
      wrapper: makeWrapper(),
    });

    await act(async () => { result.current.mutate('sprint-1'); });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.status).toBe('ACTIVE');
    expect(api.start).toHaveBeenCalledWith('sprint-1');
  });
});

// ── useCompleteSprint ───────────────────────────────────────────────────────

describe('useCompleteSprint', () => {
  it('completes a sprint and returns COMPLETED status', async () => {
    const completedAt = new Date().toISOString();
    api.complete.mockResolvedValue({ ...mockSprint, status: 'COMPLETED', completedAt });

    const { result } = renderHook(() => useCompleteSprint(PROJECT_ID), {
      wrapper: makeWrapper(),
    });

    await act(async () => { result.current.mutate('sprint-1'); });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.status).toBe('COMPLETED');
    expect(result.current.data?.completedAt).toBe(completedAt);
  });
});

// ── useDeleteSprint ─────────────────────────────────────────────────────────

describe('useDeleteSprint', () => {
  it('deletes a sprint successfully', async () => {
    api.delete.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteSprint(PROJECT_ID), {
      wrapper: makeWrapper(),
    });

    await act(async () => { result.current.mutate('sprint-1'); });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.delete).toHaveBeenCalledWith('sprint-1');
  });

  it('surfaces an error when delete fails', async () => {
    api.delete.mockRejectedValue(new Error('Cannot delete an active sprint'));

    const { result } = renderHook(() => useDeleteSprint(PROJECT_ID), {
      wrapper: makeWrapper(),
    });

    await act(async () => { result.current.mutate('sprint-active'); });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
