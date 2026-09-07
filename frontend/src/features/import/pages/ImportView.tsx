import { ConfirmationModal } from '../../../shared/ui/ConfirmationModal';
import { PageHeader } from '../../trainings/components/primitives/TrainingsViewPrimitives';
import { CsvImportWizard } from '../csv/CsvImportWizard';
import { LichessImportForm } from '../lichess/LichessImportForm';
import { useImportViewState, type ImportViewProps } from '../hooks/useImportViewState';

export function ImportView(props: ImportViewProps) {
  const state = useImportViewState(props);
  const {
    puzzleListIsLocked,
    tab,
    setTab,
    setConfirmedErrors,
    setDismissedErrorLines,
    errorLinePendingDeletion,
    setErrorLinePendingDeletion,
    currentErrorMessage,
  } = state;
  return (
    <div className="wp-page wp-import-wizard">
      <PageHeader
        title="Importer des puzzles"
        description="Ajoutez des puzzles à votre entraînement en les générant depuis Lichess ou en important un fichier CSV."
      />
      {puzzleListIsLocked ? (
        <p className="alert error-alert">La collection est verrouillée dès qu’un cycle existe.</p>
      ) : null}
      <div className="wp-import-tabs" role="tablist">
        <button
          aria-selected={tab === 'lichess'}
          className={tab === 'lichess' ? 'is-active' : ''}
          onClick={() => setTab('lichess')}
          role="tab"
          type="button"
        >
          Générer avec Lichess
        </button>
        <button
          aria-selected={tab === 'csv'}
          className={tab === 'csv' ? 'is-active' : ''}
          onClick={() => setTab('csv')}
          role="tab"
          type="button"
        >
          Importer un fichier CSV
        </button>
      </div>
      {currentErrorMessage ? <p className="alert error-alert">{currentErrorMessage}</p> : null}
      {tab === 'csv' ? <CsvImportWizard {...state} /> : <LichessImportForm {...state} />}
      <ConfirmationModal
        confirmLabel="Retirer le puzzle invalide"
        description="Cette ligne sera retirée de la revue avant l’import."
        isDanger
        onClose={() => setErrorLinePendingDeletion(null)}
        onConfirm={() => {
          if (errorLinePendingDeletion !== null) {
            setDismissedErrorLines((current) =>
              current.includes(errorLinePendingDeletion) ? current : [...current, errorLinePendingDeletion],
            );
            setConfirmedErrors(false);
          }
          setErrorLinePendingDeletion(null);
        }}
        open={errorLinePendingDeletion !== null}
        title="Retirer ce puzzle invalide ?"
      />
    </div>
  );
}
