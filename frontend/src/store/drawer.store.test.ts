import { beforeEach, describe, it, expect } from 'vitest';
import { useDrawerStore } from './drawer.store';

function getState() {
  return useDrawerStore.getState();
}

describe('drawer.store', () => {
  beforeEach(() => {
    useDrawerStore.setState({ isOpen: false, projectId: null, issueNumber: null });
  });

  describe('initial state', () => {
    it('starts closed with no project or issue', () => {
      const state = getState();
      expect(state.isOpen).toBe(false);
      expect(state.projectId).toBeNull();
      expect(state.issueNumber).toBeNull();
    });
  });

  describe('open', () => {
    it('opens the drawer with given projectId and issueNumber', () => {
      getState().open('proj-1', 42);

      const state = getState();
      expect(state.isOpen).toBe(true);
      expect(state.projectId).toBe('proj-1');
      expect(state.issueNumber).toBe(42);
    });

    it('can switch to a different issue without closing first', () => {
      getState().open('proj-1', 1);
      getState().open('proj-2', 99);

      const state = getState();
      expect(state.projectId).toBe('proj-2');
      expect(state.issueNumber).toBe(99);
      expect(state.isOpen).toBe(true);
    });

    it('opens for issue number 1 (edge case: falsy-ish value)', () => {
      getState().open('proj-1', 1);
      expect(getState().issueNumber).toBe(1);
    });
  });

  describe('close', () => {
    it('closes the drawer and clears project and issue', () => {
      getState().open('proj-1', 5);
      getState().close();

      const state = getState();
      expect(state.isOpen).toBe(false);
      expect(state.projectId).toBeNull();
      expect(state.issueNumber).toBeNull();
    });

    it('is safe to call when already closed', () => {
      getState().close();

      const state = getState();
      expect(state.isOpen).toBe(false);
      expect(state.projectId).toBeNull();
    });
  });

  describe('open/close cycles', () => {
    it('supports multiple open/close cycles', () => {
      for (let i = 1; i <= 3; i++) {
        getState().open('proj-1', i);
        expect(getState().issueNumber).toBe(i);
        getState().close();
        expect(getState().isOpen).toBe(false);
      }
    });
  });
});
