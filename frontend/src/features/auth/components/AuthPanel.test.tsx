import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from '../../../shared/api/client';
import { AuthPanel } from './AuthPanel';

vi.mock('../../../shared/api/client', async (original) => ({
  ...(await original<typeof import('../../../shared/api/client')>()),
  apiRequest: vi.fn(),
}));
function setup(message?: string) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const authenticated = vi.fn();
  const view = (value?: string) => (
    <QueryClientProvider client={client}>
      <AuthPanel sessionMessage={value} onAuthenticated={authenticated} />
    </QueryClientProvider>
  );
  return { ...render(view(message)), view, authenticated };
}
function submit() {
  fireEvent.change(screen.getByLabelText('Adresse e-mail'), { target: { value: 'Player@Example.com' } });
  fireEvent.change(screen.getByLabelText('Mot de passe', { exact: true }), {
    target: { value: 'password123' },
  });
  fireEvent.submit(screen.getByRole('button', { name: /Se connecter|Créer mon compte/ }).closest('form')!);
}
beforeEach(() => vi.mocked(apiRequest).mockReset());
describe('AuthPanel', () => {
  it('dismisses only the current session message and shows subsequent messages', () => {
    const { rerender, view } = setup('Première expiration');
    fireEvent.click(screen.getByRole('button', { name: 'Fermer le message' }));
    rerender(view('Première expiration'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    rerender(view());
    rerender(view('Première expiration'));
    expect(screen.getByRole('alert')).toHaveTextContent('Première expiration');
  });
  it('shows a new authentication failure after dismissal', async () => {
    vi.mocked(apiRequest)
      .mockRejectedValueOnce(new Error('Premier échec'))
      .mockRejectedValueOnce(new Error('Nouvel échec'));
    setup();
    submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('Premier échec');
    fireEvent.click(screen.getByRole('button', { name: 'Fermer le message d’authentification' }));
    submit();
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Nouvel échec'));
  });
  it('registers then logs in with the normalized email', async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({}).mockResolvedValueOnce({ token: 'session-token' });
    const { authenticated } = setup();
    fireEvent.click(screen.getByRole('tab', { name: 'Inscription' }));
    submit();
    await waitFor(() =>
      expect(authenticated.mock.calls[0]?.[0]).toEqual({
        token: 'session-token',
        email: 'player@example.com',
      }),
    );
    expect(vi.mocked(apiRequest).mock.calls.map(([url]) => url)).toEqual(['/users', '/login_check']);
  });
});
