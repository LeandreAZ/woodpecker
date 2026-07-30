import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiRequest } from '../../shared/api/client';
import type { AuthSession } from '../auth/authStorage';
import { parsePuzzleCsv, type PuzzleCsvRow } from './csvImport';
import { PuzzleSolver } from './PuzzleSolver';

type TrainingsPanelProps = {
  session: AuthSession;
  onLogout: () => void;
};

type Training = {
  '@id': string;
  id: number;
  name: string;
  description?: string | null;
  status: string;
  createdAt: string;
};

type TrainingCollection = {
  member?: Training[];
  'hydra:member'?: Training[];
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

type TrainingPuzzleCollection = {
  member?: TrainingPuzzle[];
  'hydra:member'?: TrainingPuzzle[];
};

export function TrainingsPanel({ session, onLogout }: TrainingsPanelProps) {
  const queryClient = useQueryClient();
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

  const trainingsQuery = useQuery({
    queryKey: ['trainings', session.email],
    queryFn: async () => {
      const collection = await apiRequest<TrainingCollection>('/trainings', {
        token: session.token,
      });

      return collection.member ?? collection['hydra:member'] ?? [];
    },
  });

  const selectedTraining =
    trainingsQuery.data?.find((training) => training['@id'] === selectedTrainingIri) ?? null;

  const trainingPuzzlesQuery = useQuery({
    queryKey: ['training-puzzles', session.email, selectedTrainingIri],
    enabled: Boolean(selectedTrainingIri),
    queryFn: async () => {
      const collection = await apiRequest<TrainingPuzzleCollection>('/training_puzzles', {
        token: session.token,
      });
      const trainingPuzzles = collection.member ?? collection['hydra:member'] ?? [];

      const filteredTrainingPuzzles = trainingPuzzles
        .filter((trainingPuzzle) => trainingPuzzle.training === selectedTrainingIri)
        .sort((left, right) => left.position - right.position);

      return Promise.all(
        filteredTrainingPuzzles.map(async (trainingPuzzle) => {
          if (typeof trainingPuzzle.puzzle !== 'string') {
            return trainingPuzzle;
          }

          return {
            ...trainingPuzzle,
            puzzle: await apiRequest<Puzzle>(apiPathFromIri(trainingPuzzle.puzzle), {
              token: session.token,
            }),
          };
        }),
      );
    },
  });

  const selectedTrainingPuzzle =
    trainingPuzzlesQueryData(trainingPuzzlesQuery.data).find(
      (trainingPuzzle) => trainingPuzzle['@id'] === selectedTrainingPuzzleIri,
    ) ?? null;

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
      await queryClient.invalidateQueries({ queryKey: ['trainings', session.email] });
    },
  });

  const createPuzzleMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTrainingIri) {
        throw new Error('Select a training first.');
      }

      const solution = splitList(solutionText);

      if (solution.length === 0) {
        throw new Error('Add at least one solution move.');
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
          training: selectedTrainingIri,
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
      await queryClient.invalidateQueries({
        queryKey: ['training-puzzles', session.email, selectedTrainingIri],
      });
    },
  });

  const importCsvMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTrainingIri) {
        throw new Error('Select a training first.');
      }

      if (csvRows.length === 0) {
        throw new Error('Choose a valid CSV file first.');
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
            training: selectedTrainingIri,
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
      await queryClient.invalidateQueries({
        queryKey: ['training-puzzles', session.email, selectedTrainingIri],
      });
    },
  });

  return (
    <section className="dashboard-grid">
      <div className="card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Session</p>
            <h2>Bienvenue</h2>
          </div>
          <button className="ghost-button" type="button" onClick={onLogout}>
            Se deconnecter
          </button>
        </div>
        <p className="muted">
          Connecte avec <strong>{session.email}</strong>. Les trainings affiches ici sont filtres
          cote API pour cet utilisateur.
        </p>
      </div>

      <div className="card">
        <p className="eyebrow">Nouvel entrainement</p>
        <h2>Creer un cycle Woodpecker</h2>
        <form
          className="form-stack"
          onSubmit={(event) => {
            event.preventDefault();
            createTrainingMutation.mutate();
          }}
        >
          <label>
            Nom
            <input
              maxLength={120}
              onChange={(event) => setName(event.target.value)}
              placeholder="Tactics set - juillet"
              required
              value={name}
            />
          </label>

          <label>
            Description
            <textarea
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Objectif, source des puzzles, cadence..."
              rows={4}
              value={description}
            />
          </label>

          {createTrainingMutation.isError && (
            <p className="alert error-alert">{createTrainingMutation.error.message}</p>
          )}

          <button
            className="primary-button"
            disabled={createTrainingMutation.isPending || name.trim().length === 0}
            type="submit"
          >
            {createTrainingMutation.isPending ? 'Creation...' : "Creer l'entrainement"}
          </button>
        </form>
      </div>

      <div className="card trainings-card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Mes entrainements</p>
            <h2>Liste privee</h2>
          </div>
          <span className="status-pill status-ok">
            {trainingsQuery.data?.length ?? 0} training{(trainingsQuery.data?.length ?? 0) > 1 ? 's' : ''}
          </span>
        </div>

        {trainingsQuery.isLoading && <p className="muted">Chargement des entrainements...</p>}
        {trainingsQuery.isError && <p className="alert error-alert">{trainingsQuery.error.message}</p>}

        {trainingsQuery.isSuccess && trainingsQuery.data.length === 0 && (
          <p className="empty-state">Aucun entrainement pour l'instant. Cree le premier.</p>
        )}

        {trainingsQuery.isSuccess && trainingsQuery.data.length > 0 && (
          <ul className="training-list">
            {trainingsQuery.data.map((training) => (
              <li
                className={training['@id'] === selectedTrainingIri ? 'selected-training' : undefined}
                key={training['@id']}
              >
                <div>
                  <strong>{training.name}</strong>
                  {training.description && <p>{training.description}</p>}
                </div>
                <div className="training-actions">
                  <span>{training.status}</span>
                  <button
                    className="small-button"
                    type="button"
                    onClick={() => {
                      setSelectedTrainingIri(training['@id']);
                      setSelectedTrainingPuzzleIri(null);
                    }}
                  >
                    Ouvrir
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card detail-card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Detail entrainement</p>
            <h2>{selectedTraining ? selectedTraining.name : 'Selectionne un training'}</h2>
          </div>
        </div>

        {!selectedTraining && (
          <p className="empty-state">Ouvre un entrainement pour ajouter les premiers puzzles.</p>
        )}

        {selectedTraining && (
          <div className="detail-stack">
            <p className="muted">
              Les puzzles ajoutes ici restent rattaches a cet entrainement. Pour l'instant, on saisit
              les donnees a la main; l'import CSV viendra plus tard.
            </p>

            <form
              className="form-stack"
              onSubmit={(event) => {
                event.preventDefault();
                createPuzzleMutation.mutate();
              }}
            >
              <label>
                FEN optionnelle
                <textarea
                  onChange={(event) => setFen(event.target.value)}
                  placeholder="Position FEN si connue"
                  rows={2}
                  value={fen}
                />
              </label>

              <label>
                Solution
                <input
                  onChange={(event) => setSolutionText(event.target.value)}
                  placeholder="ex: e2e4 e7e5 g1f3"
                  required
                  value={solutionText}
                />
              </label>

              <div className="form-grid">
                <label>
                  Themes
                  <input
                    onChange={(event) => setThemesText(event.target.value)}
                    placeholder="fork, pin, mate"
                    value={themesText}
                  />
                </label>

                <label>
                  Rating
                  <input
                    min={1}
                    onChange={(event) => setRating(event.target.value)}
                    placeholder="1500"
                    type="number"
                    value={rating}
                  />
                </label>
              </div>

              <label>
                Note perso
                <textarea
                  onChange={(event) => setPersonalNote(event.target.value)}
                  placeholder="Pourquoi ce puzzle est interessant ?"
                  rows={3}
                  value={personalNote}
                />
              </label>

              {createPuzzleMutation.isError && (
                <p className="alert error-alert">{createPuzzleMutation.error.message}</p>
              )}

              <button
                className="primary-button"
                disabled={createPuzzleMutation.isPending}
                type="submit"
              >
                {createPuzzleMutation.isPending ? 'Ajout...' : 'Ajouter le puzzle'}
              </button>
            </form>

            <div>
              <p className="eyebrow">Puzzles du training</p>
              {trainingPuzzlesQuery.isLoading && <p className="muted">Chargement des puzzles...</p>}
              {trainingPuzzlesQuery.isError && (
                <p className="alert error-alert">{trainingPuzzlesQuery.error.message}</p>
              )}
              {trainingPuzzlesQuery.isSuccess && trainingPuzzlesQuery.data.length === 0 && (
                <p className="empty-state">Aucun puzzle ajoute pour l'instant.</p>
              )}
              {trainingPuzzlesQuery.isSuccess && trainingPuzzlesQuery.data.length > 0 && (
                <ul className="puzzle-list">
                  {trainingPuzzlesQuery.data.map((trainingPuzzle) => {
                    const puzzle =
                      typeof trainingPuzzle.puzzle === 'string' ? null : trainingPuzzle.puzzle;

                    return (
                      <li key={trainingPuzzle['@id']}>
                        <strong>#{trainingPuzzle.position + 1}</strong>
                        <div>
                          <p>{puzzle?.solution.join(' ') ?? 'Solution non chargee'}</p>
                          {puzzle?.themes.length ? <span>{puzzle.themes.join(', ')}</span> : null}
                          {trainingPuzzle.personalNote && <em>{trainingPuzzle.personalNote}</em>}
                          {puzzle && (
                            <button
                              className="small-button puzzle-solve-button"
                              type="button"
                              onClick={() => setSelectedTrainingPuzzleIri(trainingPuzzle['@id'])}
                            >
                              Solve
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {selectedTrainingPuzzle && typeof selectedTrainingPuzzle.puzzle !== 'string' && (
              <div className="solver-section">
                <p className="eyebrow">Solveur</p>
                <PuzzleSolver
                  key={selectedTrainingPuzzle['@id']}
                  fen={selectedTrainingPuzzle.puzzle.fen}
                  solution={selectedTrainingPuzzle.puzzle.solution}
                />
              </div>
            )}

            <div className="csv-import-panel">
              <p className="eyebrow">Import CSV</p>
              <p className="muted">
                Format attendu: <code>solution,fen,themes,rating,personalNote</code>. Seule la
                colonne <code>solution</code> est obligatoire.
              </p>

              <label>
                Fichier CSV
                <input
                  accept=".csv,text/csv"
                  type="file"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];

                    if (!file) {
                      setCsvRows([]);
                      setCsvErrors([]);
                      setCsvFileName('');

                      return;
                    }

                    const result = parsePuzzleCsv(await file.text());
                    setCsvRows(result.rows);
                    setCsvErrors(result.errors);
                    setCsvFileName(file.name);
                  }}
                />
              </label>

              {csvFileName && (
                <p className="muted">
                  Fichier charge: <strong>{csvFileName}</strong> - {csvRows.length} ligne
                  {csvRows.length > 1 ? 's' : ''} valide{csvRows.length > 1 ? 's' : ''}
                </p>
              )}

              {csvErrors.length > 0 && (
                <div className="alert error-alert">
                  <p>Import impossible pour le moment:</p>
                  <ul>
                    {csvErrors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {importCsvMutation.isError && (
                <p className="alert error-alert">{importCsvMutation.error.message}</p>
              )}

              <button
                className="primary-button"
                disabled={
                  importCsvMutation.isPending || csvRows.length === 0 || csvErrors.length > 0
                }
                type="button"
                onClick={() => importCsvMutation.mutate()}
              >
                {importCsvMutation.isPending ? 'Import...' : `Importer ${csvRows.length} puzzle(s)`}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function trainingPuzzlesQueryData(trainingPuzzles: TrainingPuzzle[] | undefined): TrainingPuzzle[] {
  return trainingPuzzles ?? [];
}

function apiPathFromIri(iri: string): string {
  return iri.startsWith('/api/') ? iri.slice(4) : iri;
}

function splitList(value: string): string[] {
  return value
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}
