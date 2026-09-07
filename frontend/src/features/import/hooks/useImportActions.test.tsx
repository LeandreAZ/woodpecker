import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiMultipartRequest, apiRequest } from '../../../shared/api/client';
import type { ActionsContext } from '../../trainings/actions/actionTypes';
import { useImportActions } from './useImportActions';

vi.mock('../../../shared/api/client', () => ({ apiMultipartRequest: vi.fn(), apiRequest: vi.fn() }));
beforeEach(() => vi.clearAllMocks());

function setup(trainingIri: string | null = '/api/trainings/7') {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const invalidateTrainingData = vi.fn().mockResolvedValue(undefined);
  const context = {
    session: { email: 'test@example.test', token: 'test-token' },
    queries: { effectiveSelectedTrainingIri: trainingIri },
    uiState: { setActiveView: vi.fn() },
    queryClient,
    invalidateTrainingData,
  } as unknown as ActionsContext;
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  return { ...renderHook(() => useImportActions(context), { wrapper }), invalidateTrainingData };
}

describe('useImportActions contracts', () => {
  it('imports the recorded CSV analysis with its flags and invalidates training reads', async () => {
    vi.mocked(apiMultipartRequest).mockResolvedValue({ importedCount: 2 });
    const { result, invalidateTrainingData } = setup();
    await act(async () => {
      await result.current.importCsvMutation.mutateAsync({ analysisId: 'analysis-7', skipDuplicates: true, skipErroredPuzzles: false });
    });
    const [path, form, options] = vi.mocked(apiMultipartRequest).mock.calls[0];
    expect(path).toBe('/trainings/7/imports/csv');
    expect(form.get('analysisId')).toBe('analysis-7');
    expect(form.get('skipDuplicates')).toBe('true');
    expect(form.get('skipErroredPuzzles')).toBe('false');
    expect(options).toEqual({ token: 'test-token' });
    expect(invalidateTrainingData).toHaveBeenCalledTimes(1);
  });

  it('rejects a missing training before issuing a Lichess availability request', async () => {
    const { result } = setup(null);
    await expect(result.current.estimateLichessAvailability({ count: 100, minRating: 800, maxRating: 1600, themes: [] })).rejects.toThrow();
    expect(apiRequest).not.toHaveBeenCalled();
  });
});
