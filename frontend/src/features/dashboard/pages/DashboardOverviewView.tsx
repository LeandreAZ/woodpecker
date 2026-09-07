import { EmptyState } from '../../../shared/ui/EmptyState';
import { PageSkeleton } from '../../../shared/ui/PageSkeleton';
import {
  ChevronRight,
  CircleCheckBig,
  CircleX,
  Clock3,
  Eye,
  Hourglass,
  Play,
  Puzzle,
  RefreshCw,
  Target,
  type LucideIcon,
} from 'lucide-react';
import { useMemo, type CSSProperties } from 'react';
import { capitalizeFirstLetter } from '../../trainings/utils/training.utils';
import { TrainingLogoBadge } from '../../trainings/components/identity/TrainingBranding';
import type { Training, TrainingDashboardSummary, View } from '../../trainings/types/training.types';
import type { StatsOverview } from '../../statistics/types/statistics.types';
import '../styles/dashboard.css';

type DashboardPageProps = {
  dashboardSummaries: TrainingDashboardSummary[];
  errorMessage?: string;
  isError: boolean;
  isSummariesLoading: boolean;
  isTrainingsLoading: boolean;
  onCreate: () => void;
  onOpenTraining: (trainingIri: string, view?: View) => void;
  selectedTrainingIri: string | null;
  statsOverview: StatsOverview | null;
  trainings: Training[];
};

type MetricTone = 'primary' | 'cyan' | 'violet' | 'success';

type OverviewMetric = {
  icon: LucideIcon;
  label: string;
  tone: MetricTone;
  value: string;
};

type FeaturedStat = {
  icon: LucideIcon;
  label: string;
  tone: MetricTone | 'danger' | 'neutral';
  value: string;
};

function truncate(value?: string | null, maxLength = 96) {
  const normalized = value?.trim() ?? '';
  if (!normalized) {
    return '';
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
}

function formatRelativeActivity(value?: string | null) {
  if (!value) {
    return 'Aucune';
  }

  const date = new Date(value);
  const timestamp = date.getTime();
  if (Number.isNaN(timestamp)) {
    return 'Aucune';
  }

  const diffMilliseconds = timestamp - Date.now();
  const diffMinutes = Math.round(diffMilliseconds / 60000);
  const formatter = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });

  if (Math.abs(diffMinutes) < 60) {
    return capitalizeFirstLetter(formatter.format(diffMinutes, 'minute'));
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return capitalizeFirstLetter(formatter.format(diffHours, 'hour'));
  }

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 7) {
    return capitalizeFirstLetter(formatter.format(diffDays, 'day'));
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function buildFallbackSummaries(trainings: Training[]): TrainingDashboardSummary[] {
  return trainings.map((training) => ({
    attemptCount: 0,
    descriptionReady: Boolean(training.description?.trim()),
    failedCount: 0,
    hasResumableCycle: false,
    latestAttemptedAt: null,
    latestCycleNumber: null,
    latestCycleStatus: null,
    pendingCount: 0,
    progressPercent: 0,
    puzzleCount: 0,
    solvedCount: 0,
    training,
  }));
}

function getVisibleSummaries(
  dashboardSummaries: TrainingDashboardSummary[],
  statsOverview: StatsOverview | null,
  trainings: Training[],
) {
  if (dashboardSummaries.length > 0) {
    return dashboardSummaries;
  }

  if (statsOverview?.trainingBreakdown.length) {
    return statsOverview.trainingBreakdown;
  }

  return buildFallbackSummaries(trainings);
}

function getOverviewMetrics(summaries: TrainingDashboardSummary[], statsOverview: StatsOverview | null): OverviewMetric[] {
  const trainingCount = statsOverview?.trainingCount ?? summaries.length;
  const activeCycleCount =
    statsOverview?.activeCycleCount ??
    summaries.filter((summary) => summary.latestCycleStatus === 'active' || summary.hasResumableCycle).length;
  const puzzleCount =
    statsOverview?.puzzleCount ?? summaries.reduce((total, summary) => total + summary.puzzleCount, 0);
  const latestActivity =
    statsOverview?.latestAttemptedAt ??
    summaries.reduce<string | null>((latest, summary) => {
      if (!summary.latestAttemptedAt) {
        return latest;
      }

      if (!latest) {
        return summary.latestAttemptedAt;
      }

      return new Date(summary.latestAttemptedAt) > new Date(latest) ? summary.latestAttemptedAt : latest;
    }, null);

  return [
    { icon: Target, label: 'Entraînements', tone: 'primary', value: String(trainingCount) },
    { icon: RefreshCw, label: 'Cycles actifs', tone: 'cyan', value: String(activeCycleCount) },
    { icon: Puzzle, label: 'Puzzles totaux', tone: 'violet', value: String(puzzleCount) },
    { icon: Clock3, label: 'Dernière activité', tone: 'success', value: formatRelativeActivity(latestActivity) },
  ];
}

function getFeaturedStats(summary: TrainingDashboardSummary): FeaturedStat[] {
  return [
    { icon: Puzzle, label: 'Problèmes', tone: 'primary', value: String(summary.puzzleCount) },
    { icon: CircleCheckBig, label: 'Résolus', tone: 'success', value: String(summary.solvedCount) },
    { icon: CircleX, label: 'Ratés', tone: 'danger', value: String(summary.failedCount) },
    { icon: Hourglass, label: 'Restants', tone: 'neutral', value: String(summary.pendingCount) },
  ];
}

function getProgressStyle(): CSSProperties {
  return {
    '--dashboard-progress-color': '#3b82f6',
  } as CSSProperties;
}

export function DashboardOverviewView({
  dashboardSummaries,
  errorMessage,
  isError,
  isSummariesLoading,
  isTrainingsLoading,
  onCreate,
  onOpenTraining,
  selectedTrainingIri,
  statsOverview,
  trainings,
}: DashboardPageProps) {
  const visibleSummaries = useMemo(
    () => getVisibleSummaries(dashboardSummaries, statsOverview, trainings),
    [dashboardSummaries, statsOverview, trainings],
  );

  const selectedSummary =
    visibleSummaries.find((summary) => summary.training['@id'] === selectedTrainingIri) ?? visibleSummaries[0] ?? null;
  const overviewMetrics = getOverviewMetrics(visibleSummaries, statsOverview);
  const showLoading = isTrainingsLoading && trainings.length === 0;
  const showEmpty = !showLoading && visibleSummaries.length === 0;
  const showError = isError && Boolean(errorMessage);

  if (showLoading) return <PageSkeleton layout="dashboard" />;
  if (showEmpty && !showError) return <section className="dashboard-page">
    <header className="dashboard-page__hero"><div><h1>Mes entraînements</h1><p>Gérez vos entraînements et suivez leur progression.</p></div></header>
    <EmptyState compact={false} title="Aucun entraînement" description="Vous n’avez pas encore créé d’entraînement. Commencez dès maintenant !" action={<button className="wp-primary" type="button" onClick={onCreate}>Créer un entraînement</button>} />
  </section>;

  return (
    <section className="dashboard-page">
      <header className="dashboard-page__hero">
        <div className="dashboard-page__hero-copy">
          <h1 className="dashboard-page__title">Mes entraînements</h1>
          <p className="dashboard-page__subtitle">Gérez vos entraînements et suivez leur progression.</p>
        </div>

        <button className="dashboard-page__create" type="button" onClick={onCreate}>
          <span className="dashboard-page__create-plus" aria-hidden="true">
            +
          </span>
          <span>Créer un entraînement</span>
        </button>
      </header>

      {showError ? <p className="dashboard-page__alert">{errorMessage}</p> : null}

      <section className="dashboard-page__metrics" aria-label="Synthèse globale">
        {overviewMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <article className={`dashboard-page__metric-card is-${metric.tone}`} key={metric.label}>
              <span className="dashboard-page__metric-icon">
                <Icon aria-hidden="true" size={26} strokeWidth={1.9} />
              </span>
              <div className="dashboard-page__metric-copy">
                <span className="dashboard-page__metric-label">{metric.label}</span>
                <strong className="dashboard-page__metric-value">{metric.value}</strong>
              </div>
            </article>
          );
        })}
      </section>

      <section className="dashboard-page__panel dashboard-page__panel--featured">
        <div className="dashboard-page__panel-head">
          <h2>Entraînement sélectionné</h2>
        </div>

        {selectedSummary ? (
          <>
            <div className="dashboard-page__featured-top">
              <div className="dashboard-page__training-glyph">
                <TrainingLogoBadge size="lg" training={selectedSummary.training} />
              </div>
              <div className="dashboard-page__featured-copy">
                <strong>{selectedSummary.training.name}</strong>
                {selectedSummary.training.description?.trim() ? <span>{truncate(selectedSummary.training.description, 112)}</span> : null}
              </div>
            </div>

            <div className="dashboard-page__progress-header">
              <span>Progression du cycle</span>
              <strong>{selectedSummary.progressPercent}%</strong>
            </div>
            <div className="dashboard-page__progress-line" style={getProgressStyle()}>
              <span style={{ width: `${selectedSummary.progressPercent}%` }} />
            </div>

            <div className="dashboard-page__featured-stats">
              {getFeaturedStats(selectedSummary).map((stat) => {
                const Icon = stat.icon;
                return (
                  <article className={`dashboard-page__featured-stat is-${stat.tone}`} key={stat.label}>
                    <span className="dashboard-page__featured-stat-icon">
                      <Icon aria-hidden="true" size={18} strokeWidth={1.9} />
                    </span>
                    <div className="dashboard-page__featured-stat-copy">
                      <strong>{stat.value}</strong>
                      <span>{stat.label}</span>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="dashboard-page__actions">
              <button
                className="dashboard-page__action dashboard-page__action--primary"
                type="button"
                onClick={() => onOpenTraining(selectedSummary.training['@id'], selectedSummary.hasResumableCycle ? 'solver' : 'detail')}
              >
                <Play aria-hidden="true" size={18} strokeWidth={2} />
                <span>Continuer l'entraînement</span>
              </button>
              <button
                className="dashboard-page__action"
                type="button"
                onClick={() => onOpenTraining(selectedSummary.training['@id'], 'detail')}
              >
                <Eye aria-hidden="true" size={18} strokeWidth={2} />
                <span>Voir le détail</span>
              </button>
            </div>
          </>
        ) : (
          <p className="wp-empty">Sélectionne ou crée un entraînement pour commencer.</p>
        )}
      </section>

      <section className="dashboard-page__panel dashboard-page__panel--list">
        <div className="dashboard-page__panel-head">
          <h2>Mes entraînements</h2>
          {isSummariesLoading ? <span className="dashboard-page__loading-note">Mise à jour...</span> : null}
        </div>

        {showEmpty ? (
          <p className="wp-empty">Aucun entraînement pour le moment.</p>
        ) : (
          <div className="dashboard-page__list">
            {visibleSummaries.map((summary) => (
              <button
                key={summary.training['@id']}
                className="dashboard-page__list-row"
                style={getProgressStyle()}
                type="button"
                onClick={() => onOpenTraining(summary.training['@id'], 'detail')}
              >
                <span className="dashboard-page__list-start">
                  <span className="dashboard-page__list-glyph">
                    <TrainingLogoBadge size="sm" training={summary.training} />
                  </span>
                  <span className="dashboard-page__list-copy">
                    <strong>{summary.training.name}</strong>
                    <span className="dashboard-page__list-description"><small>{summary.training.description}</small></span>
                  </span>
                </span>

                <span className="dashboard-page__list-progress">
                  <span className="dashboard-page__progress-line dashboard-page__progress-line--small">
                    <span style={{ width: `${summary.progressPercent}%` }} />
                  </span>
                  <strong>{summary.progressPercent}%</strong>
                </span>

                <ChevronRight aria-hidden="true" className="dashboard-page__list-chevron" size={20} strokeWidth={2} />
              </button>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

export type { DashboardPageProps };
export default DashboardOverviewView;
