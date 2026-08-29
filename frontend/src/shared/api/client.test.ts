import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiRequest, unauthorizedEventName } from './client';

describe('apiRequest auth handling', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('dispatches the unauthorized event when a protected request returns 401', async () => {
    const onUnauthorized = vi.fn();
    window.addEventListener(unauthorizedEventName, onUnauthorized);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 401, headers: { 'Content-Type': 'application/json' } })));

    await expect(apiRequest('/history/overview', { token: 'jwt-token' })).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);

    window.removeEventListener(unauthorizedEventName, onUnauthorized);
  });

  it('does not dispatch the unauthorized event when the request fails before any HTTP response', async () => {
    const onUnauthorized = vi.fn();
    window.addEventListener(unauthorizedEventName, onUnauthorized);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    await expect(apiRequest('/history/overview', { token: 'jwt-token' })).rejects.toThrow('network down');
    expect(onUnauthorized).not.toHaveBeenCalled();

    window.removeEventListener(unauthorizedEventName, onUnauthorized);
  });
});
