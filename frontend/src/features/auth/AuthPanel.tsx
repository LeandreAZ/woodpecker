import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ApiError, apiRequest } from '../../shared/api/client';
import type { AuthSession } from './authStorage';

type AuthPanelProps = {
  sessionMessage?: string | null;
  onAuthenticated: (session: AuthSession) => void;
};

type LoginResponse = {
  token: string;
};

function iconProps() {
  return {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
}

function AlertIcon() {
  return (
    <svg {...iconProps()}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8.2v4.6" />
      <path d="M12 15.8h.01" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M2.8 12s3.4-5.3 9.2-5.3 9.2 5.3 9.2 5.3-3.4 5.3-9.2 5.3S2.8 12 2.8 12Z" />
      <circle cx="12" cy="12" r="2.1" />
    </svg>
  );
}

function AuthPanel({ sessionMessage, onAuthenticated }: AuthPanelProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const authMutation = useMutation({
    mutationFn: async () => {
      const normalizedEmail = email.trim().toLowerCase();

      try {
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
      } catch (error) {
        if (error instanceof ApiError && error.status === 401 && mode === 'login') {
          throw new Error('Email ou mot de passe incorrect.');
        }

        throw error;
      }
    },
    onSuccess: onAuthenticated,
  });

  const isLogin = mode === 'login';
  const topErrorMessage = !sessionMessage && authMutation.isError ? authMutation.error.message : null;

  function toggleMode() {
    setMode(isLogin ? 'register' : 'login');
    authMutation.reset();
  }

  return (
    <section aria-labelledby="auth-title" className="auth-panel">
      <div className="auth-panel__header">
        <h1 className="auth-panel__title" id="auth-title">
          {isLogin ? 'Connexion' : 'Créer un compte'}
        </h1>
        <button className="auth-panel__switch" type="button" onClick={toggleMode}>
          {isLogin ? 'Créer un compte' : 'Connexion'}
        </button>
      </div>

      {sessionMessage ? (
        <div className="auth-panel__alert" role="status">
          <span className="auth-panel__alert-icon"><AlertIcon /></span>
          <div>
            <strong>Ta session a expiré.</strong>
            <span>{sessionMessage}</span>
          </div>
        </div>
      ) : null}

      {topErrorMessage ? (
        <div className="auth-panel__alert" role="status">
          <span className="auth-panel__alert-icon"><AlertIcon /></span>
          <div>
            <strong>Connexion impossible.</strong>
            <span>{topErrorMessage}</span>
          </div>
        </div>
      ) : null}

      <form
        className="auth-panel__form"
        onSubmit={(event) => {
          event.preventDefault();
          authMutation.mutate();
        }}
      >
        <label className="auth-panel__field">
          <span>Email</span>
          <div className="auth-panel__input-shell">
            <input
              autoComplete="email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ton@email.com"
              required
              type="email"
              value={email}
            />
          </div>
        </label>

        <label className="auth-panel__field">
          <span>Mot de passe</span>
          <div className="auth-panel__input-shell auth-panel__input-shell--password">
            <input
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              minLength={8}
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="● ● ● ● ● ● ● ●"
              required
              type={showPassword ? 'text' : 'password'}
              value={password}
            />
            <button
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              className="auth-panel__password-toggle"
              type="button"
              onClick={() => setShowPassword((value) => !value)}
            >
              <EyeIcon />
            </button>
          </div>
        </label>

        <div className="auth-panel__meta">
          <span />
          {isLogin ? (
            <button className="auth-panel__forgot" type="button">
              Mot de passe oublié ?
            </button>
          ) : null}
        </div>

        <button className="auth-panel__submit" disabled={authMutation.isPending} type="submit">
          {authMutation.isPending ? 'Chargement...' : isLogin ? 'Se connecter' : 'Créer un compte'}
        </button>

        <div className="auth-panel__footer">
          <span>{isLogin ? "Tu n'as pas encore de compte ?" : 'Tu as déjà un compte ?'}</span>
          <button className="auth-panel__inline-link" type="button" onClick={toggleMode}>
            {isLogin ? 'Créer un compte' : 'Connexion'}
          </button>
        </div>
      </form>
    </section>
  );
}

export { AuthPanel };
export default AuthPanel;
