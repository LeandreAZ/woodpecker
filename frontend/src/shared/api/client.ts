export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api';

type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  token?: string;
  body?: unknown;
  contentType?: string;
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
  });

  if (!response.ok) {
    throw new ApiError(await getErrorMessage(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as Record<string, unknown>;
    const detail = payload.detail ?? payload['hydra:description'] ?? payload.description;

    if (typeof detail === 'string') {
      return detail;
    }
  } catch {
    // Keep the generic fallback below when the API did not return JSON.
  }

  return `API request failed with HTTP ${response.status}`;
}
