import { useEffect, useState } from 'react';
import { AuthPanel } from './features/auth/AuthPanel';
import { loadStoredSession, saveStoredSession, type AuthSession } from './features/auth/authStorage';
import { TrainingsPanel } from './features/trainings/TrainingsPanel';
import { unauthorizedEventName } from './shared/api/client';

export function App() {
  const [session, setSession] = useState<AuthSession | null>(() => loadStoredSession());
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);

  useEffect(() => {
    function handleUnauthorized() {
      saveStoredSession(null);
      setSession(null);
      setSessionMessage('Ta session a expire. Reconnecte-toi pour continuer.');
    }

    window.addEventListener(unauthorizedEventName, handleUnauthorized);

    return () => window.removeEventListener(unauthorizedEventName, handleUnauthorized);
  }, []);

  function handleAuthenticated(nextSession: AuthSession) {
    saveStoredSession(nextSession);
    setSession(nextSession);
    setSessionMessage(null);
  }

  function handleLogout() {
    saveStoredSession(null);
    setSession(null);
    setSessionMessage(null);
  }

  if (session) {
    return <TrainingsPanel session={session} onLogout={handleLogout} />;
  }

  return (
    <main className="auth-shell">
      <section className="brand-panel">
        <div className="brand-mark" aria-hidden="true">
          ♜
        </div>
        <p className="brand-title">Woodpecker Trainer</p>
        <h1>Entraîne-toi. Répète. Progresse.</h1>
        <p className="lead">
          Crée tes entraînements tactiques, importe des puzzles compatibles Lichess et travaille
          chaque cycle avec un échiquier interactif.
        </p>
        <p className="footer-note">© 2026 Woodpecker Trainer</p>
      </section>

      <AuthPanel sessionMessage={sessionMessage} onAuthenticated={handleAuthenticated} />
    </main>
  );
}
