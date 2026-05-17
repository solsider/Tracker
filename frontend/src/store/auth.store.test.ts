import { beforeEach, describe, it, expect } from 'vitest';
import { useAuthStore } from './auth.store';
import { mockUser } from '../test/mocks/data';

function getState() {
  return useAuthStore.getState();
}

describe('auth.store', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false });
    localStorage.clear();
  });

  describe('initial state', () => {
    it('starts unauthenticated with no user', () => {
      const state = getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });
  });

  describe('setAuth', () => {
    it('stores user and marks authenticated', () => {
      getState().setAuth(mockUser);

      const state = getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
    });

    it('overwrites a previously stored user', () => {
      getState().setAuth(mockUser);
      const updated = { ...mockUser, name: 'Updated Name' };
      getState().setAuth(updated);

      expect(getState().user?.name).toBe('Updated Name');
    });
  });

  describe('clearAuth', () => {
    it('clears all auth state', () => {
      getState().setAuth(mockUser);
      getState().clearAuth();

      const state = getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });

    it('is idempotent when called on an already-cleared store', () => {
      getState().clearAuth();

      const state = getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });
  });
});
