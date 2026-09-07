const storageKey = 'woodpecker.auth';

export type AuthSession = {
  token: string;
  email: string;
};

export function loadStoredSession(): AuthSession | null {
  const rawSession = localStorage.getItem(storageKey);

  if (!rawSession) {
    return null;
  }

  try {
    const session = JSON.parse(rawSession) as Partial<AuthSession>;

    if (typeof session.token === 'string' && typeof session.email === 'string') {
      return {
        token: session.token,
        email: session.email,
      };
    }
  } catch {
    localStorage.removeItem(storageKey);
  }

  return null;
}

export function saveStoredSession(session: AuthSession | null): void {
  if (session) {
    localStorage.setItem(storageKey, JSON.stringify(session));

    return;
  }

  localStorage.removeItem(storageKey);
}
