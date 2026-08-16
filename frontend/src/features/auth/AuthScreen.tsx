import { AuthPanel } from './AuthPanel';
import type { AuthSession } from './authStorage';
import './auth.css';

type AuthScreenProps = {
  onAuthenticated: (session: AuthSession) => void;
  sessionMessage?: string | null;
};

function iconProps() {
  return {
    viewBox: '0 0 24 24',
    width: 24,
    height: 24,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
}

function RepeatIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M8 6.5h9" />
      <path d="m14 3.8 3 2.7-3 2.7" />
      <path d="M16 17.5H7" />
      <path d="m10 14.8-3 2.7 3 2.7" />
      <path d="M8 6.5C5.9 6.5 5 7.7 5 9.6V11" />
      <path d="M16 17.5c2.1 0 3-1.2 3-3.1V13" />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M12 3.5c2 1.4 4.2 2.2 6.6 2.5v5c0 4.2-2.4 7.2-6.6 8.9-4.2-1.7-6.6-4.7-6.6-8.9V6c2.4-.3 4.6-1.1 6.6-2.5Z" />
      <path d="m9.4 12 1.8 1.8 3.5-3.8" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M4.5 18.5h15" />
      <path d="m6.5 15.5 4-4 3.2 2.8 4.8-6.1" />
      <path d="m16.7 8.2 1.8-.1-.1 1.8" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg {...iconProps()}>
      <rect x="5.2" y="10.8" width="13.6" height="9.6" rx="2.2" />
      <path d="M8.2 10.8V8.7A3.8 3.8 0 0 1 12 4.9a3.8 3.8 0 0 1 3.8 3.8v2.1" />
    </svg>
  );
}

function AuthScreen({ onAuthenticated, sessionMessage }: AuthScreenProps) {
  return (
    <main className="auth-page">
      <section className="auth-page__brand" aria-label="Présentation de Woodpecker Trainer">
        <div className="auth-page__brand-surface">
          <div className="auth-page__logo-wrap">
            <img alt="Woodpecker Trainer" className="auth-page__logo" src="/brand/woodpecker-logo-auth-tight.png" />
          </div>

          <div className="auth-page__brand-points">
            <div className="auth-page__brand-point">
              <span className="auth-page__brand-icon"><RepeatIcon /></span>
              <span>Répétition.</span>
            </div>
            <div className="auth-page__brand-point">
              <span className="auth-page__brand-icon"><ShieldCheckIcon /></span>
              <span>Rigueur.</span>
            </div>
            <div className="auth-page__brand-point">
              <span className="auth-page__brand-icon"><ChartIcon /></span>
              <span>Progression mesurable.</span>
            </div>
          </div>

          <div className="auth-page__security">
            <span className="auth-page__security-icon"><LockIcon /></span>
            <div className="auth-page__security-copy">
              <strong>Votre entraînement. Vos données.</strong>
              <span>Toujours sécurisés et privés.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="auth-page__panel">
        <div className="auth-page__panel-inner">
          <div className="auth-page__mobile-logo-wrap">
            <img alt="Woodpecker Trainer" className="auth-page__mobile-logo" src="/brand/woodpecker-logo-auth-tight.png" />
          </div>
          <AuthPanel onAuthenticated={onAuthenticated} sessionMessage={sessionMessage} />
        </div>
      </section>
    </main>
  );
}

export type { AuthScreenProps };
export { AuthScreen };
export default AuthScreen;
