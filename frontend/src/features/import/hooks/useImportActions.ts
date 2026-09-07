import { notify } from '../../../shared/notifications/notifications';
import { useMutation } from '@tanstack/react-query';
import { apiMultipartRequest, apiRequest } from '../../../shared/api/client';
import { apiPathFromIri } from '../../trainings/utils/training.utils';
import type { ActionsContext } from '../../trainings/actions/actionTypes';

export function useImportActions({ session, uiState, queries, invalidateTrainingData }: ActionsContext) {
  const analyzeCsvMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!queries.effectiveSelectedTrainingIri) {
        throw new Error('Selectionne un entrainement avant l analyse.');
      }
      const formData = new FormData();
      formData.append('file', file);
      return apiMultipartRequest<{ analysisId: string; totalRows: number; usefulRowCount: number; validCount: number; errorCount: number; duplicateCount: number; importableCount: number; detectedHeaderCount: number; expectedHeaderCount: number; errors: { line: number; message: string }[]; rows: Array<{ line: number; status: 'valid' | 'error' | 'duplicate'; duplicateReason?: 'file' | 'training'; message?: string; fen?: string | null; rating?: number | string | null; themes?: string[]; sourceId?: string | null }>; preview?: Array<{ rating: number; themes: string[] }> }>(
        apiPathFromIri(queries.effectiveSelectedTrainingIri) + '/imports/csv/analyze',
        formData,
        { token: session.token },
      );
    },
  });

  const importCsvMutation = useMutation({
    mutationFn: async (options: { analysisId: string; skipDuplicates: boolean; skipErroredPuzzles: boolean }) => {
      if (!queries.effectiveSelectedTrainingIri) {
        throw new Error('Selectionne un entrainement avant l import.');
      }
      const formData = new FormData();
      formData.append('analysisId', options.analysisId);
      formData.append('skipDuplicates', String(options.skipDuplicates));
      formData.append('skipErroredPuzzles', String(options.skipErroredPuzzles));
      return apiMultipartRequest<{ importedCount: number }>(
        apiPathFromIri(queries.effectiveSelectedTrainingIri) + '/imports/csv',
        formData,
        { token: session.token },
      );
    },
    onSuccess: async () => {
      await invalidateTrainingData();
    },
  });

  async function estimateLichessAvailability(criteria: { count: number; minRating: number; maxRating: number; themes: string[]; minMoves?: number; maxMoves?: number }) {
    if (!queries.effectiveSelectedTrainingIri) {
      throw new Error('Selectionne un entrainement avant de consulter la disponibilité.');
    }

    const payload = await apiRequest<{ availableCount: number | null }>(
      apiPathFromIri(queries.effectiveSelectedTrainingIri) + '/imports/lichess/availability',
      { method: 'POST', token: session.token, body: criteria },
    );

    return payload.availableCount;
  }

  const importLichessMutation = useMutation({
    mutationFn: async (criteria: { count: number; minRating: number; maxRating: number; themes: string[]; distribution?: 'random' | 'custom'; themeDistribution?: Record<string, number>; minMoves?: number; maxMoves?: number }) => {
      if (!queries.effectiveSelectedTrainingIri) {
        throw new Error('Selectionne un entrainement avant l import.');
      }
      return apiRequest<{ importedCount: number }>(
        apiPathFromIri(queries.effectiveSelectedTrainingIri) + '/imports/lichess',
        { method: 'POST', token: session.token, body: criteria },
      );
    },
    onSuccess: async (result) => {
      notify(`${result.importedCount} puzzles importés.`);
      uiState.setActiveView('detail');
      await invalidateTrainingData();
    },
  });

  return { analyzeCsvMutation, importCsvMutation, importLichessMutation, estimateLichessAvailability };
}
