import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/utils/render';
import { LoginPage } from './LoginPage';

// ── Mock the auth hook so tests don't hit the network ──────────────────────

const mockMutate = vi.fn();
const mockSetAuth = vi.fn();

vi.mock('../../hooks/useAuth', () => ({
  useLogin: vi.fn(),
  useRegister: vi.fn(),
}));

vi.mock('../../store/auth.store', () => ({
  useAuthStore: vi.fn((selector?: (s: any) => any) => {
    const state = {
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: mockSetAuth,
      clearAuth: vi.fn(),
    };
    return selector ? selector(state) : state;
  }),
}));

import { useLogin } from '../../hooks/useAuth';
const mockedUseLogin = vi.mocked(useLogin);

function setupLogin(overrides: Partial<{
  isPending: boolean;
  error: any;
  mutate: typeof mockMutate;
}> = {}) {
  mockedUseLogin.mockReturnValue({
    mutate: overrides.mutate ?? mockMutate,
    isPending: overrides.isPending ?? false,
    isError: !!overrides.error,
    error: overrides.error ?? null,
    isSuccess: false,
    isIdle: true,
    data: undefined,
    reset: vi.fn(),
    mutateAsync: vi.fn(),
    failureCount: 0,
    failureReason: null,
    status: 'idle',
    variables: undefined,
    context: undefined,
    submittedAt: 0,
  } as any);
}

function renderLogin() {
  return renderWithProviders(<LoginPage />);
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupLogin();
  });

  // ── Rendering ────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('shows email and password fields', () => {
      renderLogin();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/пароль/i)).toBeInTheDocument();
    });

    it('shows a login submit button', () => {
      renderLogin();
      expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument();
    });

    it('has a link to the registration page', () => {
      renderLogin();
      expect(screen.getByRole('link', { name: /зарегистрироваться/i })).toBeInTheDocument();
    });

    it('does not show the 2FA input initially', () => {
      renderLogin();
      expect(screen.queryByLabelText(/двухфакторн/i)).not.toBeInTheDocument();
    });
  });

  // ── Form submission ───────────────────────────────────────────────────────

  describe('form submission', () => {
    it('calls login.mutate with email and password on submit', async () => {
      renderLogin();

      await userEvent.type(screen.getByLabelText(/email/i), 'alice@test.com');
      await userEvent.type(screen.getByLabelText(/пароль/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /войти/i }));

      expect(mockMutate).toHaveBeenCalledWith(
        { email: 'alice@test.com', password: 'password123', twoFactorCode: undefined },
        expect.objectContaining({ onError: expect.any(Function) }),
      );
    });

    it('does not submit with empty fields', async () => {
      renderLogin();
      await userEvent.click(screen.getByRole('button', { name: /войти/i }));
      // HTML5 required validation prevents submission with empty required fields
      expect(mockMutate).not.toHaveBeenCalled();
    });
  });

  // ── 2FA flow ──────────────────────────────────────────────────────────────

  describe('2FA flow', () => {
    it('shows 2FA input when onError receives "Two-factor code required"', async () => {
      // Capture the onError callback passed to mutate
      let capturedOnError: ((err: any) => void) | undefined;
      setupLogin({
        mutate: vi.fn((_data, opts: any) => {
          capturedOnError = opts?.onError;
        }),
      });

      renderLogin();

      await userEvent.type(screen.getByLabelText(/email/i), 'alice@test.com');
      await userEvent.type(screen.getByLabelText(/пароль/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /войти/i }));

      // Simulate the server responding with 2FA required
      act(() => {
        capturedOnError?.({ response: { data: { message: 'Two-factor code required' } } });
      });

      expect(screen.getByLabelText(/двухфакторн/i)).toBeInTheDocument();
    });

    it('changes button label to "Подтвердить" in 2FA step', async () => {
      let capturedOnError: ((err: any) => void) | undefined;
      setupLogin({
        mutate: vi.fn((_data, opts: any) => {
          capturedOnError = opts?.onError;
        }),
      });

      renderLogin();

      await userEvent.type(screen.getByLabelText(/email/i), 'alice@test.com');
      await userEvent.type(screen.getByLabelText(/пароль/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /войти/i }));

      act(() => {
        capturedOnError?.({ response: { data: { message: 'Two-factor code required' } } });
      });

      expect(screen.getByRole('button', { name: /подтвердить/i })).toBeInTheDocument();
    });
  });

  // ── Error display ─────────────────────────────────────────────────────────

  describe('error display', () => {
    it('shows "Неверный email или пароль" for Invalid credentials error', () => {
      setupLogin({
        error: { response: { data: { message: 'Invalid credentials' } } },
      });

      renderLogin();

      expect(screen.getByText(/неверный email или пароль/i)).toBeInTheDocument();
    });

    it('shows 2FA error message for invalid 2FA code', () => {
      setupLogin({
        error: { response: { data: { message: 'Invalid two-factor code' } } },
      });

      renderLogin();

      expect(screen.getByText(/неверный код 2fa/i)).toBeInTheDocument();
    });

    it('does not show an error when login is idle', () => {
      setupLogin();
      renderLogin();
      expect(screen.queryByText(/неверный/i)).not.toBeInTheDocument();
    });
  });

  // ── Loading state ─────────────────────────────────────────────────────────

  describe('loading state', () => {
    it('disables the submit button while loading', () => {
      setupLogin({ isPending: true });
      renderLogin();
      expect(screen.getByRole('button', { name: /войти/i })).toBeDisabled();
    });

    it('disables the email and password inputs while loading', () => {
      setupLogin({ isPending: true });
      renderLogin();
      expect(screen.getByLabelText(/email/i)).toBeDisabled();
      expect(screen.getByLabelText(/пароль/i)).toBeDisabled();
    });

    it('enables inputs when not loading', () => {
      setupLogin({ isPending: false });
      renderLogin();
      expect(screen.getByLabelText(/email/i)).not.toBeDisabled();
    });
  });
});
