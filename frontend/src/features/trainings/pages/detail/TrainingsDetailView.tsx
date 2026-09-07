import { EmptyState } from '../../../../shared/ui/EmptyState';
import { useState } from 'react';
import { PageHeader } from '../../components/primitives/TrainingsViewPrimitives';
import { ConfirmationModal } from '../../../../shared/ui/ConfirmationModal';
import type { DetailViewProps } from '../../types/detail.types';
import { DetailHeader } from '../../components/detail/DetailHeader';
import { DetailCollection } from '../../components/detail/DetailCollection';
import { DetailCycleStatus } from '../../components/detail/DetailCycles';
import { DetailCycleHistory } from '../../components/detail/DetailCycles';
import { DetailCycleHistoryModal } from '../../components/detail/DetailCycles';
import { DetailStatGrid } from '../../components/detail/DetailSummary';
import { DetailRecentAttempts } from '../../components/detail/DetailSummary';
import { DetailInfoBanner } from '../../components/detail/DetailSummary';
import { buildPuzzleRows } from '../../models/detailModel';
import { buildStats } from '../../models/detailModel';
import { buildAttemptCards } from '../../models/detailModel';

export function DetailView({
  analytics,
  analyticsError,
  analyticsIsError,
  analyticsIsLoading,
  currentCycle,
  cyclePuzzles,
  cycleStats,
  cycleStatusLabel,
  hasResumableCycle,
  onBackToDashboard,
  deleteTrainingIsPending,
  onDeleteTraining,
  onEditTraining,
  onImport,
  onOpenSolver,
  onPuzzleSelect,
  onStartCycle,
  onViewAllAttemptHistory,
  puzzleCount,
  selectedTraining,
  startCycleError,
  startCycleIsError,
  startCycleIsPending,
  summary,
  summaryError,
  summaryIsError,
  summaryIsLoading,
  trainingPuzzles,
  trainingPuzzlesError,
  trainingPuzzlesIsError,
  trainingPuzzlesIsLoading,
}: DetailViewProps) {
  const [isCycleHistoryModalOpen, setIsCycleHistoryModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  if (!selectedTraining) {
    return (
      <div className="wp-page">
        <PageHeader
          action={
            <button className="wp-secondary" type="button" onClick={onBackToDashboard}>
              Retour au tableau de bord
            </button>
          }
          eyebrow="Détail"
          title="Sélectionne un entraînement"
          description="Retourne au tableau de bord pour ouvrir un entraînement existant."
        />
      </div>
    );
  }

  const cycleSummaries = summary?.cycleSummaries ?? [];
  const latestCycleSummary = summary?.latestCycleSummary ?? cycleSummaries[0] ?? null;
  const latestAttempts = summary?.latestAttempts ?? [];
  const hasCycleHistory = Boolean(currentCycle || latestCycleSummary || hasResumableCycle || cyclePuzzles.length > 0);
  const canOpenSolver = currentCycle?.status === 'active';
  const totalProblems = summary?.puzzleCount ?? trainingPuzzles.length ?? puzzleCount;
  const stats = buildStats(totalProblems, cycleStats, summary, analytics);
  const puzzleRows = buildPuzzleRows(trainingPuzzles, cyclePuzzles, latestAttempts, canOpenSolver, currentCycle?.number ?? latestCycleSummary?.cycle.number);
  const attemptCards = buildAttemptCards(latestAttempts);
  const isCycleProgressComplete = cycleStats.total > 0 && cycleStats.pending === 0;
  const canShowStartCycle = trainingPuzzles.length > 0 && (!canOpenSolver || isCycleProgressComplete);

  return (
    <div className="wp-page wp-detail-page">
      <DetailHeader
        canShowStartCycle={canShowStartCycle}
        canOpenSolver={canOpenSolver}
        deleteTrainingIsPending={deleteTrainingIsPending}
        hasCycleHistory={hasCycleHistory}
        onDeleteTraining={() => setIsDeleteModalOpen(true)}
        onEditTraining={onEditTraining}
        onImport={onImport}
        onOpenSolver={onOpenSolver}
        onStartCycle={onStartCycle}
        selectedTraining={selectedTraining}
        startCycleIsPending={startCycleIsPending}
      />

      {startCycleIsError && startCycleError ? <p className="alert error-alert">{startCycleError}</p> : null}
      {trainingPuzzlesIsError && trainingPuzzlesError ? <p className="alert error-alert">{trainingPuzzlesError}</p> : null}
      {summaryIsError && summaryError ? <p className="alert error-alert">{summaryError}</p> : null}
      {analyticsIsError && analyticsError ? <p className="alert error-alert">{analyticsError}</p> : null}

      <DetailStatGrid stats={stats} />

      {trainingPuzzlesIsLoading ? <p className="wp-empty">Chargement des problèmes...</p> : null}
      {summaryIsLoading && hasCycleHistory ? <p className="wp-empty">Chargement du cycle...</p> : null}
      {analyticsIsLoading && hasCycleHistory ? <p className="wp-empty">Chargement des statistiques détaillées...</p> : null}

      {totalProblems === 0 && !trainingPuzzlesIsLoading ? <EmptyState title="Aucun puzzle" description="Importez des puzzles pour préparer votre premier cycle." action={<button type="button" className="wp-primary" onClick={onImport}>Importer des puzzles</button>} /> : hasCycleHistory ? (
        <div className="wp-detail-layout">
          <div className="wp-detail-layout__main">
            <DetailCycleStatus currentCycle={currentCycle ?? latestCycleSummary?.cycle ?? null} cycleStats={cycleStats} cycleStatusLabel={cycleStatusLabel} />
            <DetailCollection canOpenSolver={canOpenSolver} onPuzzleSelect={onPuzzleSelect} rows={puzzleRows} totalProblems={totalProblems} />
            {!canOpenSolver ? (
              <DetailInfoBanner>
                <strong>Aucun cycle actif n'est disponible.</strong>
                <p>Démarrez un nouveau cycle avant d'ouvrir un puzzle dans le solveur. Sans cycle actif, aucune tentative ni autosauvegarde ne peut être créée.</p>
              </DetailInfoBanner>
            ) : null}
          </div>
          <div className="wp-detail-layout__side">
            <DetailCycleHistory cycleSummaries={cycleSummaries} onViewAll={() => setIsCycleHistoryModalOpen(true)} />
            <DetailRecentAttempts attempts={attemptCards} onViewAll={onViewAllAttemptHistory} />
          </div>
        </div>
      ) : (
        <div className="wp-detail-layout wp-detail-layout--single">
          <DetailCollection canOpenSolver={false} onPuzzleSelect={onPuzzleSelect} rows={puzzleRows} totalProblems={totalProblems} />
          <DetailInfoBanner>
            <strong>Aucun cycle n'a encore été démarré.</strong>
            <p>Importez vos puzzles et lancez votre premier cycle pour commencer à vous entraîner.</p>
          </DetailInfoBanner>
        </div>
      )}

      <DetailCycleHistoryModal cycleSummaries={cycleSummaries} onClose={() => setIsCycleHistoryModalOpen(false)} open={isCycleHistoryModalOpen} />

      <ConfirmationModal
        confirmLabel="Supprimer"
        description="Cette action est irréversible."
        isDanger
        isPending={deleteTrainingIsPending}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          setIsDeleteModalOpen(false);
          onDeleteTraining();
        }}
        open={isDeleteModalOpen}
        title="Supprimer l'entraînement ?"
      />
    </div>
  );
}

export default DetailView;
