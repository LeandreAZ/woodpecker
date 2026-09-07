import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TrainingIconCustomizer } from './TrainingIconCustomizer';

function renderCustomizer() {
  return render(
    <TrainingIconCustomizer
      isOpen
      onApply={vi.fn()}
      onClose={vi.fn()}
      value={{
        icon: 'rook',
        iconBackgroundColor: '#8b5cf6',
        iconColor: '#ffffff',
      }}
    />,
  );
}

describe('TrainingIconCustomizer', () => {
  it('synchronise le picker de fond, le champ HEX et l’aperçu', () => {
    const { container } = renderCustomizer();
    const backgroundPicker = screen.getByLabelText('Choisir la couleur de fond') as HTMLInputElement;
    const backgroundHex = screen.getByDisplayValue('#8B5CF6') as HTMLInputElement;
    const badge = container.querySelector('.wp-training-brand') as HTMLElement;

    fireEvent.change(backgroundHex, { target: { value: '#123456' } });
    expect(backgroundPicker.value).toBe('#123456');
    expect(badge.style.getPropertyValue('--training-brand-background')).toBe('#123456');

    fireEvent.change(backgroundPicker, { target: { value: '#3b82f6' } });
    expect(backgroundHex.value).toBe('#3B82F6');
    expect(badge.style.getPropertyValue('--training-brand-background')).toBe('#3b82f6');
  });

  it('synchronise le picker d’icône, le champ HEX et l’aperçu', () => {
    const { container } = renderCustomizer();
    const iconPicker = screen.getByLabelText("Choisir la couleur de l'icône") as HTMLInputElement;
    const iconHex = screen.getByDisplayValue('#FFFFFF') as HTMLInputElement;
    const badge = container.querySelector('.wp-training-brand') as HTMLElement;

    fireEvent.change(iconHex, { target: { value: '#fedcba' } });
    expect(iconPicker.value).toBe('#fedcba');
    expect(badge.style.getPropertyValue('--training-brand-color')).toBe('#fedcba');

    fireEvent.change(iconPicker, { target: { value: '#22c55e' } });
    expect(iconHex.value).toBe('#22C55E');
    expect(badge.style.getPropertyValue('--training-brand-color')).toBe('#22c55e');
  });
});
