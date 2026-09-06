import { useEffect, useMemo, useState } from 'react';
import { AuthPage } from './features/auth/AuthPage';
import { loadStoredSession, saveStoredSession, type AuthSession } from './features/auth/authStorage';
import TrainingsPanelView from './features/trainings/TrainingsPanelView';
import { StatePanel } from './components/ui/StatePanel';
import { previewSession } from './features/trainings/previewData';
import type { SupportedTheme } from './features/trainings/chessboardPreferences';
import { getRouteDocumentTitle, useAppRoute } from './shared/routing/appRouter';
import { apiRequest, unauthorizedEventName } from './shared/api/client';

const LOCAL_THEME_STORAGE_KEY = 'woodpecker-theme';

function getPreviewSessionFromLocation(): AuthSession | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('preview') === '1' ? previewSession : null;
}

function isExpiredPreviewRequested(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.get('expired') === '1';
}

function applyTheme(theme: SupportedTheme) {
  document.documentElement.dataset.theme = theme;
  document.body.dataset.theme = theme;
}

function applyDocumentLanguage(language: string) {
  document.documentElement.lang = language;
  document.documentElement.setAttribute('translate', 'no');
  document.documentElement.classList.add('notranslate');
  document.body.setAttribute('translate', 'no');
  document.body.classList.add('notranslate');
}

function loadStoredTheme(): SupportedTheme {
  const storedTheme = window.localStorage.getItem(LOCAL_THEME_STORAGE_KEY);
  return storedTheme === 'light' ? 'light' : 'dark';
}

function App() {
  const [session, setSession] = useState<AuthSession | null>(() => getPreviewSessionFromLocation() ?? loadStoredSession());
  const [sessionMessage, setSessionMessage] = useState<string | null>(() => (isExpiredPreviewRequested() ? 'Reconnecte-toi pour continuer ton entraînement.' : null));
  const { navigate, route } = useAppRoute();
  const authPreviewExpired = useMemo(() => isExpiredPreviewRequested(), []);

  useEffect(() => {
    applyTheme(loadStoredTheme());
    applyDocumentLanguage('fr');
  }, []);

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

    if (route.name !== 'auth' && route.name !== 'not-found') {
      navigate({ name: 'auth' }, { replace: true });
    }
  }, [navigate, route.name, session]);

  useEffect(() => {
    if (!session || getPreviewSessionFromLocation()) {
      return;
    }

    let cancelled = false;

    void apiRequest<{ appearance?: { theme?: SupportedTheme } }>('/users/me/overview', { token: session.token })
      .then((payload) => {
        if (cancelled) {
          return;
        }

        const theme = payload.appearance?.theme === 'light' ? 'light' : 'dark';
        window.localStorage.setItem(LOCAL_THEME_STORAGE_KEY, theme);
        applyTheme(theme);
      })
      .catch(() => {
        if (!cancelled) {
          applyTheme(loadStoredTheme());
        }
      });

    return () => {
      cancelled = true;
    };
  }, [session]);

  function handleAuthenticated(nextSession: AuthSession) {
    saveStoredSession(nextSession);
    setSession(nextSession);
    setSessionMessage(null);
    navigate({ name: 'dashboard' }, { replace: true });
  }

  async function handleLogout() {
    if (getPreviewSessionFromLocation()) {
      setSession(previewSession);
      navigate({ name: 'dashboard' }, { replace: true });
      return;
    }

    const currentSession = session;

    try {
      if (currentSession?.token) {
        await apiRequest('/auth/logout', {
          method: 'POST',
          token: currentSession.token,
          keepalive: true,
        });
      }
    } catch {
      // Best effort: logout must still clear the local session even if the persistence call fails.
    }

    saveStoredSession(null);
    setSession(null);
    setSessionMessage(null);
    navigate({ name: 'auth' }, { replace: true });
  }

  if (session) {
    return <TrainingsPanelView onLogout={handleLogout} onNavigate={navigate} route={route} session={session} />;
  }

  if (route.name === 'not-found') return <main style={{ padding: 24 }}><StatePanel kind="404" onBack={() => navigate({ name: 'dashboard' })} /></main>;

  return <AuthPage onAuthenticated={handleAuthenticated} sessionMessage={sessionMessage} />;
}

export { App };
export default App;
