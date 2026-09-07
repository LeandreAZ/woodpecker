import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from './Modal';

describe('Modal', () => {
  it('uses the latest close callback without moving focus on rerender', () => {
    const first = vi.fn();
    const next = vi.fn();
    const { rerender } = render(
      <Modal open onClose={first}>
        <button>Premier</button>
        <button>Dernier</button>
      </Modal>,
    );
    const last = screen.getByRole('button', { name: 'Dernier' });
    last.focus();
    rerender(
      <Modal open onClose={next}>
        <button>Premier</button>
        <button>Dernier</button>
      </Modal>,
    );
    expect(last).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(first).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledOnce();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(screen.getByRole('button', { name: 'Premier' })).toHaveFocus();
  });
  it('restores focus and page scrolling on close', () => {
    const trigger = document.createElement('button');
    document.body.append(trigger);
    trigger.focus();
    const { unmount } = render(
      <Modal open>
        <button>Fermer</button>
      </Modal>,
    );
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
    expect(trigger).toHaveFocus();
    trigger.remove();
  });
});
