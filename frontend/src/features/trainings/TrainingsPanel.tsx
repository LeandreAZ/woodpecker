import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { apiRequest } from '../../shared/api/client';
import type { AuthSession } from '../auth/authStorage';
import { parsePuzzleCsv, type PuzzleCsvRow } from './csvImport';
import { PuzzleSolver, type PuzzleCompletionResult } from './PuzzleSolver';

type TrainingsPanelProps = {
  session: AuthSession;
  onLogout: () => void;
};

type View = 'dashboard' | 'create' | 'detail' | 'import' | 'solver';

type Training = {
  '@id': string;
  id: number;
  name: string;
  description?: string | null;
  status: string;
  createdAt: string;
};

type Puzzle = {
  '@id': string;
  id: number;
  fen?: string | null;
  solution: string[];
  themes: string[];
  rating?: number | null;
};

type TrainingPuzzle = {
  '@id': string;
  id: number;
  training: string;
  puzzle: Puzzle | string;
  position: number;
  personalNote?: string | null;
};

type Cycle = {
  '@id': string;
  id: number;
  training: string;
  number: number;
  status: string;
  startedAt?: string | null;
};

type CyclePuzzle = {
  '@id': string;
  id: number;
  cycle: string;
  trainingPuzzle: string;
  position: number;
  status: string;
};

type TrainingSession = {
  '@id': string;
  id: number;
  training: string;
  cycle?: string | null;
  startedAt: string;
};

type Attempt = {
  '@id': string;
  id: number;
  cyclePuzzle: string;
  trainingSession: string;
  playedMoves: string[];
  successful: boolean;
  mistakesCount: number;
  durationMilliseconds: number;
};

type ApiCollection<Item> = {
  member?: Item[];
  'hydra:member'?: Item[];
  view?: CollectionView;
  'hydra:view'?: CollectionView;
};

type CollectionView = {
  next?: string;
  'hydra:next'?: string;
};

export function TrainingsPanel({ session, onLogout }: TrainingsPanelProps) {
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTrainingIri, setSelectedTrainingIri] = useState<string | null>(null);
  const [fen, setFen] = useState('');
  const [solutionText, setSolutionText] = useState('');
  const [themesText, setThemesText] = useState('');
  const [rating, setRating] = useState('');
  const [personalNote, setPersonalNote] = useState('');
  const [csvRows, setCsvRows] = useState<PuzzleCsvRow[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [csvFileName, setCsvFileName] = useState('');
  const [selectedTrainingPuzzleIri, setSelectedTrainingPuzzleIri] = useState<string | null>(null);
  const [activeCycleIri, setActiveCycleIri] = useState<string | null>(null);
  const [activeTrainingSessionIri, setActiveTrainingSessionIri] = useState<string | null>(null);
  const [savedCyclePuzzleIris, setSavedCyclePuzzleIris] = useState<Set<string>>(() => new Set());
  const [failedCyclePuzzleIris, setFailedCyclePuzzleIris] = useState<Set<string>>(() => new Set());

  const trainingsQuery = useQuery({
    queryKey: ['trainings', session.email],
    queryFn: () => fetchAllCollection<Training>('/trainings', session.token),
  });

  const effectiveSelectedTrainingIri = selectedTrainingIri ?? trainingsQuery.data?.[0]?.['@id'] ?? null;
  const selectedTraining =
    trainingsQuery.data?.find((training) => training['@id'] === effectiveSelectedTrainingIri) ?? null;

  const trainingPuzzlesQuery = useQuery({
    queryKey: ['training-puzzles', session.email, effectiveSelectedTrainingIri],
    enabled: Boolean(effectiveSelectedTrainingIri),
    queryFn: async () => {
      const trainingPuzzles = await fetchAllCollection<TrainingPuzzle>(
        '/training_puzzles',
        session.token,
      );

      return trainingPuzzles
        .filter((trainingPuzzle) => trainingPuzzle.training === effectiveSelectedTrainingIri)
        .sort((left, right) => left.position - right.position);
    },
  });

  const cyclesQuery = useQuery({
    queryKey: ['cycles', session.email, effectiveSelectedTrainingIri],
    enabled: Boolean(effectiveSelectedTrainingIri),
    queryFn: async () => {
      const cycles = await fetchAllCollection<Cycle>('/cycles', session.token);

      return cycles
        .filter((cycle) => cycle.training === effectiveSelectedTrainingIri)
        .sort((left, right) => left.number - right.number);
    },
  });

  const effectiveActiveCycleIri =
    activeCycleIri ??
    cyclesQuery.data
      ?.filter((cycle) => cycle.status === 'active')
      .at(-1)?.['@id'] ??
    null;

  const cyclePuzzlesQuery = useQuery({
    queryKey: ['cycle-puzzles', session.email, effectiveActiveCycleIri],
    enabled: Boolean(effectiveActiveCycleIri),
    queryFn: async () => {
      const cyclePuzzles = await fetchAllCollection<CyclePuzzle>('/cycle_puzzles', session.token);

      return cyclePuzzles
        .filter((cyclePuzzle) => cyclePuzzle.cycle === effectiveActiveCycleIri)
        .sort((left, right) => left.position - right.position);
    },
  });

  const trainingSessionsQuery = useQuery({
    queryKey: ['training-sessions', session.email, effectiveSelectedTrainingIri, effectiveActiveCycleIri],
    enabled: Boolean(effectiveSelectedTrainingIri && effectiveActiveCycleIri),
    queryFn: async () => {
      const trainingSessions = await fetchAllCollection<TrainingSession>(
        '/training_sessions',
        session.token,
      );

      return trainingSessions.filter(
        (trainingSession) =>
          trainingSession.training === effectiveSelectedTrainingIri &&
          trainingSession.cycle === effectiveActiveCycleIri,
      );
    },
  });

  const effectiveSelectedTrainingPuzzleIri =
    selectedTrainingPuzzleIri ?? trainingPuzzlesQuery.data?.[0]?.['@id'] ?? null;
  const selectedTrainingPuzzle =
    trainingPuzzlesQuery.data?.find(
      (trainingPuzzle) => trainingPuzzle['@id'] === effectiveSelectedTrainingPuzzleIri,
    ) ?? null;
  const selectedTrainingPuzzleLinkedPuzzle =
    selectedTrainingPuzzle && typeof selectedTrainingPuzzle.puzzle === 'string'
      ? selectedTrainingPuzzle.puzzle
      : null;
  const selectedPuzzleQuery = useQuery({
    queryKey: ['puzzle', session.email, selectedTrainingPuzzleLinkedPuzzle],
    enabled: Boolean(selectedTrainingPuzzleLinkedPuzzle),
    queryFn: () =>
      apiRequest<Puzzle>(apiPathFromIri(selectedTrainingPuzzleLinkedPuzzle ?? ''), {
        token: session.token,
      }),
  });
  const selectedPuzzle =
    selectedTrainingPuzzle && typeof selectedTrainingPuzzle.puzzle !== 'string'
      ? selectedTrainingPuzzle.puzzle
      : selectedPuzzleQuery.data;
  const selectedPuzzleCount = trainingPuzzlesQuery.data?.length ?? 0;
  const effectiveActiveTrainingSessionIri =
    activeTrainingSessionIri ?? trainingSessionsQuery.data?.at(-1)?.['@id'] ?? null;
  const selectedCyclePuzzle =
    cyclePuzzlesQuery.data?.find(
      (cyclePuzzle) => cyclePuzzle.trainingPuzzle === selectedTrainingPuzzle?.['@id'],
    ) ?? null;
  const selectedCyclePuzzleIsSaved = selectedCyclePuzzle
    ? selectedCyclePuzzle.status === 'solved' || savedCyclePuzzleIris.has(selectedCyclePuzzle['@id'])
    : false;

  const createTrainingMutation = useMutation({
    mutationFn: async () =>
      apiRequest<Training>('/trainings', {
        method: 'POST',
        token: session.token,
        body: {
          name: name.trim(),
          description: description.trim() || null,
        },
      }),
    onSuccess: async (training) => {
      setName('');
      setDescription('');
      setSelectedTrainingIri(training['@id']);
      setSelectedTrainingPuzzleIri(null);
      setActiveView('detail');
      await queryClient.invalidateQueries({ queryKey: ['trainings', session.email] });
    },
  });

  const createPuzzleMutation = useMutation({
    mutationFn: async () => {
      if (!effectiveSelectedTrainingIri) {
        throw new Error('Sélectionne un entraînement avant d’ajouter un puzzle.');
      }

      const solution = splitList(solutionText);

      if (solution.length === 0) {
        throw new Error('Ajoute au moins un coup dans Moves.');
      }

      const puzzle = await apiRequest<Puzzle>('/puzzles', {
        method: 'POST',
        token: session.token,
        body: {
          fen: fen.trim() || null,
          solution,
          themes: splitList(themesText),
          rating: rating.trim() ? Number(rating) : null,
        },
      });

      await apiRequest<TrainingPuzzle>('/training_puzzles', {
        method: 'POST',
        token: session.token,
        body: {
          training: effectiveSelectedTrainingIri,
          puzzle: puzzle['@id'],
          position: trainingPuzzlesQuery.data?.length ?? 0,
          personalNote: personalNote.trim() || null,
        },
      });

      return puzzle;
    },
    onSuccess: async () => {
      setFen('');
      setSolutionText('');
      setThemesText('');
      setRating('');
      setPersonalNote('');
      setActiveView('solver');
      await queryClient.invalidateQueries({
        queryKey: ['training-puzzles', session.email, effectiveSelectedTrainingIri],
      });
    },
  });

  const importCsvMutation = useMutation({
    mutationFn: async () => {
      if (!effectiveSelectedTrainingIri) {
        throw new Error('Sélectionne un entraînement avant d’importer des puzzles.');
      }

      if (csvRows.length === 0) {
        throw new Error('Choisis un fichier CSV valide avant de lancer l’import.');
      }

      let nextPosition = trainingPuzzlesQuery.data?.length ?? 0;

      for (const row of csvRows) {
        const puzzle = await apiRequest<Puzzle>('/puzzles', {
          method: 'POST',
          token: session.token,
          body: {
            fen: row.fen,
            solution: row.solution,
            themes: row.themes,
            rating: row.rating,
          },
        });

        await apiRequest<TrainingPuzzle>('/training_puzzles', {
          method: 'POST',
          token: session.token,
          body: {
            training: effectiveSelectedTrainingIri,
            puzzle: puzzle['@id'],
            position: nextPosition,
            personalNote: row.personalNote,
          },
        });

        nextPosition += 1;
      }

      return csvRows.length;
    },
    onSuccess: async () => {
      setCsvRows([]);
      setCsvErrors([]);
      setCsvFileName('');
      setActiveView('solver');
      await queryClient.invalidateQueries({
        queryKey: ['training-puzzles', session.email, effectiveSelectedTrainingIri],
      });
    },
  });

  const startCycleMutation = useMutation({
    mutationFn: async () => {
      if (!effectiveSelectedTrainingIri) {
        throw new Error('Sélectionne un entraînement avant de démarrer un cycle.');
      }

      const trainingPuzzles = trainingPuzzlesQuery.data ?? [];

      if (trainingPuzzles.length === 0) {
        throw new Error('Ajoute au moins un puzzle avant de démarrer un cycle.');
      }

      const nextCycleNumber =
        (cyclesQuery.data ?? []).reduce((highest, cycle) => Math.max(highest, cycle.number), 0) + 1;

      const cycle = await apiRequest<Cycle>('/cycles', {
        method: 'POST',
        token: session.token,
        body: {
          training: effectiveSelectedTrainingIri,
          number: nextCycleNumber,
          status: 'active',
          startedAt: new Date().toISOString(),
        },
      });

      for (const trainingPuzzle of trainingPuzzles) {
        await apiRequest<CyclePuzzle>('/cycle_puzzles', {
          method: 'POST',
          token: session.token,
          body: {
            cycle: cycle['@id'],
            trainingPuzzle: trainingPuzzle['@id'],
            position: trainingPuzzle.position,
            status: 'pending',
          },
        });
      }

      const trainingSession = await apiRequest<TrainingSession>('/training_sessions', {
        method: 'POST',
        token: session.token,
        body: {
          training: effectiveSelectedTrainingIri,
          cycle: cycle['@id'],
          note: `Session du cycle ${nextCycleNumber}`,
        },
      });

      return { cycle, trainingSession };
    },
    onSuccess: async ({ cycle, trainingSession }) => {
      setActiveCycleIri(cycle['@id']);
      setActiveTrainingSessionIri(trainingSession['@id']);
      setSavedCyclePuzzleIris(new Set());
      setFailedCyclePuzzleIris(new Set());
      setActiveView('solver');
      await queryClient.invalidateQueries({
        queryKey: ['cycles', session.email, effectiveSelectedTrainingIri],
      });
      await queryClient.invalidateQueries({
        queryKey: ['cycle-puzzles', session.email, cycle['@id']],
      });
      await queryClient.invalidateQueries({
        queryKey: ['training-sessions', session.email, effectiveSelectedTrainingIri, cycle['@id']],
      });
    },
  });

  const recordAttemptMutation = useMutation({
    mutationFn: async ({
      cyclePuzzle,
      result,
      successful,
      trainingSession,
    }: {
      cyclePuzzle: CyclePuzzle;
      result: PuzzleCompletionResult;
      successful: boolean;
      trainingSession: string;
    }) => {
      const attempt = await apiRequest<Attempt>('/attempts', {
        method: 'POST',
        token: session.token,
        body: {
          cyclePuzzle: cyclePuzzle['@id'],
          trainingSession,
          playedMoves: result.playedMoves,
          successful,
          mistakesCount: result.mistakesCount,
          durationMilliseconds: result.durationMilliseconds,
        },
      });

      await apiRequest<CyclePuzzle>(apiPathFromIri(cyclePuzzle['@id']), {
        method: 'PATCH',
        token: session.token,
        contentType: 'application/merge-patch+json',
        body: {
          status: successful ? 'solved' : 'failed',
          completedAt: new Date().toISOString(),
        },
      });

      return attempt;
    },
    onMutate: ({ cyclePuzzle, successful }) => {
      if (successful) {
        setSavedCyclePuzzleIris((current) => new Set(current).add(cyclePuzzle['@id']));
        setFailedCyclePuzzleIris((current) => {
          const next = new Set(current);
          next.delete(cyclePuzzle['@id']);

          return next;
        });
      } else {
        setFailedCyclePuzzleIris((current) => new Set(current).add(cyclePuzzle['@id']));
      }
    },
    onError: (_error, { cyclePuzzle, successful }) => {
      if (successful) {
        setSavedCyclePuzzleIris((current) => {
          const next = new Set(current);
          next.delete(cyclePuzzle['@id']);

          return next;
        });

        return;
      }

      setFailedCyclePuzzleIris((current) => {
        const next = new Set(current);
        next.delete(cyclePuzzle['@id']);

        return next;
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['cycle-puzzles', session.email, effectiveActiveCycleIri],
      });
    },
  });

  function openTraining(trainingIri: string, view: View = 'detail') {
    setSelectedTrainingIri(trainingIri);
    setSelectedTrainingPuzzleIri(null);
    setActiveCycleIri(null);
    setActiveTrainingSessionIri(null);
    setSavedCyclePuzzleIris(new Set());
    setFailedCyclePuzzleIris(new Set());
    setActiveView(view);
  }

  return (
    <main className="wp-layout">
      <aside className="wp-sidebar">
        <div className="wp-logo">
          <span className="wp-logo-icon">♜</span>
          <div>
            <strong>Woodpecker</strong>
            <span>Trainer</span>
          </div>
        </div>

        <nav className="wp-nav" aria-label="Navigation principale">
          <NavButton active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')}>
            Tableau de bord
          </NavButton>
          <NavButton active={activeView === 'detail'} onClick={() => setActiveView('detail')}>
            Mes entraînements
          </NavButton>
          <NavButton active={activeView === 'create'} onClick={() => setActiveView('create')}>
            Créer
          </NavButton>
          <NavButton active={activeView === 'import'} onClick={() => setActiveView('import')}>
            Import CSV
          </NavButton>
          <NavButton active={activeView === 'solver'} onClick={() => setActiveView('solver')}>
            Solveur
          </NavButton>
        </nav>

        <div className="wp-sidebar-footer">
          <span>{session.email}</span>
          <button type="button" onClick={onLogout}>
            Déconnexion
          </button>
        </div>
      </aside>

      <section className="wp-main">
        {activeView === 'dashboard' && (
          <DashboardView
            isError={trainingsQuery.isError}
            isLoading={trainingsQuery.isLoading}
            onCreate={() => setActiveView('create')}
            onOpenTraining={openTraining}
            selectedTrainingIri={effectiveSelectedTrainingIri}
            trainings={trainingsQuery.data ?? []}
            errorMessage={trainingsQuery.error?.message}
          />
        )}

        {activeView === 'create' && (
          <CreateTrainingView
            description={description}
            errorMessage={createTrainingMutation.error?.message}
            isError={createTrainingMutation.isError}
            isPending={createTrainingMutation.isPending}
            name={name}
            onDescriptionChange={setDescription}
            onNameChange={setName}
            onSubmit={() => createTrainingMutation.mutate()}
          />
        )}

        {activeView === 'detail' && (
          <DetailView
            createPuzzleMutation={createPuzzleMutation}
            fen={fen}
            onFenChange={setFen}
            onImport={() => setActiveView('import')}
            onOpenSolver={() => setActiveView('solver')}
            onStartCycle={() => startCycleMutation.mutate()}
            onPersonalNoteChange={setPersonalNote}
            onPuzzleSelect={(trainingPuzzleIri) => {
              setSelectedTrainingPuzzleIri(trainingPuzzleIri);
              setActiveView('solver');
            }}
            onRatingChange={setRating}
            onSolutionTextChange={setSolutionText}
            onThemesTextChange={setThemesText}
            personalNote={personalNote}
            puzzleCount={selectedPuzzleCount}
            rating={rating}
            selectedTraining={selectedTraining}
            solutionText={solutionText}
            themesText={themesText}
            trainingPuzzles={trainingPuzzlesQuery.data ?? []}
            trainingPuzzlesError={trainingPuzzlesQuery.error?.message}
            trainingPuzzlesIsError={trainingPuzzlesQuery.isError}
            trainingPuzzlesIsLoading={trainingPuzzlesQuery.isLoading}
            startCycleError={startCycleMutation.error?.message}
            startCycleIsError={startCycleMutation.isError}
            startCycleIsPending={startCycleMutation.isPending}
          />
        )}

        {activeView === 'import' && (
          <ImportView
            csvErrors={csvErrors}
            csvFileName={csvFileName}
            csvRows={csvRows}
            errorMessage={importCsvMutation.error?.message}
            isError={importCsvMutation.isError}
            isPending={importCsvMutation.isPending}
            onFileParsed={(fileName, rows, errors) => {
              setCsvFileName(fileName);
              setCsvRows(rows);
              setCsvErrors(errors);
            }}
            onResetFile={() => {
              setCsvFileName('');
              setCsvRows([]);
              setCsvErrors([]);
            }}
            onSubmit={() => importCsvMutation.mutate()}
            selectedTraining={selectedTraining}
          />
        )}

        {activeView === 'solver' && (
          <SolverView
            attemptError={recordAttemptMutation.error?.message}
            attemptIsError={recordAttemptMutation.isError}
            attemptIsPending={recordAttemptMutation.isPending}
            cyclePuzzles={cyclePuzzlesQuery.data ?? []}
            currentCyclePuzzle={selectedCyclePuzzle}
            hasActiveCycle={Boolean(effectiveActiveCycleIri && effectiveActiveTrainingSessionIri)}
            onBackToDetail={() => setActiveView('detail')}
            onPuzzleCompleted={(result) => {
              if (
                !selectedCyclePuzzle ||
                !effectiveActiveTrainingSessionIri ||
                selectedCyclePuzzleIsSaved
              ) {
                return;
              }

              recordAttemptMutation.mutate({
                cyclePuzzle: selectedCyclePuzzle,
                result,
                successful: true,
                trainingSession: effectiveActiveTrainingSessionIri,
              });
            }}
            onPuzzleFailed={(result) => {
              if (!selectedCyclePuzzle || !effectiveActiveTrainingSessionIri || selectedCyclePuzzleIsSaved) {
                return;
              }

              recordAttemptMutation.mutate({
                cyclePuzzle: selectedCyclePuzzle,
                result,
                successful: false,
                trainingSession: effectiveActiveTrainingSessionIri,
              });
            }}
            onPuzzleSelect={setSelectedTrainingPuzzleIri}
            failedCyclePuzzleIris={failedCyclePuzzleIris}
            savedCyclePuzzleIris={savedCyclePuzzleIris}
            selectedPuzzle={selectedPuzzle}
            selectedTraining={selectedTraining}
            selectedTrainingPuzzle={selectedTrainingPuzzle}
            trainingPuzzles={trainingPuzzlesQuery.data ?? []}
          />
        )}
      </section>
    </main>
  );
}

function NavButton({
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

function DashboardView({
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

function CreateTrainingView({
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

function DetailView({
  createPuzzleMutation,
  fen,
  onFenChange,
  onImport,
  onOpenSolver,
  onStartCycle,
  onPersonalNoteChange,
  onPuzzleSelect,
  onRatingChange,
  onSolutionTextChange,
  onThemesTextChange,
  personalNote,
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
  createPuzzleMutation: ReturnType<typeof useMutation<Puzzle, Error, void, unknown>>;
  fen: string;
  onFenChange: (value: string) => void;
  onImport: () => void;
  onOpenSolver: () => void;
  onStartCycle: () => void;
  onPersonalNoteChange: (value: string) => void;
  onPuzzleSelect: (trainingPuzzleIri: string) => void;
  onRatingChange: (value: string) => void;
  onSolutionTextChange: (value: string) => void;
  onThemesTextChange: (value: string) => void;
  personalNote: string;
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
        <Stat label="Progression" value="0%" />
        <Stat label="Statut" value={selectedTraining.status} />
        <Stat label="Créé le" value={new Date(selectedTraining.createdAt).toLocaleDateString('fr-FR')} />
      </div>

      <div className="wp-two-columns">
        <section className="wp-panel">
          <div className="wp-panel-title">
            <p className="eyebrow">Ajout manuel</p>
            <h3>Ajouter un puzzle</h3>
          </div>
          <form
            className="form-stack"
            onSubmit={(event) => {
              event.preventDefault();
              createPuzzleMutation.mutate();
            }}
          >
            <label>
              FEN Lichess optionnelle
              <textarea
                onChange={(event) => onFenChange(event.target.value)}
                placeholder="FEN Lichess si connue"
                rows={2}
                value={fen}
              />
            </label>

            <label>
              Moves Lichess
              <input
                onChange={(event) => onSolutionTextChange(event.target.value)}
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
                  placeholder="fork, pin, mate"
                  value={themesText}
                />
              </label>

              <label>
                Rating
                <input
                  min={1}
                  onChange={(event) => onRatingChange(event.target.value)}
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
                placeholder="Pourquoi ce puzzle est intéressant ?"
                rows={3}
                value={personalNote}
              />
            </label>

            {createPuzzleMutation.isError && (
              <p className="alert error-alert">{createPuzzleMutation.error.message}</p>
            )}

            <button className="wp-primary" disabled={createPuzzleMutation.isPending} type="submit">
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
            <button className="wp-secondary" type="button" onClick={onImport}>Importer CSV</button>
          </div>

          <div className="wp-cycle-actions">
            <button
              className="wp-primary full"
              disabled={startCycleIsPending || trainingPuzzles.length === 0}
              type="button"
              onClick={onStartCycle}
            >
              {startCycleIsPending ? 'Démarrage...' : 'Démarrer le cycle'}
            </button>
            <p>Crée un cycle actif, prépare les puzzles du cycle, puis ouvre le solveur.</p>
          </div>

          {startCycleIsError && <p className="alert error-alert">{startCycleError}</p>}

          {trainingPuzzlesIsLoading && <p className="wp-empty">Chargement des puzzles...</p>}
          {trainingPuzzlesIsError && <p className="alert error-alert">{trainingPuzzlesError}</p>}
          {!trainingPuzzlesIsLoading && trainingPuzzles.length === 0 && (
            <p className="wp-empty">Aucun puzzle ajouté pour l’instant.</p>
          )}

          <div className="wp-puzzle-table">
            {trainingPuzzles.map((trainingPuzzle) => {
              const puzzle = typeof trainingPuzzle.puzzle === 'string' ? null : trainingPuzzle.puzzle;

              return (
                <button
                  className="wp-puzzle-row"
                  key={trainingPuzzle['@id']}
                  type="button"
                  onClick={() => onPuzzleSelect(trainingPuzzle['@id'])}
                >
                  <span>#{trainingPuzzle.position + 1}</span>
                  <strong>{puzzle?.solution.join(' ') ?? 'Puzzle à charger'}</strong>
                  <em>{puzzle?.themes.join(', ') || trainingPuzzle.personalNote || 'Sans thème'}</em>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function ImportView({
  csvErrors,
  csvFileName,
  csvRows,
  errorMessage,
  isError,
  isPending,
  onFileParsed,
  onResetFile,
  onSubmit,
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

          <label className="wp-dropzone">
            <span>Choisir un fichier CSV</span>
            <small>Les coups doivent être en notation UCI.</small>
            <input
              accept=".csv,text/csv"
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
            disabled={!selectedTraining || isPending || csvRows.length === 0 || csvErrors.length > 0}
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

function SolverView({
  attemptError,
  attemptIsError,
  attemptIsPending,
  currentCyclePuzzle,
  cyclePuzzles,
  failedCyclePuzzleIris,
  hasActiveCycle,
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
  currentCyclePuzzle: CyclePuzzle | null;
  cyclePuzzles: CyclePuzzle[];
  failedCyclePuzzleIris: Set<string>;
  hasActiveCycle: boolean;
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
  const solvedCyclePuzzlesCount = cyclePuzzles.filter(
    (cyclePuzzle) => cyclePuzzle.status === 'solved' || savedCyclePuzzleIris.has(cyclePuzzle['@id']),
  ).length;
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
              <strong>{hasActiveCycle ? 'Cycle actif' : 'Mode libre'}</strong>
              <span>
                {hasActiveCycle
                  ? `${solvedCyclePuzzlesCount} / ${cyclePuzzles.length} puzzle(s) sauvegardé(s)`
                  : 'Démarre un cycle depuis le détail pour sauvegarder les tentatives.'}
              </span>
            </div>

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

async function fetchAllCollection<Item>(path: string, token: string): Promise<Item[]> {
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

function apiPathFromIri(iri: string): string {
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

function splitList(value: string): string[] {
  return value
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}
