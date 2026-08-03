import { useEffect, useState } from 'react';
import { AuthPanel } from './features/auth/AuthPanel';
import { loadStoredSession, saveStoredSession, type AuthSession } from './features/auth/authStorage';
import { TrainingsPanel } from './features/trainings/TrainingsPanel';
import { useAppRoute } from './shared/routing/appRouter';
import { unauthorizedEventName } from './shared/api/client';

export function App() {
  const [session, setSession] = useState<AuthSession | null>(() => loadStoredSession());
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);
  const { navigate, route } = useAppRoute();

  useEffect(() => {
    function handleUnauthorized() {
      saveStoredSession(null);
      setSession(null);
      setSessionMessage('Ta session a expire. Reconnecte-toi pour continuer.');
      navigate({ name: 'auth' }, { replace: true });
    }

    window.addEventListener(unauthorizedEventName, handleUnauthorized);

    return () => window.removeEventListener(unauthorizedEventName, handleUnauthorized);
  }, [navigate]);

  useEffect(() => {
    if (session) {
      if (route.name === 'auth') {
        navigate({ name: 'dashboard' }, { replace: true });
      }

      return;
    }

    if (route.name !== 'auth') {
      navigate({ name: 'auth' }, { replace: true });
    }
  }, [navigate, route.name, session]);

  function handleAuthenticated(nextSession: AuthSession) {
    saveStoredSession(nextSession);
    setSession(nextSession);
    setSessionMessage(null);
    navigate({ name: 'dashboard' }, { replace: true });
  }

  function handleLogout() {
    saveStoredSession(null);
    setSession(null);
    setSessionMessage(null);
    navigate({ name: 'auth' }, { replace: true });
  }

  if (session) {
    return (
      <TrainingsPanel
        onLogout={handleLogout}
        onNavigate={navigate}
        route={route}
        session={session}
      />
    );
  }

  return (
    <main className="auth-shell">
      <section className="brand-panel">
        <div className="brand-mark" aria-hidden="true">
          WP
        </div>
        <p className="brand-title">Woodpecker Trainer</p>
        <h1>Entraine-toi. Repete. Progresse.</h1>
        <p className="lead">
          Cree tes entrainements tactiques, importe des puzzles compatibles Lichess et travaille
          chaque cycle avec un echiquier interactif.
        </p>
        <p className="footer-note">© 2026 Woodpecker Trainer</p>
      </section>

      <AuthPanel sessionMessage={sessionMessage} onAuthenticated={handleAuthenticated} />
    </main>
  );
}
