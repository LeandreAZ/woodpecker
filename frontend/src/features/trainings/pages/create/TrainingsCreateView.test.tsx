import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CreateTrainingView from './TrainingsCreateView';

function renderCreateView(overrides: Partial<Parameters<typeof CreateTrainingView>[0]> = {}) {
  const props = {
    description: '',
    errorMessage: undefined,
    icon: 'rook',
    iconBackgroundColor: '#8b5cf6',
    iconColor: '#ffffff',
    isError: false,
    isPending: false,
    name: '',
    onDescriptionChange: vi.fn(),
    onIconBackgroundColorChange: vi.fn(),
    onIconChange: vi.fn(),
    onIconColorChange: vi.fn(),
    onNameChange: vi.fn(),
    onResetDraft: vi.fn(),
    onSubmit: vi.fn(),
    ...overrides,
  };

  return {
    ...render(<CreateTrainingView {...props} />),
    props,
  };
}

describe('CreateTrainingView', () => {
  it('réinitialise le brouillon une seule fois à l’entrée de la vue', () => {
    const onResetDraft = vi.fn();
    const { rerender, props } = renderCreateView({ onResetDraft, name: 'Mat en 2' });

    expect(onResetDraft).toHaveBeenCalledTimes(1);

    rerender(<CreateTrainingView {...props} name="Mat en 3" />);
    expect(onResetDraft).toHaveBeenCalledTimes(1);
  });

  it('ouvre le customizer create avec le branding par défaut', () => {
    renderCreateView();

    fireEvent.click(screen.getByRole('button', { name: "Personnaliser l'icône" }));

    expect(screen.getByRole('button', { name: 'Tour' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByDisplayValue('#8B5CF6')).toBeInTheDocument();
    expect(screen.getByDisplayValue('#FFFFFF')).toBeInTheDocument();
  });

  it('applique le branding personnalisé puis soumet la création', () => {
    const onIconChange = vi.fn();
    const onIconBackgroundColorChange = vi.fn();
    const onIconColorChange = vi.fn();
    const onSubmit = vi.fn();

    renderCreateView({
      name: 'Mat en 10',
      onIconBackgroundColorChange,
      onIconChange,
      onIconColorChange,
      onSubmit,
    });

    fireEvent.click(screen.getByRole('button', { name: "Personnaliser l'icône" }));
    fireEvent.click(screen.getByRole('button', { name: 'Dame' }));
    fireEvent.change(screen.getByLabelText("Choisir la couleur de fond"), { target: { value: '#3b82f6' } });
    fireEvent.change(screen.getByLabelText("Choisir la couleur de l'icône"), { target: { value: '#facc15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer' }));
    fireEvent.click(screen.getByRole('button', { name: "Créer l'entraînement" }));

    expect(onIconChange).toHaveBeenCalledWith('queen');
    expect(onIconBackgroundColorChange).toHaveBeenCalledWith('#3b82f6');
    expect(onIconColorChange).toHaveBeenCalledWith('#facc15');
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
