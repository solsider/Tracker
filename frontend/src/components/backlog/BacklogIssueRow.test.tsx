import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/utils/render';
import { mockIssue } from '../../test/mocks/data';
import { BacklogIssueRow } from './BacklogIssueRow';

// dnd-kit requires a DndContext; mock the hook to avoid that complexity
vi.mock('@dnd-kit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dnd-kit/core')>();
  return {
    ...actual,
    useDraggable: () => ({
      attributes: { role: 'button' },
      listeners: {},
      setNodeRef: vi.fn(),
      transform: null,
      isDragging: false,
    }),
  };
});

const mockOpenDrawer = vi.fn();

vi.mock('../../store/drawer.store', () => ({
  useDrawerStore: vi.fn((selector: (s: any) => any) =>
    selector({ open: mockOpenDrawer, close: vi.fn(), issue: null, projectId: null }),
  ),
}));

const mockOnUpdateSP = vi.fn();

function renderRow(overrides: Partial<typeof mockIssue> = {}) {
  const issue = { ...mockIssue, ...overrides };
  return renderWithProviders(
    <BacklogIssueRow issue={issue} projectId="proj-1" onUpdateSP={mockOnUpdateSP} />,
  );
}

describe('BacklogIssueRow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('shows the issue title', () => {
      renderRow();
      expect(screen.getByText('Fix the bug')).toBeInTheDocument();
    });

    it('shows the issue number', () => {
      renderRow();
      expect(screen.getByText('#1')).toBeInTheDocument();
    });

    it('shows a dot (·) when storyPoints is null', () => {
      renderRow({ storyPoints: null });
      expect(screen.getByTitle('Story Points')).toHaveTextContent('·');
    });

    it('shows the story points value when set', () => {
      renderRow({ storyPoints: 5 });
      expect(screen.getByTitle('Story Points')).toHaveTextContent('5');
    });

    it('shows assignee initial when assigned', () => {
      renderRow({ assignee: { id: 'user-1', name: 'Alice', email: 'alice@test.com', avatar: null } });
      expect(screen.getByTitle('Alice')).toHaveTextContent('A');
    });

    it('shows "?" when unassigned', () => {
      renderRow({ assignee: null });
      expect(screen.getByTitle('Не назначен')).toHaveTextContent('?');
    });
  });

  // ── Drawer open ───────────────────────────────────────────────────────────

  describe('drawer open', () => {
    it('opens the drawer with correct projectId and issue number on title click', async () => {
      renderRow();
      await userEvent.click(screen.getByText('Fix the bug'));
      expect(mockOpenDrawer).toHaveBeenCalledWith('proj-1', 1);
    });
  });

  // ── Story Points picker ───────────────────────────────────────────────────

  describe('story points picker', () => {
    it('opens the SP picker on SP button click', async () => {
      renderRow();
      await userEvent.click(screen.getByTitle('Story Points'));
      // Fibonacci values should appear
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('13')).toBeInTheDocument();
      expect(screen.getByText('21')).toBeInTheDocument();
    });

    it('calls onUpdateSP with selected fibonacci value', async () => {
      renderRow();
      await userEvent.click(screen.getByTitle('Story Points'));
      await userEvent.click(screen.getByText('8'));
      expect(mockOnUpdateSP).toHaveBeenCalledWith(1, 8);
    });

    it('calls onUpdateSP with null when clear button clicked', async () => {
      renderRow({ storyPoints: 5 });
      await userEvent.click(screen.getByTitle('Story Points'));
      await userEvent.click(screen.getByText('—'));
      expect(mockOnUpdateSP).toHaveBeenCalledWith(1, null);
    });

    it('closes the picker after selecting a value', async () => {
      renderRow();
      await userEvent.click(screen.getByTitle('Story Points'));
      expect(screen.getByText('13')).toBeInTheDocument();
      await userEvent.click(screen.getByText('3'));
      expect(screen.queryByText('13')).not.toBeInTheDocument();
    });

    it('closes the picker on outside click', async () => {
      renderRow();
      await userEvent.click(screen.getByTitle('Story Points'));
      expect(screen.getByText('21')).toBeInTheDocument();
      fireEvent.mouseDown(document.body);
      expect(screen.queryByText('21')).not.toBeInTheDocument();
    });
  });

  // ── Dragging state ────────────────────────────────────────────────────────

  describe('dragging state', () => {
    it('does not have opacity-30 class when not dragging', () => {
      renderRow();
      const row = screen.getByText('Fix the bug').closest('div[class]');
      expect(row?.className).not.toContain('opacity-30');
    });
  });
});
