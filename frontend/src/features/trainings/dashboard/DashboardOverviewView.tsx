import { useMemo, useState, type ReactElement, type SVGProps } from 'react';
import { TrainingLogoBadge } from '../TrainingBranding';
import type { StatsOverview, Training, TrainingDashboardSummary, View } from '../trainingsTypes';
import './dashboard.css';

type DashboardPageProps = {
  dashboardSummaries: TrainingDashboardSummary[];
  deleteTrainingMutation: { mutate: (trainingIri: string) => void; isPending: boolean };
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

type IconProps = SVGProps<SVGSVGElement>;

type OverviewMetric = {
  icon: (props: IconProps) => ReactElement;
  label: string;
  value: string;
};

type GlobalRow = {
  icon: (props: IconProps) => ReactElement;
  label: string;
  value: string;
};

type FeaturedStat = {
  icon: (props: IconProps) => ReactElement;
  label: string;
  value: string;
};

function iconProps(props: IconProps) {
  return {
    viewBox: '0 0 24 24',
    width: 24,
    height: 24,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...props,
  };
}

function TargetIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <circle cx="12" cy="12" r="7.2" />
      <circle cx="12" cy="12" r="3.6" />
      <path d="M12 8.4v3.6h3.6" />
      <path d="m15.6 8.4 2.8-2.8" />
    </svg>
  );
}

function CheckCircleIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <circle cx="12" cy="12" r="8" />
      <path d="m8.5 12.2 2.2 2.2 4.8-5.2" />
    </svg>
  );
}

function RepeatIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M8 6.5h9" />
      <path d="m14 3.8 3 2.7-3 2.7" />
      <path d="M16 17.5H7" />
      <path d="m10 14.8-3 2.7 3 2.7" />
      <path d="M8 6.5C5.9 6.5 5 7.7 5 9.6V11" />
      <path d="M16 17.5c2.1 0 3-1.2 3-3.1V13" />
    </svg>
  );
}

function TrendUpIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M4.5 17.5h15" />
      <path d="m5.5 14.8 4.1-4 3.2 2.8 5.7-6" />
      <path d="m16 7.6 2.5-.1-.1 2.5" />
    </svg>
  );
}

function HistoryIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M4.8 12a7.2 7.2 0 1 0 2.1-5.1" />
      <path d="M4.8 5.8v3.7h3.7" />
      <path d="M12 8v4.2l2.8 1.7" />
    </svg>
  );
}

function SearchIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <circle cx="11" cy="11" r="5.8" />
      <path d="m16 16 2.8 2.8" />
    </svg>
  );
}

function HourglassIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M8 4.8h8" />
      <path d="M8 19.2h8" />
      <path d="M8.7 4.8c0 3 2.2 4 3.3 5.2 1.1-1.2 3.3-2.2 3.3-5.2" />
      <path d="M8.7 19.2c0-3 2.2-4 3.3-5.2 1.1 1.2 3.3 2.2 3.3 5.2" />
    </svg>
  );
}

function SparkIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="m12 4.6 1.6 4.2 4.2 1.6-4.2 1.6-1.6 4.2-1.6-4.2-4.2-1.6 4.2-1.6Z" />
    </svg>
  );
}

function MoreIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <circle cx="12" cy="5.2" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="18.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function truncate(value?: string | null, maxLength = 96) {
  const normalized = value?.trim() ?? '';
  if (!normalized) {
    return 'Description à compléter.';
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
}

function formatCompactDate(value?: string | null) {
  if (!value) {
    return 'Aucune';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Aucune';
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date).replace(',', '');
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

function getOverviewMetrics(summaries: TrainingDashboardSummary[], statsOverview: StatsOverview | null): OverviewMetric[] {
  const activeTrainings = summaries.filter((summary) => summary.latestCycleStatus === 'active' || summary.hasResumableCycle).length;
  const selectedPuzzleCount = statsOverview?.puzzleCount ?? summaries.reduce((total, summary) => total + summary.puzzleCount, 0);
  const attempts = statsOverview?.attemptCount ?? summaries.reduce((total, summary) => total + summary.attemptCount, 0);
  const averageProgress = summaries.length
    ? Math.round(summaries.reduce((total, summary) => total + summary.progressPercent, 0) / summaries.length)
    : 0;

  return [
    { icon: TargetIcon, label: 'Entraînements actifs', value: String(activeTrainings) },
    { icon: SearchIcon, label: 'Puzzles enregistrés', value: String(selectedPuzzleCount) },
    { icon: RepeatIcon, label: 'Tentatives', value: String(attempts) },
    { icon: TrendUpIcon, label: 'Progression globale', value: `${averageProgress}%` },
  ];
}

function getGlobalRows(statsOverview: StatsOverview | null, selectedSummary: TrainingDashboardSummary | null): GlobalRow[] {
  return [
    {
      icon: TargetIcon,
      label: 'Taux de réussite',
      value: `${Math.round(statsOverview?.successRate ?? 0)}%`,
    },
    {
      icon: SearchIcon,
      label: 'Puzzles enregistrés',
      value: String(statsOverview?.puzzleCount ?? selectedSummary?.puzzleCount ?? 0),
    },
    {
      icon: RepeatIcon,
      label: 'Tentatives',
      value: String(statsOverview?.attemptCount ?? selectedSummary?.attemptCount ?? 0),
    },
    {
      icon: CheckCircleIcon,
      label: 'Cycles actifs',
      value: String(statsOverview?.activeCycleCount ?? 0),
    },
    {
      icon: HistoryIcon,
      label: 'Dernière activité',
      value: formatCompactDate(statsOverview?.latestAttemptedAt),
    },
  ];
}

function getFeaturedStats(summary: TrainingDashboardSummary): FeaturedStat[] {
  return [
    { icon: SearchIcon, label: 'Problèmes', value: String(summary.puzzleCount) },
    { icon: CheckCircleIcon, label: 'Résolus', value: String(summary.solvedCount) },
    { icon: SparkIcon, label: 'À revoir', value: String(summary.failedCount) },
    { icon: HourglassIcon, label: 'Restants', value: String(summary.pendingCount) },
    { icon: RepeatIcon, label: 'Tentatives', value: String(summary.attemptCount) },
  ];
}

function DashboardOverviewView({
  dashboardSummaries,
  deleteTrainingMutation,
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
  const [openActionsTrainingIri, setOpenActionsTrainingIri] = useState<string | null>(null);
  const visibleSummaries = useMemo(
    () => (dashboardSummaries.length > 0 ? dashboardSummaries : buildFallbackSummaries(trainings)),
    [dashboardSummaries, trainings],
  );
  const selectedSummary = visibleSummaries.find((summary) => summary.training['@id'] === selectedTrainingIri) ?? visibleSummaries[0] ?? null;
  const overviewMetrics = getOverviewMetrics(visibleSummaries, statsOverview);
  const globalRows = getGlobalRows(statsOverview, selectedSummary);
  const showLoading = isTrainingsLoading && trainings.length === 0;
  const showEmpty = !showLoading && visibleSummaries.length === 0;
  const showError = isError && Boolean(errorMessage) && visibleSummaries.length === 0;

  if (showLoading) {
    return (
      <section className="dashboard-page dashboard-page--loading">
        <p className="wp-empty">Chargement des entraînements...</p>
      </section>
    );
  }

  return (
    <section className="dashboard-page">
      <header className="dashboard-page__hero">
        <div>
          <h1 className="dashboard-page__title">Mes entraînements</h1>
          <p className="dashboard-page__subtitle">Tes vraies données, dans une vue plus lisible et plus compacte.</p>
        </div>
        <button className="dashboard-page__create" type="button" onClick={onCreate}>
          <span>+</span>
          <span>Créer un entraînement</span>
        </button>
      </header>

      {showError ? <p className="wp-empty">{errorMessage}</p> : null}

      <section className="dashboard-page__metrics" aria-label="Synthèse globale">
        {overviewMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <article className="dashboard-page__metric-card" key={metric.label}>
              <div className="dashboard-page__metric-left">
                <span className="dashboard-page__metric-icon"><Icon /></span>
                <span className="dashboard-page__metric-label">{metric.label}</span>
              </div>
              <strong className="dashboard-page__metric-value">{metric.value}</strong>
            </article>
          );
        })}
      </section>

      <section className="dashboard-page__top-grid">
        <article className="dashboard-page__panel dashboard-page__panel--featured">
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
                  <span>{truncate(selectedSummary.training.description, 112)}</span>
                </div>
              </div>

              <div className="dashboard-page__progress-block">
                <div className="dashboard-page__progress-line">
                  <span style={{ width: `${selectedSummary.progressPercent}%` }} />
                </div>
                <strong>{selectedSummary.progressPercent}%</strong>
              </div>

              <div className="dashboard-page__featured-stats">
                {getFeaturedStats(selectedSummary).map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div className="dashboard-page__featured-stat" key={stat.label}>
                      <span className="dashboard-page__featured-stat-label">
                        <span className="dashboard-page__featured-stat-icon"><Icon /></span>
                        <span>{stat.label}</span>
                      </span>
                      <strong>{stat.value}</strong>
                    </div>
                  );
                })}
              </div>

              <div className="dashboard-page__actions">
                <button className="dashboard-page__action dashboard-page__action--primary" type="button" onClick={() => onOpenTraining(selectedSummary.training['@id'], 'detail')}>
                  Continuer l'entraînement
                </button>
                <button className="dashboard-page__action" type="button" onClick={() => onOpenTraining(selectedSummary.training['@id'], 'detail')}>
                  Voir le détail
                </button>
              </div>
            </>
          ) : (
            <p className="wp-empty">Sélectionne ou crée un entraînement pour commencer.</p>
          )}
        </article>

        <article className="dashboard-page__panel dashboard-page__panel--stats">
          <div className="dashboard-page__panel-head">
            <h2>Statistiques globales</h2>
          </div>

          <div className="dashboard-page__stats-list">
            {globalRows.map((row) => {
              const Icon = row.icon;
              return (
                <div className="dashboard-page__stats-row" key={row.label}>
                  <div className="dashboard-page__stats-label">
                    <span className="dashboard-page__stats-icon"><Icon /></span>
                    <strong>{row.label}</strong>
                  </div>
                  <div className="dashboard-page__stats-value">{row.value}</div>
                </div>
              );
            })}
          </div>
        </article>
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
              <article className="dashboard-page__list-row" key={summary.training['@id']}>
                <button className="dashboard-page__list-main" type="button" onClick={() => onOpenTraining(summary.training['@id'], 'detail')}>
                  <span className="dashboard-page__list-glyph">
                    <TrainingLogoBadge size="sm" training={summary.training} />
                  </span>
                  <span className="dashboard-page__list-copy">
                    <strong>{summary.training.name}</strong>
                    <small>{truncate(summary.training.description, 86)}</small>
                  </span>
                </button>

                <div className="dashboard-page__list-progress">
                  <div className="dashboard-page__progress-line dashboard-page__progress-line--small">
                    <span style={{ width: `${summary.progressPercent}%` }} />
                  </div>
                  <strong>{summary.progressPercent}%</strong>
                </div>

                <div className="dashboard-page__list-end">
                  <button
                    aria-label={`Options pour ${summary.training.name}`}
                    className="dashboard-page__menu-button"
                    type="button"
                    onClick={() => setOpenActionsTrainingIri((current) => current === summary.training['@id'] ? null : summary.training['@id'])}
                  >
                    <MoreIcon />
                  </button>
                  {openActionsTrainingIri === summary.training['@id'] ? (
                    <div className="dashboard-page__menu">
                      <button type="button" onClick={() => { setOpenActionsTrainingIri(null); onOpenTraining(summary.training['@id'], 'detail'); }}>
                        Ouvrir
                      </button>
                      <button
                        disabled={deleteTrainingMutation.isPending}
                        type="button"
                        onClick={() => {
                          setOpenActionsTrainingIri(null);
                          deleteTrainingMutation.mutate(summary.training['@id']);
                        }}
                      >
                        Supprimer
                      </button>
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

export type { DashboardPageProps };
export { DashboardOverviewView };
export default DashboardOverviewView;


