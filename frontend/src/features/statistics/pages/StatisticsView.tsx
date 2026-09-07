import { useMemo, useState } from 'react';
import * as AppIcons from '../../../shared/icons/AppIcons';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { PageHeader } from '../../trainings/components/primitives/TrainingsViewPrimitives';
import { formatStatsDuration } from '../../trainings/utils/training.utils';
import { AttemptDistribution } from '../components/AttemptDistribution';
import { ChartEmpty } from '../components/ChartEmpty';
import { CycleResultColumns } from '../components/CycleResultsChart';
import { GenericLineChart } from '../components/GenericLineChart';
import { ResultDistribution } from '../components/ResultDistribution';
import { FilterIcon, MetricIcon } from '../components/StatisticsFilterIcons';
import { buildCard, buildSelectedCards } from '../components/StatisticsSummary';
import { TrainingTimeDistribution, TrainingTimeDistributionModal } from '../components/TimeDistribution';
import { TrainingCell } from '../components/TrainingCell';
import '../styles/statistics.css';
import type { CardDefinition, StatsMetricKey, TrainingsStatsViewProps } from '../types/statisticsView.types';
import { formatAverageAttempts, formatAveragePuzzleTime, formatCyclePeriod, formatProgressDelta } from '../utils/statisticsFormatting';
import { METRIC_OPTIONS, PERCENT_GRID, PERIOD_OPTIONS, buildCycleMetricPoints, buildCycleTimePoints, buildResultBreakdown, filterCycleRows, getAdaptiveDurationMax, getAdaptiveNumericMax, getAdaptiveTimeMax, hasCycleActivity, sortCycleRowsChronologically } from '../utils/statisticsModel';

export function TrainingsStatsView({
  errorMessage,
  isError,
  isLoading,
  onOpenTraining,
  onSelectTrainingIri,
  selectedTrainingIri,
  statsOverview,
  summary,
  summaryError,
  summaryIsError,
  summaryIsLoading,
}: TrainingsStatsViewProps) {
  const [selectedDays, setSelectedDays] = useState<(typeof PERIOD_OPTIONS)[number]['value']>(30);
  const [selectedMetric, setSelectedMetric] = useState<StatsMetricKey>('successRate');
  const [selectedAttemptScope, setSelectedAttemptScope] = useState<'all' | string>('all');
  const [isTrainingDistributionModalOpen, setIsTrainingDistributionModalOpen] = useState(false);
  const trainingBreakdown = useMemo(() => statsOverview?.trainingBreakdown ?? [], [statsOverview]);
  const selectedSummary = selectedTrainingIri
    ? trainingBreakdown.find((item) => item.training['@id'] === selectedTrainingIri) ?? null
    : null;

  const allModeCards = useMemo(() => {
    if (!statsOverview) {
      return [] as CardDefinition[];
    }

    return [
      buildCard('Taux de réussite', `${statsOverview.successRate}%`, <AppIcons.TargetIcon width={20} height={20} />, 'info'),
      buildCard('Progression globale', formatProgressDelta(statsOverview.progressPercent), <AppIcons.TrendUpIcon width={20} height={20} />, 'positive'),
      buildCard("Temps d'entraînement", formatStatsDuration(statsOverview.totalDurationMilliseconds ?? 0), <AppIcons.HistoryIcon width={20} height={20} />, 'info'),
      buildCard('Tentatives moyennes', formatAverageAttempts(statsOverview.averageAttempts ?? 0), <AppIcons.RepeatIcon width={20} height={20} />, 'violet'),
    ];
  }, [statsOverview]);

  const cycleRows = useMemo(() => filterCycleRows(summary, selectedDays), [summary, selectedDays]);
  const chronologicalCycleRows = useMemo(() => sortCycleRowsChronologically(cycleRows), [cycleRows]);
  const selectedModeCards = useMemo(() => buildSelectedCards(cycleRows, selectedSummary), [cycleRows, selectedSummary]);
  const cycleMetricPoints = useMemo(() => buildCycleMetricPoints(chronologicalCycleRows, selectedMetric), [chronologicalCycleRows, selectedMetric]);
  const cycleTimePoints = useMemo(() => buildCycleTimePoints(chronologicalCycleRows), [chronologicalCycleRows]);
  const attemptScopeOptions = useMemo(
    () => [{ label: 'Tous les cycles', value: 'all' }, ...cycleRows.map((cycle) => ({ label: `Cycle ${cycle.cycle.number}`, value: cycle.cycle['@id'] }))],
    [cycleRows],
  );
  const effectiveAttemptScope = attemptScopeOptions.some((option) => option.value === selectedAttemptScope)
    ? selectedAttemptScope
    : 'all';
  const attemptCycleRows = useMemo(
    () => effectiveAttemptScope === 'all'
      ? cycleRows
      : cycleRows.filter((cycle) => cycle.cycle['@id'] === effectiveAttemptScope),
    [cycleRows, effectiveAttemptScope],
  );
  const mostActiveRows = useMemo(
    () => [...trainingBreakdown].sort((left, right) => (right.durationMilliseconds ?? 0) - (left.durationMilliseconds ?? 0)).slice(0, 5),
    [trainingBreakdown],
  );
  const globalResultBreakdown = useMemo(
    () => buildResultBreakdown({
      failedCount: statsOverview?.failedCyclePuzzleCount,
      rescuedCount: statsOverview?.rescuedCyclePuzzleCount,
      solvedCount: statsOverview?.solvedCyclePuzzleCount,
      unresolvedCount: statsOverview?.unresolvedCyclePuzzleCount,
    }),
    [statsOverview],
  );
  const activeMetricLabel = METRIC_OPTIONS.find((option) => option.key === selectedMetric)?.label ?? 'Taux de réussite';
  const metricValues = cycleMetricPoints.map((point) => point.value);
  const metricMax = selectedMetric === 'averageAttempts'
    ? getAdaptiveNumericMax(metricValues, 1)
    : selectedMetric === 'trainingTime'
      ? getAdaptiveDurationMax(metricValues)
      : 100;
  const metricGrid = selectedMetric === 'averageAttempts'
    ? [0, metricMax * 0.33, metricMax * 0.66, metricMax].map((value) => Math.round(value * 10) / 10)
    : selectedMetric === 'trainingTime'
      ? [0, metricMax * 0.25, metricMax * 0.5, metricMax * 0.75, metricMax]
      : [...PERCENT_GRID];
  const timeValues = cycleTimePoints.map((point) => point.value);
  const timeMax = getAdaptiveTimeMax(timeValues);
  const timeGrid = [0, timeMax * 0.25, timeMax * 0.5, timeMax * 0.75, timeMax];

  if (!isLoading && !isError && statsOverview?.attemptCount === 0 && !selectedTrainingIri) return <div className="wp-page wp-training-stats-page">
    <PageHeader title="Statistiques" description="Suivez vos résultats et votre progression." />
    <EmptyState title="Aucune statistique pour le moment" description="Vos statistiques apparaîtront après vos premières tentatives dans le solveur." />
  </div>;

  return (
    <div className="wp-page wp-training-stats-page">
      <header className="wp-training-stats-page__header">
        <div>
          <h1>Statistiques</h1>
          <p>Analysez votre activité et votre progression.</p>
        </div>

        <div className="wp-training-stats-page__filters">
          <label className="wp-training-stats-select">
            <span className="wp-training-stats-select__icon"><FilterIcon /></span>
            <select value={selectedTrainingIri ?? 'all'} onChange={(event) => onSelectTrainingIri(event.target.value === 'all' ? null : event.target.value)}>
              <option value="all">Tous les trainings</option>
              {trainingBreakdown.map((item) => (
                <option key={item.training['@id']} value={item.training['@id']}>{item.training.name}</option>
              ))}
            </select>
          </label>

          {!selectedSummary ? (
            <label className="wp-training-stats-select">
              <span><AppIcons.HistoryIcon width={18} height={18} /></span>
              <select value={String(selectedDays)} onChange={(event) => setSelectedDays(Number(event.target.value) as (typeof PERIOD_OPTIONS)[number]['value'])}>
                {PERIOD_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          ) : null}
        </div>
      </header>

      {isLoading ? <p className="wp-empty">Chargement des statistiques...</p> : null}
      {isError && errorMessage ? <p className="alert error-alert">{errorMessage}</p> : null}
      {selectedSummary && summaryIsLoading ? <p className="wp-empty">Chargement du détail de l'entraînement...</p> : null}
      {selectedSummary && summaryIsError && summaryError ? <p className="alert error-alert">{summaryError}</p> : null}

      <section className="wp-training-stats-cards">
        {(selectedSummary ? selectedModeCards : allModeCards).map((card) => (
          <article key={card.label} className={`wp-training-stats-card is-${card.accent}`}>
            <div className="wp-training-stats-card__head">
              <span className="wp-training-stats-card__icon">{card.icon}</span>
              <span>{card.label}</span>
            </div>
            <strong>{card.value}</strong>
          </article>
        ))}
      </section>

      {selectedSummary ? (
        <>
          <section className="wp-training-stats-grid wp-training-stats-grid--selected-top">
            <article className="wp-training-stats-panel">
              <div className="wp-training-stats-panel__head">
                <div>
                  <h2>Évolution des cycles</h2>
                  <p>Suivez l'évolution de vos performances au fil des cycles.</p>
                </div>
                <label className="wp-training-stats-select wp-training-stats-select--compact">
                  <span><MetricIcon metric={selectedMetric} /></span>
                  <select value={selectedMetric} onChange={(event) => setSelectedMetric(event.target.value as StatsMetricKey)}>
                    {METRIC_OPTIONS.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
                  </select>
                </label>
              </div>
              <GenericLineChart
                accentClassName={selectedMetric === 'averageAttempts' ? 'is-violet' : selectedMetric === 'trainingTime' ? 'is-info' : 'is-blue'}
                emptyMessage="Aucun cycle disponible sur cette période."
                formatTooltipValue={(value) => {
                  if (selectedMetric === 'averageAttempts') {
                    return formatAverageAttempts(value);
                  }

                  if (selectedMetric === 'trainingTime') {
                    return formatStatsDuration(value);
                  }

                  return String(Math.round(value)) + '%';
                }}
                gridValues={metricGrid}
                metricLabel={activeMetricLabel}
                points={cycleMetricPoints}
              />
            </article>

            <article className="wp-training-stats-panel">
              <div className="wp-training-stats-panel__head">
                <div>
                  <h2>Temps moyen par puzzle sur chaque cycle</h2>
                  <p>Évolution du temps moyen pour résoudre un puzzle à chaque cycle.</p>
                </div>
              </div>
              <GenericLineChart
                accentClassName="is-violet"
                emptyMessage="Aucun puzzle résolu sur cette période."
                formatTooltipValue={formatAveragePuzzleTime}
                gridValues={timeGrid}
                metricLabel="Temps moyen"
                points={cycleTimePoints}
              />
            </article>
          </section>

          <section className="wp-training-stats-grid wp-training-stats-grid--selected-detail">
            <article className="wp-training-stats-panel wp-training-stats-panel--span-2">
              <div className="wp-training-stats-panel__head">
                <div>
                  <h2>Détail des cycles</h2>
                  <p>Données détaillées de chaque cycle.</p>
                </div>
              </div>
              {cycleRows.length === 0 ? (
                <ChartEmpty message="Aucun cycle disponible sur cette période." />
              ) : (
                <div className="wp-training-stats-table-wrap">
                  <table className="wp-training-stats-table">
                    <thead>
                      <tr>
                        <th>Cycle</th>
                        <th>Période</th>
                        <th>Réussite</th>
                        <th>Progression</th>
                        <th>Tentatives moy.</th>
                        <th>Temps</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cycleRows.map((cycle) => (
                        <tr key={cycle.cycle['@id']}>
                          <td>{`Cycle ${cycle.cycle.number}`}</td>
                          <td>
                            <div className="wp-training-stats-cycle-period">
                              <span>{formatCyclePeriod(cycle)}</span>
                              {cycle.cycle.status === 'active' ? <em>En cours</em> : null}
                            </div>
                          </td>
                          <td>{hasCycleActivity(cycle) ? `${Math.round(cycle.successRate ?? 0)}%` : '—'}</td>
                          <td>{hasCycleActivity(cycle) ? formatProgressDelta(cycle.progressDelta) : '—'}</td>
                          <td>{hasCycleActivity(cycle) ? formatAverageAttempts(cycle.averageAttempts ?? 0) : '—'}</td>
                          <td>{formatStatsDuration(cycle.durationMilliseconds ?? 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </article>
          </section>

          <section className="wp-training-stats-grid wp-training-stats-grid--selected-bottom">
            <article className="wp-training-stats-panel">
              <div className="wp-training-stats-panel__head">
                <div>
                  <h2>Répartition des résultats par cycle</h2>
                  <p>Visualisez la répartition des puzzles réussis directement, rattrapés après une erreur ou non résolus pour chaque cycle.</p>
                </div>
              </div>
              <CycleResultColumns cycleRows={chronologicalCycleRows} />
            </article>

            <article className="wp-training-stats-panel">
              <div className="wp-training-stats-panel__head">
                <div>
                  <h2>Distribution du nombre d'essais</h2>
                  <p>Visualisez la répartition des puzzles selon le nombre d’essais nécessaires pour les résoudre.</p>
                </div>
                <label className="wp-training-stats-select wp-training-stats-select--compact">
                  <span><AppIcons.RepeatIcon width={18} height={18} /></span>
                  <select value={effectiveAttemptScope} onChange={(event) => setSelectedAttemptScope(event.target.value)}>
                    {attemptScopeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
              </div>
              <AttemptDistribution summary={summary} cycleRows={attemptCycleRows} preferSummary={effectiveAttemptScope === 'all'} />
            </article>
          </section>
        </>
      ) : (
        <section className="wp-training-stats-grid wp-training-stats-grid--global">
          <article className="wp-training-stats-panel wp-training-stats-panel--span-2">
            <div className="wp-training-stats-panel__head">
              <div>
                <h2>Entraînements les plus actifs</h2>
                <p>Comparez le temps consacré à vos entraînements et vos résultats.</p>
              </div>
            </div>
            <div className="wp-training-stats-table-wrap">
              {mostActiveRows.length === 0 ? <ChartEmpty message="Aucune activité pour le moment." /> : (
                <table className="wp-training-stats-table wp-training-stats-table--interactive">
                  <thead>
                    <tr>
                      <th>Training</th>
                      <th>Temps</th>
                      <th>Difficulté moy.</th>
                      <th>Réussite</th>
                      <th>Progression</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mostActiveRows.map((row) => (
                      <tr key={row.training['@id']} onClick={() => onOpenTraining(row.training['@id'], 'stats')}>
                        <td><TrainingCell training={row.training} /></td>
                        <td>{formatStatsDuration(row.durationMilliseconds ?? 0)}</td>
                        <td>{row.averageRating ?? '—'}</td>
                        <td>{row.latestCycleHasCompletedPuzzles ? `${row.successRate ?? 0}%` : '—'}</td>
                        <td>{row.cycleOneHasCompletedPuzzles && row.progressSinceCycleOne != null
                          ? formatProgressDelta(row.progressSinceCycleOne)
                          : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </article>

          <article className="wp-training-stats-panel">
            <div className="wp-training-stats-panel__head">
              <div>
                <h2>Répartition du temps par training</h2>
                <p>Découvrez le temps consacré à chaque entraînement.</p>
              </div>
              {trainingBreakdown.length > 5 ? <button className="wp-training-stats-panel__action" type="button" onClick={() => setIsTrainingDistributionModalOpen(true)}>Voir tout</button> : null}
            </div>
            <TrainingTimeDistribution rows={trainingBreakdown} />
          </article>

          <article className="wp-training-stats-panel">
            <div className="wp-training-stats-panel__head">
              <div>
                <h2>Répartition des résultats</h2>
                <p>Retrouvez les puzzles réussis, rattrapés après une erreur et non résolus.</p>
              </div>
            </div>
            <ResultDistribution
              breakdown={globalResultBreakdown}
              totalLabel="Puzzles terminés"
              totalValue={(globalResultBreakdown.direct + globalResultBreakdown.rescued + globalResultBreakdown.unresolved).toLocaleString('fr-FR')}
            />
          </article>
        </section>
      )}

      <TrainingTimeDistributionModal onClose={() => setIsTrainingDistributionModalOpen(false)} open={isTrainingDistributionModalOpen} rows={trainingBreakdown} />
    </div>
  );
}

export type { TrainingsStatsViewProps };

export default TrainingsStatsView;
