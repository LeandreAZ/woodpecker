import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  AlertCircle,
  CircleX,
  Eye,
  EyeOff,
  LockKeyhole,
  LogIn,
  Mail,
  UserPlus,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ApiError, apiRequest } from '../../shared/api/client';
import type { AuthSession } from './authStorage';

type AuthPanelProps = {
  sessionMessage?: string | null;
  onAuthenticated: (session: AuthSession) => void;
};

type AuthMode = 'login' | 'register';

type LoginResponse = {
  token: string;
};

function AuthPanel({ sessionMessage, onAuthenticated }: AuthPanelProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [dismissedSessionMessage, setDismissedSessionMessage] = useState(false);
  const [dismissedAuthError, setDismissedAuthError] = useState(false);

  useEffect(() => {
    setDismissedSessionMessage(false);
  }, [sessionMessage]);

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

        if (error instanceof ApiError && error.status === 422 && mode === 'register') {
          throw new Error('Ce compte existe peut-être déjà ou les données sont invalides.');
        }

        throw error;
      }
    },
    onSuccess: onAuthenticated,
  });

  useEffect(() => {
    if (!authMutation.isError) {
      setDismissedAuthError(false);
    }
  }, [authMutation.isError]);

  const isLogin = mode === 'login';
  const isPending = authMutation.isPending;
  const visibleSessionMessage = dismissedSessionMessage ? null : sessionMessage;
  const topErrorMessage = !visibleSessionMessage && authMutation.isError && !dismissedAuthError ? authMutation.error.message : null;

  function switchMode(nextMode: AuthMode) {
    if (mode === nextMode) {
      return;
    }

    setMode(nextMode);
    setShowPassword(false);
    setDismissedSessionMessage(true);
    setDismissedAuthError(true);
    authMutation.reset();
  }

  function submitLabel() {
    if (isPending) {
      return isLogin ? 'Connexion...' : 'Création du compte...';
    }

    return isLogin ? 'Se connecter' : 'Créer mon compte';
  }

  return (
    <section aria-labelledby="auth-title" className="auth-panel">
      <div className="auth-panel__tabs" role="tablist" aria-label="Authentification">
        <button
          aria-selected={isLogin}
          className={isLogin ? 'auth-panel__tab is-active' : 'auth-panel__tab'}
          role="tab"
          type="button"
          onClick={() => switchMode('login')}
        >
          Connexion
        </button>
        <button
          aria-selected={!isLogin}
          className={!isLogin ? 'auth-panel__tab is-active' : 'auth-panel__tab'}
          role="tab"
          type="button"
          onClick={() => switchMode('register')}
        >
          Inscription
        </button>
      </div>

      <div className="auth-panel__intro">
        <h1 className="auth-panel__title" id="auth-title">
          {isLogin ? 'Bon retour !' : 'Créer votre compte'}
        </h1>
        <p className="auth-panel__description">
          {isLogin
            ? 'Connectez-vous pour reprendre votre entraînement.'
            : 'Inscrivez-vous pour structurer et suivre votre entraînement aux échecs.'}
        </p>
      </div>

      {visibleSessionMessage ? (
        <div className="auth-panel__alert auth-panel__alert--danger" role="alert">
          <AlertCircle aria-hidden="true" className="auth-panel__alert-icon" size={18} strokeWidth={1.9} />
          <div>
            <strong>Session expirée</strong>
            <span>{visibleSessionMessage}</span>
          </div>
          <button
            aria-label="Fermer le message"
            className="auth-panel__alert-close"
            type="button"
            onClick={() => setDismissedSessionMessage(true)}
          >
            <CircleX aria-hidden="true" size={18} strokeWidth={1.9} />
          </button>
        </div>
      ) : null}

      {topErrorMessage ? (
        <div className="auth-panel__alert auth-panel__alert--danger" role="alert">
          <AlertCircle aria-hidden="true" className="auth-panel__alert-icon" size={18} strokeWidth={1.9} />
          <div>
            <strong>Authentification impossible</strong>
            <span>{topErrorMessage}</span>
          </div>
          <button
            aria-label="Fermer le message d’authentification"
            className="auth-panel__alert-close"
            type="button"
            onClick={() => setDismissedAuthError(true)}
          >
            <CircleX aria-hidden="true" size={18} strokeWidth={1.9} />
          </button>
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
          <span className="auth-panel__label">Adresse e-mail</span>
          <div className="auth-panel__input-shell">
            <Mail aria-hidden="true" className="auth-panel__input-icon" size={20} strokeWidth={1.9} />
            <Input
              autoComplete="email"
              className="auth-panel__input"
              name="email"
              placeholder="votre@e-mail.com"
              required
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setDismissedSessionMessage(true);
                setDismissedAuthError(true);
                if (authMutation.isError) {
                  authMutation.reset();
                }
              }}
            />
          </div>
        </label>

        <label className="auth-panel__field">
          <span className="auth-panel__label">Mot de passe</span>
          <div className="auth-panel__input-shell auth-panel__input-shell--password">
            <LockKeyhole aria-hidden="true" className="auth-panel__input-icon" size={20} strokeWidth={1.9} />
            <Input
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              className="auth-panel__input"
              minLength={8}
              name="password"
              placeholder="Votre mot de passe"
              required
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setDismissedSessionMessage(true);
                setDismissedAuthError(true);
                if (authMutation.isError) {
                  authMutation.reset();
                }
              }}
            />
            <button
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              className="auth-panel__password-toggle"
              type="button"
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? <EyeOff aria-hidden="true" size={20} strokeWidth={1.9} /> : <Eye aria-hidden="true" size={20} strokeWidth={1.9} />}
            </button>
          </div>
        </label>

        <div className="auth-panel__meta">
          <span />
          {isLogin ? (
            <button className="auth-panel__forgot" disabled title="La réinitialisation du mot de passe n’est pas encore disponible." type="button">
              Mot de passe oublié ?
            </button>
          ) : null}
        </div>

        <Button loading={isPending} loadingLabel={isLogin ? "Connexion…" : "Inscription…"} className="auth-panel__submit" disabled={isPending} fullWidth size="lg" type="submit" variant="primary">
          {isLogin ? <LogIn aria-hidden="true" size={20} strokeWidth={1.9} /> : <UserPlus aria-hidden="true" size={20} strokeWidth={1.9} />}
          <span>{submitLabel()}</span>
        </Button>

        <div className="auth-panel__divider" aria-hidden="true">
          <span />
          <small>ou</small>
          <span />
        </div>

        <Button
          className="auth-panel__secondary-action"
          fullWidth
          size="lg"
          type="button"
          variant="secondary"
          onClick={() => switchMode(isLogin ? 'register' : 'login')}
        >
          {isLogin ? <UserPlus aria-hidden="true" size={20} strokeWidth={1.9} /> : <LogIn aria-hidden="true" size={20} strokeWidth={1.9} />}
          <span>{isLogin ? 'Créer un compte' : 'J’ai déjà un compte'}</span>
        </Button>
      </form>
    </section>
  );
}

export { AuthPanel };
export default AuthPanel;