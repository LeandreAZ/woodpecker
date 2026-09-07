import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorState, StatePanel } from './StatePanel';
import { LoadingButton } from './LoadingButton';
import { EmptyState } from './EmptyState';
import { Modal } from './Modal';
import { Input } from './Input';
import { ApiError, NetworkError } from '../api/client';

describe('États communs', () => {
  it('garde le focus dans la modale et ferme avec Échap', () => {
    const close = vi.fn(); render(<Modal open onClose={close}><h2>Confirmation</h2><button>Annuler</button><button>Confirmer</button></Modal>);
    expect(screen.getByRole('dialog', { name: 'Confirmation' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Annuler' })).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(screen.getByRole('button', { name: 'Confirmer' })).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Escape' }); expect(close).toHaveBeenCalledOnce();
  });

  it.each([['404', 'Page introuvable'], ['403', 'Accès refusé'], ['500', 'Erreur serveur']] as const)('affiche %s et permet le retour', (kind, title) => {
    const back = vi.fn(); render(<StatePanel kind={kind} onBack={back} />);
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    expect(screen.getByText(kind)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retour aux entraînements' })); expect(back).toHaveBeenCalledOnce();
  });
  it('distingue réseau et erreur HTTP sans exposer le détail serveur', () => {
    const retry = vi.fn(); const { rerender } = render(<ErrorState error={new NetworkError()} onRetry={retry} />);
    expect(screen.getByRole('heading', { name: 'Connexion impossible' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' })); expect(retry).toHaveBeenCalledOnce();
    rerender(<ErrorState error={new ApiError('secret stack trace', 500)} onRetry={retry} />);
    expect(screen.getByRole('heading', { name: 'Erreur serveur' })).toBeInTheDocument();
    expect(screen.queryByText('secret stack trace')).not.toBeInTheDocument();
  });
  it('propose la création sur une liste vide', () => {
    const create = vi.fn(); render(<EmptyState description="Créez votre premier entraînement." title="Aucun entraînement" action={<button onClick={create}>Créer</button>} />);
    fireEvent.click(screen.getByRole('button', { name: 'Créer' })); expect(create).toHaveBeenCalledOnce();
  });
  it('bloque les doubles clics et annonce le chargement', () => {
    const action = vi.fn(); render(<LoadingButton loading loadingLabel="Enregistrement…" onClick={action}>Enregistrer</LoadingButton>);
    const button = screen.getByRole('button', { name: 'Enregistrement…' });
    expect(button).toBeDisabled(); expect(button).toHaveAttribute('aria-busy', 'true');
    fireEvent.click(button); expect(action).not.toHaveBeenCalled();
  });
  it('affiche puis retire une erreur sous le champ', () => {
    render(<Input aria-label="Email" type="email" required />);
    const input = screen.getByRole('textbox', { name: 'Email' }); fireEvent.invalid(input);
    expect(input).toHaveAttribute('aria-invalid', 'true'); expect(screen.getByRole('alert')).toHaveTextContent('Ce champ est requis.');
    fireEvent.change(input, { target: { value: 'test@example.com' } }); expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
