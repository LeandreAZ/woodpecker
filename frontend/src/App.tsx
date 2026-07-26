import { useState } from 'react';
import { AuthPanel } from './features/auth/AuthPanel';
import { loadStoredSession, saveStoredSession, type AuthSession } from './features/auth/authStorage';
import { TrainingsPanel } from './features/trainings/TrainingsPanel';

export function App() {
  const [session, setSession] = useState<AuthSession | null>(() => loadStoredSession());

  function handleAuthenticated(nextSession: AuthSession) {
    saveStoredSession(nextSession);
    setSession(nextSession);
  }

  function handleLogout() {
    saveStoredSession(null);
    setSession(null);
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">Woodpecker Trainer</p>
        <h1>Train tactics, repeat cycles, measure progress.</h1>
        <p className="lead">
          The backend now protects private training data. Create an account, sign in, then start a
          first personal training.
        </p>
      </section>

      {session ? (
        <TrainingsPanel session={session} onLogout={handleLogout} />
      ) : (
        <AuthPanel onAuthenticated={handleAuthenticated} />
      )}
    </main>
  );
}
