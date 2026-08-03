import { useMutation } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { parsePuzzleCsv, type PuzzleCsvRow } from './csvImport';
import { PuzzleSolver, type PuzzleCompletionResult } from './PuzzleSolver';
import {
  formatDateTime,
  formatDuration,
  getCycleStatusLabel,
} from './trainingsUtils';
import type {
  Attempt,
  Cycle,
  CyclePuzzle,
  CycleStats,
  Puzzle,
  Training,
  TrainingPuzzle,
  View,
} from './trainingsTypes';
import { mistakeLimitOptions } from './trainingsTypes';
export function NavButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button className={active ? 'active' : undefined} type="button" onClick={onClick}>
      {children}
    </button>
  );
}

export function DashboardView({
  errorMessage,
  isError,
  isLoading,
  onCreate,
  onOpenTraining,
  selectedTrainingIri,
  trainings,
}: {
  errorMessage?: string;
  isError: boolean;
  isLoading: boolean;
  onCreate: () => void;
  onOpenTraining: (trainingIri: string, view?: View) => void;
  selectedTrainingIri: string | null;
  trainings: Training[];
}) {
  return (
    <div className="wp-page">
      <PageHeader
        eyebrow="Tableau de bord"
        title="Mes entraînements"
        description="Reprends un cycle, crée un nouvel entraînement ou ouvre directement le solveur."
        action={<button className="wp-primary" type="button" onClick={onCreate}>+ Créer un entraînement</button>}
      />

      {isLoading && <p className="wp-empty">Chargement des entraînements...</p>}
      {isError && <p className="alert error-alert">{errorMessage}</p>}
      {!isLoading && trainings.length === 0 && (
        <div className="wp-empty-card">
          <h3>Aucun entraînement pour l’instant</h3>
          <p>Crée ton premier set Woodpecker, puis ajoute des puzzles manuellement ou via CSV.</p>
          <button className="wp-primary" type="button" onClick={onCreate}>
            Créer le premier entraînement
          </button>
        </div>
      )}

      {trainings.length > 0 && (
        <div className="wp-training-grid">
          {trainings.map((training) => (
            <article
              className={training['@id'] === selectedTrainingIri ? 'wp-training-card selected' : 'wp-training-card'}
              key={training['@id']}
            >
              <div>
                <h3>{training.name}</h3>
                <p>{training.description || 'Aucune description pour le moment.'}</p>
              </div>
              <div className="wp-card-meta">
                <span>{training.status}</span>
                <span>{new Date(training.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="wp-progress"><span /></div>
              <div className="wp-card-actions">
                <button type="button" onClick={() => onOpenTraining(training['@id'], 'detail')}>
                  Ouvrir
                </button>
                <button type="button" onClick={() => onOpenTraining(training['@id'], 'solver')}>
                  Solveur
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export function CreateTrainingView({
  description,
  errorMessage,
  isError,
  isPending,
  name,
  onDescriptionChange,
  onNameChange,
  onSubmit,
}: {
  description: string;
  errorMessage?: string;
  isError: boolean;
  isPending: boolean;
  name: string;
  onDescriptionChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="wp-page narrow">
      <PageHeader
        eyebrow="Création"
        title="Créer un entraînement"
        description="Donne un nom clair à ton set. Tu pourras ensuite ajouter ou importer tes puzzles."
      />

      <form
        className="wp-form-card"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <label>
          Titre de l’entraînement
          <input
            maxLength={120}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Ex : Mat en 2 - avancé"
            required
            value={name}
          />
        </label>

        <label>
          Description
          <textarea
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder="Objectif, niveau, source des puzzles..."
            rows={6}
            value={description}
          />
        </label>

        {isError && <p className="alert error-alert">{errorMessage}</p>}

        <button className="wp-primary" disabled={isPending || name.trim().length === 0} type="submit">
          {isPending ? 'Création...' : "Créer l'entraînement"}
        </button>
      </form>
    </div>
  );
}

export function DetailView({
  attempts,
  attemptsError,
  attemptsIsError,
  attemptsIsLoading,
  createPuzzleMutation,
  cycles,
  cyclePuzzles,
  cycleStats,
  cycleStatusLabel,
  deletePuzzleError,
  deletePuzzleIsError,
  deletePuzzleIsPending,
  fen,
  hasResumableCycle,
  movePuzzleError,
  movePuzzleIsError,
  movePuzzleIsPending,
  onFenChange,
  onImport,
  onOpenSolver,
  onStartCycle,
  onPersonalNoteChange,
  onPuzzleDelete,
  onPuzzleMove,
  onPuzzleSelect,
  onRatingChange,
  onSolutionTextChange,
  onThemesTextChange,
  personalNote,
  puzzleListIsLocked,
  puzzleCount,
  rating,
  selectedTraining,
  solutionText,
  themesText,
  trainingPuzzles,
  trainingPuzzlesError,
  trainingPuzzlesIsError,
  trainingPuzzlesIsLoading,
  startCycleError,
  startCycleIsError,
  startCycleIsPending,
}: {
  attempts: Attempt[];
  attemptsError?: string;
  attemptsIsError: boolean;
  attemptsIsLoading: boolean;
  createPuzzleMutation: ReturnType<typeof useMutation<Puzzle, Error, void, unknown>>;
  cycles: Cycle[];
  cyclePuzzles: CyclePuzzle[];
  cycleStats: CycleStats;
  cycleStatusLabel: string;
  deletePuzzleError?: string;
  deletePuzzleIsError: boolean;
  deletePuzzleIsPending: boolean;
  fen: string;
  hasResumableCycle: boolean;
  movePuzzleError?: string;
  movePuzzleIsError: boolean;
  movePuzzleIsPending: boolean;
  onFenChange: (value: string) => void;
  onImport: () => void;
  onOpenSolver: () => void;
  onStartCycle: () => void;
  onPersonalNoteChange: (value: string) => void;
  onPuzzleDelete: (trainingPuzzleIri: string) => void;
  onPuzzleMove: (trainingPuzzleIri: string, direction: 'down' | 'up') => void;
  onPuzzleSelect: (trainingPuzzleIri: string) => void;
  onRatingChange: (value: string) => void;
  onSolutionTextChange: (value: string) => void;
  onThemesTextChange: (value: string) => void;
  personalNote: string;
  puzzleListIsLocked: boolean;
  puzzleCount: number;
  rating: string;
  selectedTraining: Training | null;
  solutionText: string;
  themesText: string;
  trainingPuzzles: TrainingPuzzle[];
  trainingPuzzlesError?: string;
  trainingPuzzlesIsError: boolean;
  trainingPuzzlesIsLoading: boolean;
  startCycleError?: string;
  startCycleIsError: boolean;
  startCycleIsPending: boolean;
}) {
  if (!selectedTraining) {
    return (
      <div className="wp-page">
        <PageHeader
          eyebrow="Détail"
          title="Sélectionne un entraînement"
          description="Retourne au tableau de bord pour ouvrir un entraînement existant."
        />
      </div>
    );
  }

  const cycleByIri = new Map(cycles.map((cycle) => [cycle['@id'], cycle]));
  const cyclePuzzleByIri = new Map(cyclePuzzles.map((cyclePuzzle) => [cyclePuzzle['@id'], cyclePuzzle]));
  const trainingPuzzleByIri = new Map(
    trainingPuzzles.map((trainingPuzzle) => [trainingPuzzle['@id'], trainingPuzzle]),
  );
  const cycleSummaries = [...cycles]
    .sort((left, right) => right.number - left.number)
    .map((cycle) => {
      const relatedCyclePuzzles = cyclePuzzles.filter(
        (cyclePuzzle) => cyclePuzzle.cycle === cycle['@id'],
      );
      const relatedCyclePuzzleIris = new Set(
        relatedCyclePuzzles.map((cyclePuzzle) => cyclePuzzle['@id']),
      );
      const solved = relatedCyclePuzzles.filter((cyclePuzzle) => cyclePuzzle.status === 'solved').length;
      const failed = relatedCyclePuzzles.filter((cyclePuzzle) => cyclePuzzle.status === 'failed').length;
      const pending = relatedCyclePuzzles.filter((cyclePuzzle) => cyclePuzzle.status === 'pending').length;
      const total = relatedCyclePuzzles.length;
      const progressPercent = total > 0 ? Math.round((solved / total) * 100) : 0;
      const attemptCount = attempts.filter((attempt) =>
        relatedCyclePuzzleIris.has(attempt.cyclePuzzle),
      ).length;

      return {
        attemptCount,
        cycle,
        failed,
        pending,
        progressPercent,
        solved,
        total,
      };
    });
  const latestAttempts = attempts.slice(0, 8);

  return (
    <div className="wp-page">
      <PageHeader
        eyebrow="Détail entraînement"
        title={selectedTraining.name}
        description={selectedTraining.description || 'Ajoute des puzzles, importe un CSV ou commence la résolution.'}
        action={<button className="wp-secondary" type="button" onClick={onOpenSolver}>Ouvrir le solveur</button>}
      />

      <div className="wp-stats">
        <Stat label="Puzzles" value={String(puzzleCount)} />
        <Stat label="Progression" value={`${cycleStats.progressPercent}%`} />
        <Stat label="Résolus" value={String(cycleStats.solved)} />
        <Stat label="À revoir" value={String(cycleStats.failed)} />
        <Stat label="Restants" value={String(cycleStats.pending)} />
        <Stat label="Tentatives" value={String(attempts.length)} />
        <Stat label="Cycle" value={cycleStatusLabel} />
      </div>

      <div className="wp-two-columns">
        <section className="wp-panel">
          <div className="wp-panel-title">
            <p className="eyebrow">Ajout manuel</p>
            <h3>Ajouter un puzzle</h3>
          </div>
          {puzzleListIsLocked && (
            <p className="alert info-alert">
              La liste de puzzles est verrouillée car un cycle existe déjà. C’est voulu : un training
              Woodpecker doit garder le même set pendant ses répétitions.
            </p>
          )}
          <form
            className="form-stack"
            onSubmit={(event) => {
              event.preventDefault();
              if (!puzzleListIsLocked) {
                createPuzzleMutation.mutate();
              }
            }}
          >
            <label>
              FEN Lichess optionnelle
              <textarea
                onChange={(event) => onFenChange(event.target.value)}
                disabled={puzzleListIsLocked}
                placeholder="FEN Lichess si connue"
                rows={2}
                value={fen}
              />
            </label>

            <label>
              Moves Lichess
              <input
                onChange={(event) => onSolutionTextChange(event.target.value)}
                disabled={puzzleListIsLocked}
                placeholder="ex: e2e4 e7e5 g1f3"
                required
                value={solutionText}
              />
            </label>

            <div className="form-grid">
              <label>
                Thèmes
                <input
                  onChange={(event) => onThemesTextChange(event.target.value)}
                  disabled={puzzleListIsLocked}
                  placeholder="fork, pin, mate"
                  value={themesText}
                />
              </label>

              <label>
                Rating
                <input
                  min={1}
                  onChange={(event) => onRatingChange(event.target.value)}
                  disabled={puzzleListIsLocked}
                  placeholder="1500"
                  type="number"
                  value={rating}
                />
              </label>
            </div>

            <label>
              Note perso
              <textarea
                onChange={(event) => onPersonalNoteChange(event.target.value)}
                disabled={puzzleListIsLocked}
                placeholder="Pourquoi ce puzzle est intéressant ?"
                rows={3}
                value={personalNote}
              />
            </label>

            {createPuzzleMutation.isError && (
              <p className="alert error-alert">{createPuzzleMutation.error.message}</p>
            )}

            <button className="wp-primary" disabled={createPuzzleMutation.isPending || puzzleListIsLocked} type="submit">
              {createPuzzleMutation.isPending ? 'Ajout...' : 'Ajouter le puzzle'}
            </button>
          </form>
        </section>

        <section className="wp-panel">
          <div className="wp-panel-title with-action">
            <div>
              <p className="eyebrow">Puzzles</p>
              <h3>Liste du training</h3>
            </div>
            <button className="wp-secondary" disabled={puzzleListIsLocked} type="button" onClick={onImport}>
              Importer CSV
            </button>
          </div>

          <div className="wp-cycle-actions">
            <button
              className="wp-primary full"
              disabled={startCycleIsPending || trainingPuzzles.length === 0}
              type="button"
              onClick={onStartCycle}
            >
              {startCycleIsPending
                ? hasResumableCycle
                  ? 'Reprise...'
                  : 'Démarrage...'
                : hasResumableCycle
                  ? 'Reprendre le cycle'
                  : 'Démarrer le cycle'}
            </button>
            <p>
              {hasResumableCycle
                ? 'Rouvre le cycle actif existant et continue la résolution sans créer de doublon.'
                : 'Crée un cycle actif, prépare les puzzles du cycle, puis ouvre le solveur.'}
            </p>
          </div>

          {startCycleIsError && <p className="alert error-alert">{startCycleError}</p>}

          {trainingPuzzlesIsLoading && <p className="wp-empty">Chargement des puzzles...</p>}
          {trainingPuzzlesIsError && <p className="alert error-alert">{trainingPuzzlesError}</p>}
          {deletePuzzleIsError && <p className="alert error-alert">{deletePuzzleError}</p>}
          {movePuzzleIsError && <p className="alert error-alert">{movePuzzleError}</p>}
          {!trainingPuzzlesIsLoading && trainingPuzzles.length === 0 && (
            <p className="wp-empty">Aucun puzzle ajouté pour l’instant.</p>
          )}

          <div className="wp-puzzle-table">
            {trainingPuzzles.map((trainingPuzzle, index) => {
              const puzzle = typeof trainingPuzzle.puzzle === 'string' ? null : trainingPuzzle.puzzle;

              return (
                <div className="wp-puzzle-row-with-actions" key={trainingPuzzle['@id']}>
                  <button
                    className="wp-puzzle-row"
                    type="button"
                    onClick={() => onPuzzleSelect(trainingPuzzle['@id'])}
                  >
                    <span>#{trainingPuzzle.position + 1}</span>
                    <strong>{puzzle?.solution.join(' ') ?? 'Puzzle à charger'}</strong>
                    <em>{puzzle?.themes.join(', ') || trainingPuzzle.personalNote || 'Sans thème'}</em>
                  </button>
                  {!puzzleListIsLocked && (
                    <div className="wp-puzzle-actions">
                      <button
                        className="wp-icon-action"
                        disabled={movePuzzleIsPending || index === 0}
                        type="button"
                        onClick={() => onPuzzleMove(trainingPuzzle['@id'], 'up')}
                      >
                        ↑
                      </button>
                      <button
                        className="wp-icon-action"
                        disabled={movePuzzleIsPending || index === trainingPuzzles.length - 1}
                        type="button"
                        onClick={() => onPuzzleMove(trainingPuzzle['@id'], 'down')}
                      >
                        ↓
                      </button>
                      <button
                        className="wp-danger"
                        disabled={deletePuzzleIsPending}
                        type="button"
                        onClick={() => {
                          const shouldDelete = window.confirm(
                            `Supprimer le puzzle ${trainingPuzzle.position + 1} de ce training ?`,
                          );

                          if (shouldDelete) {
                            onPuzzleDelete(trainingPuzzle['@id']);
                          }
                        }}
                      >
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="wp-panel wp-history-panel">
        <div className="wp-panel-title">
          <p className="eyebrow">Cycles</p>
          <h3>Historique des cycles</h3>
        </div>

        {cycleSummaries.length === 0 && (
          <p className="wp-empty">
            Aucun cycle lancé pour l’instant. Démarre un cycle quand ta liste de puzzles est prête.
          </p>
        )}

        {cycleSummaries.length > 0 && (
          <div className="wp-cycle-list">
            {cycleSummaries.map((summary) => (
              <article className="wp-cycle-row" key={summary.cycle['@id']}>
                <div>
                  <strong>Cycle {summary.cycle.number}</strong>
                  <span>{getCycleStatusLabel(summary.cycle.status)}</span>
                </div>
                <div className="wp-cycle-row-progress">
                  <div className="wp-progress">
                    <span style={{ width: `${summary.progressPercent}%` }} />
                  </div>
                  <small>
                    {summary.solved} résolu(s), {summary.failed} à revoir, {summary.pending} restant(s)
                  </small>
                </div>
                <div className="wp-cycle-row-meta">
                  <span>{summary.attemptCount} tentative(s)</span>
                  <span>
                    {summary.cycle.startedAt ? `Début ${formatDateTime(summary.cycle.startedAt)}` : 'Pas démarré'}
                  </span>
                  {summary.cycle.completedAt && (
                    <span>Fin {formatDateTime(summary.cycle.completedAt)}</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="wp-panel wp-history-panel">
        <div className="wp-panel-title">
          <p className="eyebrow">Historique</p>
          <h3>Dernières tentatives</h3>
        </div>

        {attemptsIsLoading && <p className="wp-empty">Chargement des tentatives...</p>}
        {attemptsIsError && <p className="alert error-alert">{attemptsError}</p>}
        {!attemptsIsLoading && latestAttempts.length === 0 && (
          <p className="wp-empty">
            Aucune tentative sauvegardée pour l’instant. Démarre un cycle puis résous un puzzle.
          </p>
        )}

        {latestAttempts.length > 0 && (
          <div className="wp-attempt-list">
            {latestAttempts.map((attempt) => {
              const cyclePuzzle = cyclePuzzleByIri.get(attempt.cyclePuzzle);
              const cycle = cyclePuzzle ? cycleByIri.get(cyclePuzzle.cycle) : null;
              const trainingPuzzle = cyclePuzzle
                ? trainingPuzzleByIri.get(cyclePuzzle.trainingPuzzle)
                : null;

              return (
                <article className="wp-attempt-row" key={attempt['@id']}>
                  <div>
                    <strong>{attempt.successful ? 'Réussi' : 'À revoir'}</strong>
                    <span>
                      {cycle ? `Cycle ${cycle.number}` : 'Cycle'}
                      {' · '}
                      {trainingPuzzle ? `Puzzle ${trainingPuzzle.position + 1}` : 'Puzzle'}
                    </span>
                  </div>
                  <div className="wp-attempt-metrics">
                    <span>{attempt.mistakesCount} erreur(s)</span>
                    <span>{formatDuration(attempt.durationMilliseconds)}</span>
                    <span>{formatDateTime(attempt.attemptedAt)}</span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export function ImportView({
  csvErrors,
  csvFileName,
  csvRows,
  errorMessage,
  isError,
  isPending,
  onFileParsed,
  onResetFile,
  onSubmit,
  puzzleListIsLocked,
  selectedTraining,
}: {
  csvErrors: string[];
  csvFileName: string;
  csvRows: PuzzleCsvRow[];
  errorMessage?: string;
  isError: boolean;
  isPending: boolean;
  onFileParsed: (fileName: string, rows: PuzzleCsvRow[], errors: string[]) => void;
  onResetFile: () => void;
  onSubmit: () => void;
  puzzleListIsLocked: boolean;
  selectedTraining: Training | null;
}) {
  return (
    <div className="wp-page">
      <PageHeader
        eyebrow="Import CSV"
        title="Importer des puzzles Lichess"
        description={
          selectedTraining
            ? `Import dans : ${selectedTraining.name}`
            : 'Sélectionne d’abord un entraînement depuis le tableau de bord.'
        }
      />

      <div className="wp-two-columns">
        <section className="wp-panel">
          <div className="wp-panel-title">
            <p className="eyebrow">Fichier</p>
            <h3>CSV compatible Lichess</h3>
          </div>
          <p className="muted">
            Colonnes attendues : <code>PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags</code>.
            Seule <code>Moves</code> est obligatoire.
          </p>
          {puzzleListIsLocked && (
            <p className="alert info-alert">
              Import désactivé : un cycle existe déjà, donc la liste de puzzles est verrouillée.
            </p>
          )}

          <label className="wp-dropzone">
            <span>Choisir un fichier CSV</span>
            <small>Les coups doivent être en notation UCI.</small>
            <input
              accept=".csv,text/csv"
              disabled={puzzleListIsLocked}
              type="file"
              onChange={async (event) => {
                const file = event.target.files?.[0];

                if (!file) {
                  onResetFile();
                  return;
                }

                const result = parsePuzzleCsv(await file.text());
                onFileParsed(file.name, result.rows, result.errors);
              }}
            />
          </label>
        </section>

        <section className="wp-panel">
          <div className="wp-panel-title">
            <p className="eyebrow">Résumé</p>
            <h3>Prévisualisation</h3>
          </div>

          <div className="wp-stats compact">
            <Stat label="Puzzles détectés" value={String(csvRows.length)} />
            <Stat label="Erreurs détectées" value={String(csvErrors.length)} />
          </div>

          {csvFileName && <p className="muted">Fichier chargé : <strong>{csvFileName}</strong></p>}

          {csvErrors.length > 0 && (
            <div className="alert error-alert">
              <p>Import impossible pour le moment :</p>
              <ul>
                {csvErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {isError && <p className="alert error-alert">{errorMessage}</p>}

          <button
            className="wp-primary full"
            disabled={
              !selectedTraining ||
              puzzleListIsLocked ||
              isPending ||
              csvRows.length === 0 ||
              csvErrors.length > 0
            }
            type="button"
            onClick={onSubmit}
          >
            {isPending ? 'Import...' : `Importer ${csvRows.length} puzzle(s)`}
          </button>
        </section>
      </div>
    </div>
  );
}

export function SolverView({
  attemptError,
  attemptIsError,
  attemptIsPending,
  cycleIsFinished,
  cycleStats,
  currentCyclePuzzle,
  cyclePuzzles,
  failedCyclePuzzleIris,
  hasActiveCycle,
  mistakeLimit,
  mistakeLimitError,
  mistakeLimitIsError,
  mistakeLimitIsPending,
  onMistakeLimitChange,
  onBackToDetail,
  onPuzzleCompleted,
  onPuzzleFailed,
  onPuzzleSelect,
  savedCyclePuzzleIris,
  selectedPuzzle,
  selectedTraining,
  selectedTrainingPuzzle,
  trainingPuzzles,
}: {
  attemptError?: string;
  attemptIsError: boolean;
  attemptIsPending: boolean;
  cycleIsFinished: boolean;
  cycleStats: CycleStats;
  currentCyclePuzzle: CyclePuzzle | null;
  cyclePuzzles: CyclePuzzle[];
  failedCyclePuzzleIris: Set<string>;
  hasActiveCycle: boolean;
  mistakeLimit: number;
  mistakeLimitError?: string;
  mistakeLimitIsError: boolean;
  mistakeLimitIsPending: boolean;
  onMistakeLimitChange: (value: number) => void;
  onBackToDetail: () => void;
  onPuzzleCompleted: (result: PuzzleCompletionResult) => void;
  onPuzzleFailed: (result: PuzzleCompletionResult) => void;
  onPuzzleSelect: (trainingPuzzleIri: string) => void;
  savedCyclePuzzleIris: Set<string>;
  selectedPuzzle?: Puzzle;
  selectedTraining: Training | null;
  selectedTrainingPuzzle: TrainingPuzzle | null;
  trainingPuzzles: TrainingPuzzle[];
}) {
  const currentCyclePuzzleIsSolved = currentCyclePuzzle
    ? currentCyclePuzzle.status === 'solved' || savedCyclePuzzleIris.has(currentCyclePuzzle['@id'])
    : false;
  const currentCyclePuzzleIsFailed = currentCyclePuzzle
    ? currentCyclePuzzle.status === 'failed' || failedCyclePuzzleIris.has(currentCyclePuzzle['@id'])
    : false;

  return (
    <div className="wp-page solver-page">
      <PageHeader
        eyebrow="Solveur"
        title={selectedTraining ? selectedTraining.name : 'Aucun entraînement sélectionné'}
        description="Résous les puzzles un par un. Le format suit la convention Lichess."
        action={<button className="wp-secondary" type="button" onClick={onBackToDetail}>Retour au détail</button>}
      />

      {!selectedTraining && <p className="wp-empty">Sélectionne un entraînement depuis le tableau de bord.</p>}
      {selectedTraining && trainingPuzzles.length === 0 && (
        <p className="wp-empty">Cet entraînement ne contient pas encore de puzzle.</p>
      )}

      {selectedTraining && trainingPuzzles.length > 0 && (
        <div className="wp-solver-layout">
          <aside className="wp-solver-list">
            <p className="eyebrow">Puzzles</p>
            {trainingPuzzles.map((trainingPuzzle) => {
              const cyclePuzzle = cyclePuzzles.find(
                (item) => item.trainingPuzzle === trainingPuzzle['@id'],
              );
              const isSolved = cyclePuzzle
                ? cyclePuzzle.status === 'solved' || savedCyclePuzzleIris.has(cyclePuzzle['@id'])
                : false;
              const isFailed = cyclePuzzle
                ? cyclePuzzle.status === 'failed' || failedCyclePuzzleIris.has(cyclePuzzle['@id'])
                : false;
              const className = [
                'wp-solver-list-item',
                trainingPuzzle['@id'] === selectedTrainingPuzzle?.['@id'] ? 'active' : '',
                isSolved ? 'solved' : '',
                isFailed && !isSolved ? 'failed' : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <button
                  className={className}
                  key={trainingPuzzle['@id']}
                  type="button"
                  onClick={() => onPuzzleSelect(trainingPuzzle['@id'])}
                >
                  <span>Puzzle {trainingPuzzle.position + 1}</span>
                  {isSolved && <small>Résolu</small>}
                  {isFailed && !isSolved && <small>À revoir</small>}
                </button>
              );
            })}
          </aside>

          <section className="wp-solver-board-panel">
            <div className={hasActiveCycle ? 'wp-cycle-status active' : 'wp-cycle-status'}>
              <strong>
                {cycleIsFinished ? 'Cycle terminé' : hasActiveCycle ? 'Cycle actif' : 'Mode libre'}
              </strong>
              <span>
                {cycleIsFinished
                  ? `${cycleStats.solved} résolu(s), ${cycleStats.failed} à revoir. Retour au détail pour le bilan.`
                  : hasActiveCycle
                  ? `${cycleStats.solved} résolu(s), ${cycleStats.failed} à revoir, ${cycleStats.pending} restant(s)`
                  : 'Démarre un cycle depuis le détail pour sauvegarder les tentatives.'}
              </span>
            </div>

            <div className="wp-solver-settings">
              <span>Tolérance erreurs</span>
              <div>
                {mistakeLimitOptions.map((option) => (
                  <button
                    className={option === mistakeLimit ? 'active' : undefined}
                    key={option}
                    type="button"
                    onClick={() => onMistakeLimitChange(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {mistakeLimitIsPending && <p className="alert info-alert">Sauvegarde de la tolérance...</p>}
            {mistakeLimitIsError && <p className="alert error-alert">{mistakeLimitError}</p>}
            {attemptIsPending && <p className="alert info-alert">Sauvegarde de la tentative...</p>}
            {attemptIsError && <p className="alert error-alert">{attemptError}</p>}
            {currentCyclePuzzleIsSolved && (
              <p className="alert info-alert">
                Ce puzzle est déjà sauvegardé comme résolu. Tu peux le rejouer, mais il ne créera pas de doublon.
              </p>
            )}
            {currentCyclePuzzleIsFailed && !currentCyclePuzzleIsSolved && (
              <p className="alert warning-alert">
                Ce puzzle est marqué à revoir. Recommence-le pour tenter de le résoudre.
              </p>
            )}

            {selectedTrainingPuzzle && selectedPuzzle ? (
              <PuzzleSolver
                key={selectedTrainingPuzzle['@id']}
                fen={selectedPuzzle.fen}
                mistakeLimit={mistakeLimit}
                onCompleted={
                  currentCyclePuzzle &&
                  hasActiveCycle &&
                  !currentCyclePuzzleIsSolved
                    ? onPuzzleCompleted
                    : undefined
                }
                onFailed={
                  currentCyclePuzzle &&
                  hasActiveCycle &&
                  !currentCyclePuzzleIsSolved &&
                  !currentCyclePuzzleIsFailed
                    ? onPuzzleFailed
                    : undefined
                }
                solution={selectedPuzzle.solution}
              />
            ) : (
              <p className="wp-empty">Chargement du puzzle sélectionné...</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function PageHeader({
  action,
  description,
  eyebrow,
  title,
}: {
  action?: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <header className="wp-page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action}
    </header>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="wp-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}





