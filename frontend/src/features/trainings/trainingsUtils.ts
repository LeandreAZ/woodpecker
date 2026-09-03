import { apiRequest } from '../../shared/api/client';
import type {
  ApiCollection,
  CollectionView,
  CyclePuzzle,
  CycleStats,
  TrainingPuzzle,
} from './trainingsTypes';

export function buildCycleStats(
  cyclePuzzles: CyclePuzzle[],
  savedCyclePuzzleIris: Set<string>,
  failedCyclePuzzleIris: Set<string>,
  fallbackTotal: number,
): CycleStats {
  const total = cyclePuzzles.length || fallbackTotal;
  const solved = cyclePuzzles.filter(
    (cyclePuzzle) => cyclePuzzle.status === 'solved' || savedCyclePuzzleIris.has(cyclePuzzle['@id']),
  ).length;
  const failed = cyclePuzzles.filter(
    (cyclePuzzle) =>
      cyclePuzzle.status !== 'solved' &&
      !savedCyclePuzzleIris.has(cyclePuzzle['@id']) &&
      (cyclePuzzle.status === 'failed' || failedCyclePuzzleIris.has(cyclePuzzle['@id'])),
  ).length;
  const attempted = Math.min(solved + failed, total);
  const pending = Math.max(total - attempted, 0);
  const progressPercent = total > 0 ? Math.round((attempted / total) * 100) : 0;

  return {
    failed,
    pending,
    progressPercent,
    solved,
    total,
  };
}

export function getNextTrainingPuzzlePosition(trainingPuzzles: TrainingPuzzle[]): number {
  if (trainingPuzzles.length === 0) {
    return 0;
  }

  return Math.max(...trainingPuzzles.map((trainingPuzzle) => trainingPuzzle.position)) + 1;
}

export function updateTrainingPuzzlePosition(
  trainingPuzzleIri: string,
  position: number,
  token: string,
): Promise<TrainingPuzzle> {
  return apiRequest<TrainingPuzzle>(apiPathFromIri(trainingPuzzleIri), {
    method: 'PATCH',
    token,
    contentType: 'application/merge-patch+json',
    body: {
      position,
    },
  });
}

export function formatDuration(durationMilliseconds: number): string {
  const totalSeconds = Math.max(Math.round(durationMilliseconds / 1000), 0);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}min ${String(seconds).padStart(2, '0')}s`;
}

export function formatStatsDuration(durationMilliseconds: number): string {
  const totalSeconds = Math.max(Math.round(durationMilliseconds / 1000), 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return seconds > 0 ? `${hours}h ${minutes}m ${seconds}s` : `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }

  return `${seconds}s`;
}

export function capitalizeFirstLetter(value: string): string {
  if (!value) {
    return value;
  }

  return value.charAt(0).toLocaleUpperCase('fr-FR') + value.slice(1);
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
  });
}

export function getCycleStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: 'Actif',
    completed: 'Termine',
    planned: 'Planifie',
  };

  return labels[status] ?? status;
}

export async function fetchAllCollection<Item>(path: string, token: string): Promise<Item[]> {
  const items: Item[] = [];
  let nextPath: string | null = path.includes('?')
    ? `${path}&itemsPerPage=100`
    : `${path}?itemsPerPage=100`;

  while (nextPath) {
    const collection: ApiCollection<Item> = await apiRequest<ApiCollection<Item>>(
      apiPathFromIri(nextPath),
      { token },
    );
    items.push(...(collection.member ?? collection['hydra:member'] ?? []));

    const view: CollectionView | undefined = collection.view ?? collection['hydra:view'];
    const next: string | null = view?.next ?? view?.['hydra:next'] ?? null;
    nextPath = next ? apiPathFromIri(next) : null;
  }

  return items;
}

export function apiPathFromIri(iri: string): string {
  if (iri.startsWith('http://') || iri.startsWith('https://')) {
    const url = new URL(iri);
    return apiPathFromIri(url.pathname + url.search);
  }

  if (iri.startsWith('/api/')) {
    return iri.slice(4);
  }

  if (iri.startsWith('/api?')) {
    return iri.slice(4);
  }

  return iri;
}

export function splitList(value: string): string[] {
  return value
    .split(/[;,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}
