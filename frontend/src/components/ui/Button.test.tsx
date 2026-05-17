import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  describe('rendering', () => {
    it('renders with given text', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('applies primary variant styles by default', () => {
      render(<Button>Primary</Button>);
      const btn = screen.getByRole('button');
      expect(btn.className).toContain('bg-dash-accent');
    });

    it('applies secondary variant styles', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const btn = screen.getByRole('button');
      expect(btn.className).toContain('bg-dash-panel');
    });

    it('applies danger variant styles', () => {
      render(<Button variant="danger">Delete</Button>);
      const btn = screen.getByRole('button');
      expect(btn.className).toContain('bg-red-600');
    });

    it('applies ghost variant styles', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const btn = screen.getByRole('button');
      expect(btn.className).toContain('text-dash-muted');
    });
  });

  describe('sizes', () => {
    it('renders sm size', () => {
      render(<Button size="sm">Small</Button>);
      expect(screen.getByRole('button').className).toContain('px-3');
    });

    it('renders md size by default', () => {
      render(<Button>Medium</Button>);
      expect(screen.getByRole('button').className).toContain('px-4');
    });

    it('renders lg size', () => {
      render(<Button size="lg">Large</Button>);
      expect(screen.getByRole('button').className).toContain('px-6');
    });
  });

  describe('loading state', () => {
    it('shows spinner and disables button when loading', () => {
      render(<Button loading>Submit</Button>);
      const btn = screen.getByRole('button');
      expect(btn).toBeDisabled();
      expect(btn.querySelector('svg')).toBeInTheDocument();
    });

    it('is not loading by default', () => {
      render(<Button>Normal</Button>);
      expect(screen.getByRole('button')).not.toBeDisabled();
    });
  });

  describe('disabled state', () => {
    it('disables button when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('applies disabled opacity class', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button').className).toContain('disabled:opacity-40');
    });
  });

  describe('interactions', () => {
    it('calls onClick handler when clicked', async () => {
      const handler = vi.fn();
      render(<Button onClick={handler}>Click</Button>);

      await userEvent.click(screen.getByRole('button'));
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', async () => {
      const handler = vi.fn();
      render(<Button disabled onClick={handler}>Disabled</Button>);

      await userEvent.click(screen.getByRole('button'));
      expect(handler).not.toHaveBeenCalled();
    });

    it('does not call onClick when loading', async () => {
      const handler = vi.fn();
      render(<Button loading onClick={handler}>Loading</Button>);

      await userEvent.click(screen.getByRole('button'));
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('HTML attributes', () => {
    it('passes type attribute', () => {
      render(<Button type="submit">Submit</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });

    it('merges custom className', () => {
      render(<Button className="w-full">Wide</Button>);
      expect(screen.getByRole('button').className).toContain('w-full');
    });
  });
});
