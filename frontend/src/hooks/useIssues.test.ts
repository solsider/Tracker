import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mockIssue } from '../test/mocks/data';
import {
  useIssues,
  useIssue,
  useCreateIssue,
  useUpdateIssue,
  useDeleteIssue,
  useMoveIssue,
} from './useIssues';

vi.mock('../api/issues.api', () => ({
  issuesApi: {
    getAll: vi.fn(),
    getByNumber: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    moveToColumn: vi.fn(),
  },
}));

import { issuesApi } from '../api/issues.api';
const api = issuesApi as unknown as Record<string, ReturnType<typeof vi.fn>>;

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

// ── useIssues ───────────────────────────────────────────────────────────────

describe('useIssues', () => {
  it('fetches and returns all issues for a project', async () => {
    api.getAll.mockResolvedValue([mockIssue]);

    const { result } = renderHook(() => useIssues(PROJECT_ID), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].title).toBe('Fix the bug');
    expect(api.getAll).toHaveBeenCalledWith(PROJECT_ID);
  });

  it('does not fetch when projectId is empty', () => {
    const { result } = renderHook(() => useIssues(''), {
      wrapper: makeWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
    expect(api.getAll).not.toHaveBeenCalled();
  });

  it('surfaces a fetch error', async () => {
    api.getAll.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useIssues(PROJECT_ID), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeTruthy();
  });
});

// ── useIssue ────────────────────────────────────────────────────────────────

describe('useIssue', () => {
  it('fetches a single issue by number', async () => {
    api.getByNumber.mockResolvedValue(mockIssue);

    const { result } = renderHook(() => useIssue(PROJECT_ID, 1), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.number).toBe(1);
    expect(api.getByNumber).toHaveBeenCalledWith(PROJECT_ID, 1);
  });

  it('does not fetch when number is 0', () => {
    const { result } = renderHook(() => useIssue(PROJECT_ID, 0), {
      wrapper: makeWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(api.getByNumber).not.toHaveBeenCalled();
  });
});

// ── useCreateIssue ──────────────────────────────────────────────────────────

describe('useCreateIssue', () => {
  it('creates an issue and invalidates the issues query', async () => {
    const created = { ...mockIssue, title: 'New Issue', number: 2 };
    api.create.mockResolvedValue(created);

    const { result } = renderHook(() => useCreateIssue(PROJECT_ID), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      result.current.mutate({ title: 'New Issue', columnId: 'col-1' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.title).toBe('New Issue');
    expect(api.create).toHaveBeenCalledWith(PROJECT_ID, { title: 'New Issue', columnId: 'col-1' });
  });

  it('surfaces a mutation error', async () => {
    api.create.mockRejectedValue(new Error('Validation error'));

    const { result } = renderHook(() => useCreateIssue(PROJECT_ID), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      result.current.mutate({ title: '', columnId: 'col-1' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ── useUpdateIssue ──────────────────────────────────────────────────────────

describe('useUpdateIssue', () => {
  it('updates an issue and returns updated data', async () => {
    const updated = { ...mockIssue, title: 'Updated Title' };
    api.update.mockResolvedValue(updated);

    const { result } = renderHook(() => useUpdateIssue(PROJECT_ID, 1), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      result.current.mutate({ title: 'Updated Title' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.title).toBe('Updated Title');
    expect(api.update).toHaveBeenCalledWith(PROJECT_ID, 1, { title: 'Updated Title' });
  });
});

// ── useDeleteIssue ──────────────────────────────────────────────────────────

describe('useDeleteIssue', () => {
  it('deletes an issue successfully', async () => {
    api.delete.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteIssue(PROJECT_ID), {
      wrapper: makeWrapper(),
    });

    await act(async () => { result.current.mutate(1); });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.delete).toHaveBeenCalledWith(PROJECT_ID, 1);
  });

  it('surfaces an error when delete fails', async () => {
    api.delete.mockRejectedValue(new Error('Not found'));

    const { result } = renderHook(() => useDeleteIssue(PROJECT_ID), {
      wrapper: makeWrapper(),
    });

    await act(async () => { result.current.mutate(999); });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ── useMoveIssue ────────────────────────────────────────────────────────────

describe('useMoveIssue', () => {
  it('moves an issue to a new column', async () => {
    const moved = { ...mockIssue, columnId: 'col-2' };
    api.moveToColumn.mockResolvedValue(moved);

    const { result } = renderHook(() => useMoveIssue(PROJECT_ID), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      result.current.mutate({ id: 'issue-1', columnId: 'col-2' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.moveToColumn).toHaveBeenCalledWith('issue-1', 'col-2', undefined, undefined);
  });

  it('passes afterId and beforeId when provided', async () => {
    api.moveToColumn.mockResolvedValue({ ...mockIssue, columnId: 'col-2' });

    const { result } = renderHook(() => useMoveIssue(PROJECT_ID), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      result.current.mutate({ id: 'issue-1', columnId: 'col-2', afterId: 'issue-0', beforeId: 'issue-2' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.moveToColumn).toHaveBeenCalledWith('issue-1', 'col-2', 'issue-0', 'issue-2');
  });

  it('surfaces an error when move fails', async () => {
    api.moveToColumn.mockRejectedValue(new Error('Column not found'));

    const { result } = renderHook(() => useMoveIssue(PROJECT_ID), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      result.current.mutate({ id: 'issue-1', columnId: 'bad-col' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
