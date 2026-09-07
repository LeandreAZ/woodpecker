import { LoadingButton } from '../../../../shared/ui/LoadingButton';
import { FileUp, Pencil, Play, Trash2 } from 'lucide-react';
import { TrainingLogoBadge } from '../identity/TrainingBranding';
import type { Training } from '../../types/training.types';

function buildDetailBranding(training: Training) {
  return {
    icon: training.icon,
    iconBackgroundColor: training.iconBackgroundColor,
    iconColor: training.iconColor,
    logo: null,
  };
}

export function DetailHeader({
  canOpenSolver,
  canShowStartCycle,
  deleteTrainingIsPending,
  hasCycleHistory,
  onDeleteTraining,
  onEditTraining,
  onImport,
  onOpenSolver,
  onStartCycle,
  selectedTraining,
  startCycleIsPending,
}: {
  canOpenSolver: boolean;
  canShowStartCycle: boolean;
  deleteTrainingIsPending: boolean;
  hasCycleHistory: boolean;
  onDeleteTraining: () => void;
  onEditTraining: () => void;
  onImport: () => void;
  onOpenSolver: () => void;
  onStartCycle: () => void;
  selectedTraining: Training;
  startCycleIsPending: boolean;
}) {
  const branding = buildDetailBranding(selectedTraining);

  return (
    <header className="wp-detail-header">
      <div className="wp-detail-header__identity">
        <div className="wp-detail-header__badge">
          <TrainingLogoBadge size="lg" training={branding} />
        </div>
        <div className="wp-detail-header__copy">
          <h1 title={selectedTraining.name}>{selectedTraining.name}</h1>
          {selectedTraining.description?.trim() ? <p title={selectedTraining.description}>{selectedTraining.description}</p> : null}
        </div>
      </div>

      <div className="wp-detail-header__actions">
        {canOpenSolver && !canShowStartCycle ? (
          <button className="wp-primary wp-detail-button" type="button" onClick={onOpenSolver}>
            <Play aria-hidden="true" size={16} strokeWidth={2} />
            <span>Ouvrir le solveur</span>
          </button>
        ) : null}

        {canShowStartCycle ? (
          <LoadingButton loading={startCycleIsPending} loadingLabel="Démarrage…" className="wp-primary wp-detail-button" disabled={startCycleIsPending} type="button" onClick={onStartCycle}>
            <Play aria-hidden="true" size={16} strokeWidth={2} />
            <span>{startCycleIsPending ? 'Démarrage...' : hasCycleHistory ? 'Lancer le cycle suivant' : 'Démarrer le cycle'}</span>
          </LoadingButton>
        ) : null}

        {!hasCycleHistory ? (
          <button className="wp-secondary wp-detail-button" type="button" onClick={onImport}>
            <FileUp aria-hidden="true" size={16} strokeWidth={2} />
            <span>Importer des puzzles</span>
          </button>
        ) : null}

        <div className="wp-detail-header__action-group" role="group" aria-label="Actions de l'entraînement">
          <button aria-label="Modifier l'entraînement" className="wp-secondary wp-detail-button" title="Modifier l'entraînement" type="button" onClick={onEditTraining}>
            <Pencil aria-hidden="true" size={16} strokeWidth={2} /><span>Modifier</span>
          </button>
          <button aria-label="Supprimer l'entraînement" className="wp-secondary wp-detail-button wp-detail-button--danger" disabled={deleteTrainingIsPending} title="Supprimer l'entraînement" type="button" onClick={onDeleteTraining}>
            <Trash2 aria-hidden="true" size={16} strokeWidth={2} /><span>Supprimer</span>
          </button>
        </div>
      </div>
    </header>
  );
}

