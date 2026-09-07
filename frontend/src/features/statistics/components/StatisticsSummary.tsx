import { type ReactElement } from 'react';
import * as AppIcons from '../../../shared/icons/AppIcons';
import type { TrainingCycleSummary, TrainingDashboardSummary } from '../../trainings/types/training.types';
import { formatStatsDuration } from '../../trainings/utils/training.utils';
import type { CardDefinition } from '../types/statisticsView.types';
import { clampPercent, formatAverageAttempts } from '../utils/statisticsFormatting';
import { hasCycleActivity } from '../utils/statisticsModel';

export function buildCard(label: string, value: string, icon: ReactElement, accent: CardDefinition['accent']): CardDefinition {
  return { accent, icon, label, value };
}

export function buildSelectedCards(cycleRows: TrainingCycleSummary[], selectedSummary: TrainingDashboardSummary | null) {
  const currentCycle = selectedSummary?.latestCycleNumber == null
    ? cycleRows.find((cycle) => cycle.cycle.status === 'active') ?? cycleRows[0]
    : cycleRows.find((cycle) => cycle.cycle.number === selectedSummary.latestCycleNumber);
  const currentCycleHasActivity = currentCycle ? hasCycleActivity(currentCycle) : false;
  const solved = currentCycleHasActivity ? currentCycle?.solved ?? 0 : 0;
  const failed = currentCycleHasActivity ? currentCycle?.failed ?? 0 : 0;
  const completedAttemptCount = currentCycleHasActivity ? currentCycle?.attemptCount ?? 0 : 0;
  const puzzlesWithCompletedAttemptsCount = currentCycleHasActivity
    ? currentCycle?.puzzlesWithCompletedAttemptsCount ?? 0
    : 0;
  const durationMilliseconds = currentCycle?.durationMilliseconds ?? 0;

  return [
    buildCard('Taux de réussite', currentCycleHasActivity && solved + failed > 0 ? `${clampPercent((solved / (solved + failed)) * 100)}%` : '—', <AppIcons.TargetIcon width={20} height={20} />, 'info'),
    buildCard('Progression', currentCycleHasActivity ? `${selectedSummary?.progressPercent ?? 0}%` : '—', <AppIcons.TrendUpIcon width={20} height={20} />, 'positive'),
    buildCard("Temps d'entraînement", formatStatsDuration(durationMilliseconds), <AppIcons.HistoryIcon width={20} height={20} />, 'info'),
    buildCard('Tentatives moyennes', currentCycleHasActivity && puzzlesWithCompletedAttemptsCount > 0
      ? formatAverageAttempts(completedAttemptCount / puzzlesWithCompletedAttemptsCount)
      : '—', <AppIcons.RepeatIcon width={20} height={20} />, 'violet'),
  ];
}
