import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '../../shared/api/client';
import type { AuthSession } from './authStorage';

type AuthPanelProps = {
  onAuthenticated: (session: AuthSession) => void;
};

type LoginResponse = {
  token: string;
};

export function AuthPanel({ onAuthenticated }: AuthPanelProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const authMutation = useMutation({
    mutationFn: async () => {
      const normalizedEmail = email.trim().toLowerCase();

      if (mode === 'register') {
        await apiRequest('/users', {
          method: 'POST',
          body: {
            email: normalizedEmail,
            plainPassword: password,
          },
        });
      }

      const login = await apiRequest<LoginResponse>('/login_check', {
        method: 'POST',
        contentType: 'application/json',
        body: {
          email: normalizedEmail,
          password,
        },
      });

      return {
        token: login.token,
        email: normalizedEmail,
      };
    },
    onSuccess: onAuthenticated,
  });

  const title = mode === 'login' ? 'Connexion' : 'Créer un compte';
  const submitLabel = mode === 'login' ? 'Se connecter' : "S'inscrire";

  return (
    <section className="card auth-card" aria-labelledby="auth-title">
      <div className="card-header">
        <div>
          <p className="eyebrow">Compte</p>
          <h2 id="auth-title">{title}</h2>
        </div>
        <button
          className="ghost-button"
          type="button"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? 'Créer un compte' : 'Déjà un compte ?'}
        </button>
      </div>

      <form
        className="form-stack"
        onSubmit={(event) => {
          event.preventDefault();
          authMutation.mutate();
        }}
      >
        <label>
          Email
          <input
            autoComplete="email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="toi@example.com"
            required
            type="email"
            value={email}
          />
        </label>

        <label>
          Mot de passe
          <input
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            minLength={8}
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimum 8 caractères"
            required
            type="password"
            value={password}
          />
        </label>

        {authMutation.isError && (
          <p className="alert error-alert">{authMutation.error.message}</p>
        )}

        <button className="primary-button" disabled={authMutation.isPending} type="submit">
          {authMutation.isPending ? 'Chargement...' : submitLabel}
        </button>
      </form>
    </section>
  );
}
