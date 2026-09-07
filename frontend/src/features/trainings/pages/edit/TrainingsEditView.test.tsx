import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import EditTrainingView from './TrainingsEditView';

function renderEditView(overrides: Partial<Parameters<typeof EditTrainingView>[0]> = {}) {
  const props = {
    description: 'Entraînement basé sur des mats en 10 coups ou moins.',
    icon: 'knight',
    iconBackgroundColor: '#8b5cf6',
    iconColor: '#ffffff',
    isError: false,
    isLoading: false,
    isPending: false,
    name: 'Mat en 10',
    onDescriptionChange: vi.fn(),
    onIconBackgroundColorChange: vi.fn(),
    onIconChange: vi.fn(),
    onIconColorChange: vi.fn(),
    onNameChange: vi.fn(),
    onSubmit: vi.fn(),
    ...overrides,
  };

  return {
    ...render(<EditTrainingView {...props} />),
    props,
  };
}

describe('EditTrainingView', () => {
  it('affiche un état de chargement sans formulaire vide ni retour arrière', () => {
    renderEditView({ isLoading: true, name: '', description: '' });

    expect(screen.getByRole('heading', { name: "Informations générales" })).toBeInTheDocument();
    expect(screen.getByLabelText("Chargement de l'entraînement")).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /Nom de l'entraînement/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Retour/i })).not.toBeInTheDocument();
  });

  it('préremplit les champs et reprend exactement les textes Edit attendus', () => {
    renderEditView();

    expect(screen.getByRole('heading', { name: "Modifier l'entraînement" })).toBeInTheDocument();
    expect(screen.getByText("Modifiez les informations et l'identité visuelle de votre entraînement.")).toBeInTheDocument();
    expect(screen.getByDisplayValue('Mat en 10')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Entraînement basé sur des mats en 10 coups ou moins.')).toBeInTheDocument();
    expect(screen.getByText('52/200')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "Personnaliser l'icône" })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enregistrer les modifications' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Retour à l'entraînement/i })).not.toBeInTheDocument();
  });

  it('abandonne aussi les changements temporaires quand on ferme avec la croix', () => {
    const onIconChange = vi.fn();
    const onIconBackgroundColorChange = vi.fn();
    const onIconColorChange = vi.fn();

    renderEditView({
      onIconBackgroundColorChange,
      onIconChange,
      onIconColorChange,
    });

    fireEvent.click(screen.getByRole('button', { name: "Personnaliser l'icône" }));
    fireEvent.click(screen.getByRole('button', { name: 'Tour' }));
    fireEvent.change(screen.getByLabelText("Choisir la couleur de fond"), { target: { value: '#3b82f6' } });
    fireEvent.change(screen.getByLabelText("Choisir la couleur de l'icône"), { target: { value: '#22c55e' } });
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));

    expect(onIconChange).not.toHaveBeenCalled();
    expect(onIconBackgroundColorChange).not.toHaveBeenCalled();
    expect(onIconColorChange).not.toHaveBeenCalled();
  });

  it('abandonne les changements temporaires de branding quand on annule', () => {
    const onIconChange = vi.fn();
    const onIconBackgroundColorChange = vi.fn();
    const onIconColorChange = vi.fn();

    renderEditView({
      onIconBackgroundColorChange,
      onIconChange,
      onIconColorChange,
    });

    fireEvent.click(screen.getByRole('button', { name: "Personnaliser l'icône" }));
    fireEvent.click(screen.getByRole('button', { name: 'Tour' }));
    fireEvent.change(screen.getByLabelText("Choisir la couleur de fond"), { target: { value: '#3b82f6' } });
    fireEvent.change(screen.getByLabelText("Choisir la couleur de l'icône"), { target: { value: '#22c55e' } });
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(onIconChange).not.toHaveBeenCalled();
    expect(onIconBackgroundColorChange).not.toHaveBeenCalled();
    expect(onIconColorChange).not.toHaveBeenCalled();
  });

  it('applique les changements du customizer au formulaire uniquement après validation', () => {
    const onIconChange = vi.fn();
    const onIconBackgroundColorChange = vi.fn();
    const onIconColorChange = vi.fn();

    renderEditView({
      onIconBackgroundColorChange,
      onIconChange,
      onIconColorChange,
    });

    fireEvent.click(screen.getByRole('button', { name: "Personnaliser l'icône" }));
    fireEvent.click(screen.getByRole('button', { name: 'Tour' }));
    fireEvent.change(screen.getByLabelText("Choisir la couleur de fond"), { target: { value: '#3b82f6' } });
    fireEvent.change(screen.getByLabelText("Choisir la couleur de l'icône"), { target: { value: '#22c55e' } });
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer' }));

    expect(onIconChange).toHaveBeenCalledWith('rook');
    expect(onIconBackgroundColorChange).toHaveBeenCalledWith('#3b82f6');
    expect(onIconColorChange).toHaveBeenCalledWith('#22c55e');
  });

  it('utilise le fallback centralisé pour un ancien entraînement sans branding complet', () => {
    renderEditView({
      icon: '',
      iconBackgroundColor: '',
      iconColor: '',
    });

    fireEvent.click(screen.getByRole('button', { name: "Personnaliser l'icône" }));

    expect(screen.getByRole('button', { name: 'Tour' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByDisplayValue('#8B5CF6')).toBeInTheDocument();
    expect(screen.getByDisplayValue('#FFFFFF')).toBeInTheDocument();
  });
});
