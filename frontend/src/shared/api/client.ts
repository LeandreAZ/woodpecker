export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api';
export const unauthorizedEventName = 'woodpecker:unauthorized';

type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
  token?: string;
  body?: unknown;
  contentType?: string;
  keepalive?: boolean;
};

export class NetworkError extends Error {
  constructor() { super('Impossible de communiquer avec le serveur. Vérifiez votre connexion puis réessayez.'); this.name = 'NetworkError'; }
}
async function fetchResponse(url: string, options: RequestInit): Promise<Response> {
  try { return await fetch(url, options); }
  catch (error) { if (error instanceof Error && error.name === 'AbortError') throw error; throw new NetworkError(); }
}

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

  const response = await fetchResponse(`${apiBaseUrl}${path}`, {
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

  if (response.status >= 500) return getHttpStatusMessage(response.status);

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
    401: 'Votre session a expiré. Reconnectez-vous.',
    403: "Tu n'as pas le droit de faire cette action.",
    404: "La ressource demandee est introuvable ou ne t'appartient pas.",
    409: 'Conflit de donnees. Cet element existe peut-etre deja.',
    422: 'Certaines donnees ne respectent pas les regles de validation.',
    429: 'Trop de requetes. Attends un peu puis reessaie.',
    500: 'Une erreur est survenue côté serveur. Veuillez réessayer plus tard.',
    502: 'La passerelle backend ne repond pas correctement.',
    503: 'Le service est temporairement indisponible. Veuillez réessayer.',
    504: 'Le serveur met trop de temps à répondre. Veuillez réessayer.',
  };

  return messages[status] ?? `Erreur API HTTP ${status}.`;
}


export async function apiMultipartRequest<T>(path: string, formData: FormData, options: Pick<ApiRequestOptions, 'method' | 'token'> = {}): Promise<T> {
  const headers = new Headers({
    Accept: 'application/ld+json',
  });

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  const response = await fetchResponse(`${apiBaseUrl}${path}`, {
    method: options.method ?? 'POST',
    headers,
    body: formData,
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
