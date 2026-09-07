import TrainingsHistoryView from '../../../history/pages/HistoryView';
import TrainingsSettingsView from '../../../settings/pages/SettingsView';
import { PageHeader } from '../../components/primitives/TrainingsViewPrimitives';
import type { Training, View } from '../../types/training.types';
import type { HistoryFilterPreset, HistoryOverview, TrainingAttemptHistory, TrainingCycleHistory } from '../../../history/types/history.types';
import type { UserSettingsOverview } from '../../../settings/types/settings.types';
export { ImportView } from '../../../import/pages/ImportView';

export function HistoryOverviewView({
  errorMessage,
  historyOverview,
  initialFilterPreset,
  isError,
  isLoading,
  onInitialFilterPresetApplied,
}: {
  attemptHistory: TrainingAttemptHistory | null;
  cycleHistory: TrainingCycleHistory | null;
  detailedErrorMessage?: string;
  errorMessage?: string;
  historyOverview: HistoryOverview | null;
  initialFilterPreset?: HistoryFilterPreset | null;
  isDetailedError: boolean;
  isDetailedLoading: boolean;
  isError: boolean;
  isLoading: boolean;
  onInitialFilterPresetApplied?: () => void;
  onBackToDashboard: () => void;
  onOpenTraining: (trainingIri: string, view?: View) => void;
  selectedTraining: Training | null;
}) {
  return (
    <TrainingsHistoryView
      errorMessage={errorMessage}
      historyOverview={historyOverview}
      initialFilterPreset={initialFilterPreset}
      isError={isError}
      isLoading={isLoading}
      onInitialFilterPresetApplied={onInitialFilterPresetApplied}
    />
  );
}

export function SettingsOverviewView({
  errorMessage,
  isError,
  isLoading,
  isSaving,
  onSave,
  saveErrorMessage,
  settingsOverview,
}: {
  errorMessage?: string;
  isError: boolean;
  isLoading: boolean;
  isSaving: boolean;
  onBackToDashboard: () => void;
  onSave: (value: {
    appearance: UserSettingsOverview['appearance'];
    board: Pick<UserSettingsOverview['board'], 'darkSquareColor' | 'lightSquareColor'>;
    profile: { pseudonym: string };
    solverPreferences: UserSettingsOverview['solverPreferences'];
  }) => Promise<UserSettingsOverview>;
  saveErrorMessage?: string;
  settingsOverview: UserSettingsOverview | null;
}) {
  if (!settingsOverview && !isLoading && !isError) {
    return (
      <div className="wp-page narrow">
        <PageHeader eyebrow="Paramètres" title="Paramètres" description="Gérez votre profil et personnalisez votre expérience Woodpecker." />
        <p className="wp-empty">Aucun paramètre disponible pour le moment.</p>
      </div>
    );
  }

  return (
    <TrainingsSettingsView
      errorMessage={errorMessage}
      isError={isError}
      isLoading={isLoading}
      isSaving={isSaving}
      onSave={onSave}
      saveErrorMessage={saveErrorMessage}
      settingsOverview={settingsOverview}
    />
  );
}
