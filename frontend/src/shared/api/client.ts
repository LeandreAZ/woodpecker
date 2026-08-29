export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api';
export const unauthorizedEventName = 'woodpecker:unauthorized';

type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
  token?: string;
  body?: unknown;
  contentType?: string;
  keepalive?: boolean;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers = new Headers({
    Accept: 'application/ld+json',
  });

  if (options.body !== undefined) {
    headers.set('Content-Type', options.contentType ?? 'application/ld+json');
  }

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    keepalive: options.keepalive,
  });

  if (!response.ok) {
    if (response.status === 401 && options.token) {
      window.dispatchEvent(new Event(unauthorizedEventName));
    }

    throw new ApiError(await getErrorMessage(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}


async function getErrorMessage(response: Response): Promise<string> {
  if (response.status === 401) {
    return getHttpStatusMessage(response.status);
  }

  try {
    const payload = (await response.json()) as Record<string, unknown>;
    const detail = payload.detail ?? payload['hydra:description'] ?? payload.description;

    if (typeof detail === 'string') {
      return detail;
    }
  } catch {
    // Keep the generic fallback below when the API did not return JSON.
  }

  return getHttpStatusMessage(response.status);
}

function getHttpStatusMessage(status: number): string {
  const messages: Record<number, string> = {
    400: 'La demande envoyee est invalide. Verifie les champs du formulaire.',
    401: 'Ta session a expire ou ton jeton JWT est invalide. Reconnecte-toi.',
    403: "Tu n'as pas le droit de faire cette action.",
    404: "La ressource demandee est introuvable ou ne t'appartient pas.",
    409: 'Conflit de donnees. Cet element existe peut-etre deja.',
    422: 'Certaines donnees ne respectent pas les regles de validation.',
    429: 'Trop de requetes. Attends un peu puis reessaie.',
    500: 'Erreur serveur. Regarde les logs backend si le probleme continue.',
    502: 'La passerelle backend ne repond pas correctement.',
    503: 'Service indisponible. Les conteneurs ne sont peut-etre pas encore prets.',
    504: 'Timeout serveur. Symfony/API Platform est peut-etre encore en train de chauffer.',
  };

  return messages[status] ?? `Erreur API HTTP ${status}.`;
}

