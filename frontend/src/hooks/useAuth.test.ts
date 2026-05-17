import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { mockAuthResponse } from '../test/mocks/data';
import { useLogin, useRegister } from './useAuth';

vi.mock('../api/auth.api', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
  },
}));

const mockSetAuth = vi.fn();
const mockClearAuth = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../store/auth.store', () => ({
  useAuthStore: vi.fn((selector?: (s: any) => any) => {
    const state = { setAuth: mockSetAuth, clearAuth: mockClearAuth };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

import { authApi } from '../api/auth.api';
const api = authApi as unknown as Record<string, ReturnType<typeof vi.fn>>;

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      QueryClientProvider,
      { client: qc },
      React.createElement(MemoryRouter, null, children),
    );
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── useLogin ─────────────────────────────────────────────────────────────────

describe('useLogin', () => {
  it('calls authApi.login with credentials', async () => {
    api.login.mockResolvedValue(mockAuthResponse);

    const { result } = renderHook(() => useLogin(), { wrapper: makeWrapper() });

    await act(async () => {
      result.current.mutate({ email: 'alice@test.com', password: 'secret' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.login).toHaveBeenCalledWith(
      { email: 'alice@test.com', password: 'secret' },
      expect.objectContaining({ client: expect.any(Object) }),
    );
  });

  it('calls setAuth and navigates to /projects on success', async () => {
    api.login.mockResolvedValue(mockAuthResponse);

    const { result } = renderHook(() => useLogin(), { wrapper: makeWrapper() });

    await act(async () => {
      result.current.mutate({ email: 'alice@test.com', password: 'secret' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockSetAuth).toHaveBeenCalledWith(mockAuthResponse.user);
    expect(mockNavigate).toHaveBeenCalledWith('/projects');
  });

  it('surfaces an error on invalid credentials', async () => {
    api.login.mockRejectedValue({ response: { data: { message: 'Invalid credentials' } } });

    const { result } = renderHook(() => useLogin(), { wrapper: makeWrapper() });

    await act(async () => {
      result.current.mutate({ email: 'bad@test.com', password: 'wrong' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockSetAuth).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

// ── useRegister ───────────────────────────────────────────────────────────────

describe('useRegister', () => {
  it('calls authApi.register with user data', async () => {
    api.register.mockResolvedValue(mockAuthResponse);

    const { result } = renderHook(() => useRegister(), { wrapper: makeWrapper() });

    await act(async () => {
      result.current.mutate({ email: 'new@test.com', password: 'password123', name: 'New User' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.register).toHaveBeenCalledWith(
      { email: 'new@test.com', password: 'password123', name: 'New User' },
      expect.objectContaining({ client: expect.any(Object) }),
    );
  });

  it('calls setAuth and navigates to /projects on success', async () => {
    api.register.mockResolvedValue(mockAuthResponse);

    const { result } = renderHook(() => useRegister(), { wrapper: makeWrapper() });

    await act(async () => {
      result.current.mutate({ email: 'new@test.com', password: 'password123', name: 'New User' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockSetAuth).toHaveBeenCalledWith(mockAuthResponse.user);
    expect(mockNavigate).toHaveBeenCalledWith('/projects');
  });

  it('surfaces an error on duplicate email', async () => {
    api.register.mockRejectedValue({ response: { data: { message: 'Email already in use' } } });

    const { result } = renderHook(() => useRegister(), { wrapper: makeWrapper() });

    await act(async () => {
      result.current.mutate({ email: 'existing@test.com', password: 'pass', name: 'Dupe' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockSetAuth).not.toHaveBeenCalled();
  });
});
