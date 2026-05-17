import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './Modal';

const noop = () => {};

describe('Modal', () => {
  describe('visibility', () => {
    it('renders nothing when isOpen is false', () => {
      render(<Modal isOpen={false} onClose={noop} title="Hidden"><p>Content</p></Modal>);
      expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
      expect(screen.queryByText('Content')).not.toBeInTheDocument();
    });

    it('renders title and children when isOpen is true', () => {
      render(<Modal isOpen onClose={noop} title="My Modal"><p>Modal body</p></Modal>);
      expect(screen.getByText('My Modal')).toBeInTheDocument();
      expect(screen.getByText('Modal body')).toBeInTheDocument();
    });
  });

  describe('close behaviour', () => {
    it('calls onClose when the X button is clicked', async () => {
      const onClose = vi.fn();
      render(<Modal isOpen onClose={onClose} title="Test"><p>Content</p></Modal>);

      // The SVG close button is rendered; find it via role or title
      const buttons = screen.getAllByRole('button');
      await userEvent.click(buttons[0]);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when the backdrop is clicked', async () => {
      const onClose = vi.fn();
      render(<Modal isOpen onClose={onClose} title="Test"><p>Content</p></Modal>);

      // The backdrop is the fixed inset div rendered before the modal card
      const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/60') as HTMLElement;
      if (backdrop) await userEvent.click(backdrop);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Escape key is pressed', async () => {
      const onClose = vi.fn();
      render(<Modal isOpen onClose={onClose} title="Esc Test"><p>Content</p></Modal>);

      await userEvent.keyboard('{Escape}');

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('size variants', () => {
    it('applies max-w-sm for size="sm"', () => {
      render(<Modal isOpen onClose={noop} title="Small" size="sm"><span /></Modal>);
      const card = document.querySelector('.max-w-sm');
      expect(card).toBeInTheDocument();
    });

    it('applies max-w-lg for default size (md)', () => {
      render(<Modal isOpen onClose={noop} title="Medium"><span /></Modal>);
      const card = document.querySelector('.max-w-lg');
      expect(card).toBeInTheDocument();
    });

    it('applies max-w-2xl for size="lg"', () => {
      render(<Modal isOpen onClose={noop} title="Large" size="lg"><span /></Modal>);
      const card = document.querySelector('.max-w-2xl');
      expect(card).toBeInTheDocument();
    });
  });

  describe('content', () => {
    it('renders arbitrary JSX children', () => {
      render(
        <Modal isOpen onClose={noop} title="Rich">
          <input data-testid="inner-input" />
          <button>Inner button</button>
        </Modal>,
      );
      expect(screen.getByTestId('inner-input')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Inner button' })).toBeInTheDocument();
    });
  });
});
