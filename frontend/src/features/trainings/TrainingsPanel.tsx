import { useEffect } from 'react';
import type { AuthSession } from '../auth/authStorage';
import {
  CreateTrainingView,
  DashboardView,
  DetailView,
  ImportView,
  NavButton,
  SolverView,
} from './TrainingsPanelViews';
import type { AppRoute } from '../../shared/routing/appRouter';
import { routesEqual } from '../../shared/routing/appRouter';
import { useTrainingsPanelState } from './useTrainingsPanelState';
import type { Training, View } from './trainingsTypes';

type TrainingsPanelProps = {
  session: AuthSession;
  onLogout: () => void;
  onNavigate: (route: AppRoute, options?: { replace?: boolean }) => void;
  route: AppRoute;
};

const emptyTrainings: Training[] = [];


export function TrainingsPanel({ session, onLogout, onNavigate, route }: TrainingsPanelProps) {
  const state = useTrainingsPanelState(session);
  const {
    activeView,
    attemptsQuery,
    createPuzzleMutation,
    createTrainingMutation,
    csvErrors,
    csvFileName,
    csvRows,
    currentCycleIsFinished,
    currentCycleStatusLabel,
    cyclePuzzlesQuery,
    cycleStats,
    cyclesQuery,
    deleteTrainingPuzzleMutation,
    description,
    effectiveActiveCycleIri,
    effectiveActiveTrainingSessionIri,
    effectiveMistakeLimit,
    effectiveSelectedTrainingIri,
    failedCyclePuzzleIris,
    fen,
    hasResumableCycle,
    importCsvMutation,
    moveTrainingPuzzleMutation,
    name,
    openTraining,
    personalNote,
    puzzleListIsLocked,
    rating,
    recordAttemptMutation,
    savedCyclePuzzleIris,
    selectedCyclePuzzle,
    selectedCyclePuzzleIsSaved,
    selectedPuzzle,
    selectedPuzzleCount,
    selectedTraining,
    selectedTrainingPuzzle,
    setActiveView,
    setCsvErrors,
    setCsvFileName,
    setCsvRows,
    setDescription,
    setFen,
    setName,
    setPersonalNote,
    setRating,
    setSelectedTrainingPuzzleIri,
    setSolutionText,
    setThemesText,
    solutionText,
    startCycleMutation,
    themesText,
    trainingCyclePuzzlesQuery,
    trainingPuzzlesQuery,
    trainingsQuery,
    updateMistakeLimitMutation,
  } = state;

  const trainings = trainingsQuery.data ?? emptyTrainings;
  const desiredRoute = buildRouteFromState(activeView, selectedTraining);

  useEffect(() => {
    const targetView = viewFromRoute(route);
    const routeTrainingId = getRouteTrainingId(route);

    if (routeTrainingId) {
      const matchingTraining = trainings.find((training: Training) => training.id === routeTrainingId);

      if (!matchingTraining) {
        return;
      }

      if (matchingTraining['@id'] !== effectiveSelectedTrainingIri || activeView !== targetView) {
        openTraining(matchingTraining['@id'], targetView);
      }

      return;
    }

    if (!routesEqual(route, desiredRoute) && route.name === 'dashboard') {
      return;
    }

    if (activeView !== targetView) {
      setActiveView(targetView);
    }
  }, [activeView, desiredRoute, effectiveSelectedTrainingIri, openTraining, route, setActiveView, trainings]);

  useEffect(() => {
    const routeTrainingId = getRouteTrainingId(route);

    if (routeTrainingId && !selectedTraining && (trainingsQuery.isLoading || trainingsQuery.isFetching)) {
      return;
    }

    if (routeTrainingId && selectedTraining && selectedTraining.id !== routeTrainingId) {
      return;
    }

    if (!routesEqual(route, desiredRoute)) {
      onNavigate(desiredRoute, { replace: true });
    }
  }, [desiredRoute, onNavigate, route, selectedTraining, trainingsQuery.isFetching, trainingsQuery.isLoading]);

  function navigateToView(nextView: View) {
    setActiveView(nextView);
    onNavigate(buildRouteFromState(nextView, selectedTraining));
  }

  function navigateToTraining(trainingIri: string, view: View = 'detail') {
    openTraining(trainingIri, view);

    const training = trainings.find((item: Training) => item['@id'] === trainingIri) ?? null;
    onNavigate(buildRouteFromState(view, training));
  }

  return (
    <main className="wp-layout">
      <aside className="wp-sidebar">
        <div className="wp-logo">
          <span className="wp-logo-icon">WP</span>
          <div>
            <strong>Woodpecker</strong>
            <span>Trainer</span>
          </div>
        </div>

        <nav className="wp-nav" aria-label="Navigation principale">
          <NavButton active={activeView === 'dashboard'} onClick={() => navigateToView('dashboard')}>
            Tableau de bord
          </NavButton>
          <NavButton active={activeView === 'detail'} onClick={() => navigateToView('detail')}>
            Mes entrainements
          </NavButton>
          <NavButton active={activeView === 'create'} onClick={() => navigateToView('create')}>
            Creer
          </NavButton>
          <NavButton active={activeView === 'import'} onClick={() => navigateToView('import')}>
            Import CSV
          </NavButton>
          <NavButton active={activeView === 'solver'} onClick={() => navigateToView('solver')}>
            Solveur
          </NavButton>
        </nav>

        <div className="wp-sidebar-footer">
          <span>{session.email}</span>
          <button type="button" onClick={onLogout}>
            Deconnexion
          </button>
        </div>
      </aside>

      <section className="wp-main">
        {activeView === 'dashboard' && (
          <DashboardView
            errorMessage={trainingsQuery.error?.message}
            isError={trainingsQuery.isError}
            isLoading={trainingsQuery.isLoading}
            onCreate={() => navigateToView('create')}
            onOpenTraining={navigateToTraining}
            selectedTrainingIri={effectiveSelectedTrainingIri}
            trainings={trainings}
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
            attempts={attemptsQuery.data ?? []}
            attemptsError={attemptsQuery.error?.message}
            attemptsIsError={attemptsQuery.isError}
            attemptsIsLoading={attemptsQuery.isLoading}
            createPuzzleMutation={createPuzzleMutation}
            cycles={cyclesQuery.data ?? []}
            cyclePuzzles={trainingCyclePuzzlesQuery.data ?? cyclePuzzlesQuery.data ?? []}
            cycleStats={cycleStats}
            cycleStatusLabel={currentCycleStatusLabel}
            deletePuzzleError={deleteTrainingPuzzleMutation.error?.message}
            deletePuzzleIsError={deleteTrainingPuzzleMutation.isError}
            deletePuzzleIsPending={deleteTrainingPuzzleMutation.isPending}
            fen={fen}
            hasResumableCycle={hasResumableCycle}
            movePuzzleError={moveTrainingPuzzleMutation.error?.message}
            movePuzzleIsError={moveTrainingPuzzleMutation.isError}
            movePuzzleIsPending={moveTrainingPuzzleMutation.isPending}
            onFenChange={setFen}
            onImport={() => navigateToView('import')}
            onOpenSolver={() => navigateToView('solver')}
            onPersonalNoteChange={setPersonalNote}
            onPuzzleDelete={(trainingPuzzleIri) => deleteTrainingPuzzleMutation.mutate(trainingPuzzleIri)}
            onPuzzleMove={(trainingPuzzleIri, direction) =>
              moveTrainingPuzzleMutation.mutate({ direction, trainingPuzzleIri })
            }
            onPuzzleSelect={(trainingPuzzleIri) => {
              setSelectedTrainingPuzzleIri(trainingPuzzleIri);
              navigateToView('solver');
            }}
            onRatingChange={setRating}
            onSolutionTextChange={setSolutionText}
            onStartCycle={() => startCycleMutation.mutate()}
            onThemesTextChange={setThemesText}
            personalNote={personalNote}
            puzzleCount={selectedPuzzleCount}
            puzzleListIsLocked={puzzleListIsLocked}
            rating={rating}
            selectedTraining={selectedTraining}
            solutionText={solutionText}
            startCycleError={startCycleMutation.error?.message}
            startCycleIsError={startCycleMutation.isError}
            startCycleIsPending={startCycleMutation.isPending}
            themesText={themesText}
            trainingPuzzles={trainingPuzzlesQuery.data ?? []}
            trainingPuzzlesError={trainingPuzzlesQuery.error?.message}
            trainingPuzzlesIsError={trainingPuzzlesQuery.isError}
            trainingPuzzlesIsLoading={trainingPuzzlesQuery.isLoading}
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
            puzzleListIsLocked={puzzleListIsLocked}
            selectedTraining={selectedTraining}
          />
        )}

        {activeView === 'solver' && (
          <SolverView
            attemptError={recordAttemptMutation.error?.message}
            attemptIsError={recordAttemptMutation.isError}
            attemptIsPending={recordAttemptMutation.isPending}
            currentCyclePuzzle={selectedCyclePuzzle}
            cycleIsFinished={currentCycleIsFinished}
            cyclePuzzles={cyclePuzzlesQuery.data ?? []}
            cycleStats={cycleStats}
            failedCyclePuzzleIris={failedCyclePuzzleIris}
            hasActiveCycle={Boolean(effectiveActiveCycleIri && effectiveActiveTrainingSessionIri)}
            mistakeLimit={effectiveMistakeLimit}
            mistakeLimitError={updateMistakeLimitMutation.error?.message}
            mistakeLimitIsError={updateMistakeLimitMutation.isError}
            mistakeLimitIsPending={updateMistakeLimitMutation.isPending}
            onBackToDetail={() => navigateToView('detail')}
            onMistakeLimitChange={(nextMistakeLimit) => updateMistakeLimitMutation.mutate(nextMistakeLimit)}
            onPuzzleCompleted={(result) => {
              if (!selectedCyclePuzzle || !effectiveActiveTrainingSessionIri || selectedCyclePuzzleIsSaved) {
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

function viewFromRoute(route: AppRoute): View {
  switch (route.name) {
    case 'dashboard':
      return 'dashboard';
    case 'create-training':
      return 'create';
    case 'training-import':
      return 'import';
    case 'training-solver':
      return 'solver';
    case 'training-detail':
      return 'detail';
    case 'auth':
      return 'dashboard';
  }
}

function buildRouteFromState(activeView: View, selectedTraining: Training | null): AppRoute {
  const trainingId = selectedTraining?.id;

  switch (activeView) {
    case 'dashboard':
      return { name: 'dashboard' };
    case 'create':
      return { name: 'create-training' };
    case 'import':
      return { name: 'training-import', trainingId };
    case 'solver':
      return { name: 'training-solver', trainingId };
    case 'detail':
      return { name: 'training-detail', trainingId };
  }
}

function getRouteTrainingId(route: AppRoute): number | undefined {
  if ('trainingId' in route) {
    return route.trainingId;
  }

  return undefined;
}



