import { useEffect, useMemo, useState } from 'react';
import { AuthPage } from './features/auth/AuthPage';
import { loadStoredSession, saveStoredSession, type AuthSession } from './features/auth/authStorage';
import { TrainingsPanel } from './features/trainings/TrainingsPanel';
import { previewSession } from './features/trainings/previewData';
import { getRouteDocumentTitle, useAppRoute } from './shared/routing/appRouter';
import { unauthorizedEventName } from './shared/api/client';

function getPreviewSessionFromLocation(): AuthSession | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('preview') === '1' ? previewSession : null;
}

function isExpiredPreviewRequested(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.get('expired') === '1';
}

const App = () => {
  const [session, setSession] = useState<AuthSession | null>(() => getPreviewSessionFromLocation() ?? loadStoredSession());
  const [sessionMessage, setSessionMessage] = useState<string | null>(() => (isExpiredPreviewRequested() ? 'Reconnecte-toi pour continuer ton entraînement.' : null));
  const { navigate, route } = useAppRoute();
  const authPreviewExpired = useMemo(() => isExpiredPreviewRequested(), []);

  useEffect(() => {
    document.title = getRouteDocumentTitle(route);
  }, [route]);

  useEffect(() => {
    if (route.name !== 'auth' || !authPreviewExpired) {
      return;
    }

    setSessionMessage('Reconnecte-toi pour continuer ton entraînement.');
  }, [authPreviewExpired, route.name]);

  useEffect(() => {
    function handleUnauthorized() {
      const preview = getPreviewSessionFromLocation();

      if (preview) {
        setSession(preview);
        return;
      }

      saveStoredSession(null);
      setSession(null);
      setSessionMessage('Reconnecte-toi pour continuer ton entraînement.');
      navigate({ name: 'auth' }, { replace: true });
    }

    window.addEventListener(unauthorizedEventName, handleUnauthorized);
    return () => window.removeEventListener(unauthorizedEventName, handleUnauthorized);
  }, [navigate, route.name]);

  useEffect(() => {

    const preview = getPreviewSessionFromLocation();

    if (preview) {
      if (!session || session.token !== preview.token) {
        setSession(preview);
      }

      if (route.name === 'auth') {
        navigate({ name: 'dashboard' }, { replace: true });
      }

      return;
    }

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
    if (getPreviewSessionFromLocation()) {
      setSession(previewSession);
      navigate({ name: 'dashboard' }, { replace: true });
      return;
    }

    saveStoredSession(null);
    setSession(null);
    setSessionMessage(null);
    navigate({ name: 'auth' }, { replace: true });
  }

  if (session) {
    return <TrainingsPanel onLogout={handleLogout} onNavigate={navigate} route={route} session={session} />;
  }

  return <AuthPage onAuthenticated={handleAuthenticated} sessionMessage={sessionMessage} />;
};

export { App };
export default App;

