import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LoadingButton } from './LoadingButton';

describe('LoadingButton', () => {
  it('keeps measured width while loading and measures updated idle content', () => {
    const measure = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 184 } as DOMRect);
    const { rerender } = render(<LoadingButton>Enregistrer</LoadingButton>);
    rerender(<LoadingButton loading loadingLabel="En cours">Enregistrer</LoadingButton>);
    expect(screen.getByRole('button')).toHaveStyle({ minWidth: 'min(100%, 184px)' });
    expect(screen.getByRole('button')).toBeDisabled();
    measure.mockReturnValue({ width: 220 } as DOMRect);
    rerender(<LoadingButton>Enregistrer les modifications</LoadingButton>);
    rerender(<LoadingButton loading>Enregistrer les modifications</LoadingButton>);
    expect(screen.getByRole('button')).toHaveStyle({ minWidth: 'min(100%, 220px)' });
    measure.mockRestore();
  });
});
