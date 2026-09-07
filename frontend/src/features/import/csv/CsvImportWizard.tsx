import { LoadingButton } from '../../../shared/ui/LoadingButton';
import type { useImportViewState } from '../hooks/useImportViewState';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleX,
  Copy,
  Download,
  FileSpreadsheet,
  Info,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { CsvAnalysisReview, ImportStat } from './CsvAnalysisReview';
import { formatFileSize } from '../utils/importFormatting';

type Props = Pick<
  ReturnType<typeof useImportViewState>,
  | 'isImportingCsv'
  | 'onBackToTraining'
  | 'puzzleListIsLocked'
  | 'file'
  | 'analysis'
  | 'isAnalyzing'
  | 'csvStep'
  | 'setCsvStep'
  | 'csvImportResult'
  | 'skipDuplicates'
  | 'confirmedDuplicates'
  | 'setConfirmedDuplicates'
  | 'confirmedErrors'
  | 'setConfirmedErrors'
  | 'csvFilter'
  | 'setCsvFilter'
  | 'setErrorLinePendingDeletion'
  | 'fileInputRef'
  | 'canImportIntoTraining'
  | 'reviewAnalysis'
  | 'csvFilterCounts'
  | 'trainingDuplicateCount'
  | 'effectiveImportableCount'
  | 'requiresDuplicateConfirmation'
  | 'requiresErrorConfirmation'
  | 'confirmationsComplete'
  | 'filteredCsvRows'
  | 'analyze'
  | 'handleImport'
  | 'selectFile'
  | 'resetCsvFlow'
>;

export function CsvImportWizard({
  isImportingCsv,
  onBackToTraining,
  puzzleListIsLocked,
  file,
  analysis,
  isAnalyzing,
  csvStep,
  setCsvStep,
  csvImportResult,
  skipDuplicates,
  confirmedDuplicates,
  setConfirmedDuplicates,
  confirmedErrors,
  setConfirmedErrors,
  csvFilter,
  setCsvFilter,
  setErrorLinePendingDeletion,
  fileInputRef,
  canImportIntoTraining,
  reviewAnalysis,
  csvFilterCounts,
  trainingDuplicateCount,
  effectiveImportableCount,
  requiresDuplicateConfirmation,
  requiresErrorConfirmation,
  confirmationsComplete,
  filteredCsvRows,
  analyze,
  handleImport,
  selectFile,
  resetCsvFlow,
}: Props) {
  return (
    <section aria-label="Import CSV" className="wp-import-csv" role="tabpanel">
      <ol aria-label="Étapes de l’import CSV" className="wp-import-steps">
        {['Sélection', 'Validation', 'Importation'].map((label, index) => (
          <li
            className={csvStep === index + 1 ? 'is-current' : csvStep > index + 1 ? 'is-complete' : ''}
            key={label}
          >
            <span>{csvStep > index + 1 ? <CheckCircle2 aria-hidden="true" size={16} /> : index + 1}</span>
            {label}
          </li>
        ))}
      </ol>
      <div className="wp-panel wp-import-step">
        <div className="wp-import-section-heading">
          <div>
            <h3>
              {csvStep === 1
                ? '1. Sélection du fichier CSV'
                : csvStep === 2
                  ? '2. Validation des puzzles invalides'
                  : '3. Importation des puzzles'}
            </h3>
            <p>
              {csvStep === 1
                ? 'Sélectionnez le fichier CSV contenant vos puzzles à importer.'
                : csvStep === 2
                  ? 'Vérifiez les puzzles détectés et corrigez ou retirez les puzzles invalides avant l’import.'
                  : csvImportResult
                    ? 'L’import a été effectué à partir de l’analyse existante.'
                    : 'Vérifiez les informations ci-dessous avant d’importer vos puzzles.'}
            </p>
          </div>
          {file && csvStep !== 1 ? (
            <div className="wp-import-file">
              <FileSpreadsheet aria-hidden="true" size={18} />
              <span>{file.name}</span>
              <button
                className="wp-link-button wp-import-edit-button"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                Changer
              </button>
            </div>
          ) : null}
        </div>
        <input
          accept=".csv,text/csv"
          className="wp-import-file-input"
          onChange={(event) => {
            selectFile(event.target.files?.[0] ?? null);
            event.currentTarget.value = '';
          }}
          ref={fileInputRef}
          type="file"
        />
        {csvStep === 1 ? (
          <>
            <div
              className={file ? 'wp-import-dropzone has-file' : 'wp-import-dropzone'}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                selectFile(event.dataTransfer.files?.[0] ?? null);
              }}
            >
              {file ? (
                <>
                  <div className="wp-import-dropzone-surface">
                    <UploadCloud aria-hidden="true" size={42} />
                    <strong>Glissez-déposez votre fichier CSV ici</strong>
                    <span>ou</span>
                    <button
                      className="wp-secondary"
                      disabled={puzzleListIsLocked}
                      onClick={() => fileInputRef.current?.click()}
                      type="button"
                    >
                      Parcourir votre ordinateur
                    </button>
                  </div>
                  <div className="wp-import-selected-file">
                    <button
                      aria-label="Remplacer le fichier CSV"
                      className="wp-import-dropzone-trigger wp-import-dropzone-trigger--file"
                      disabled={puzzleListIsLocked}
                      onClick={() => fileInputRef.current?.click()}
                      type="button"
                    >
                      <span className="wp-import-selected-file__name" title={file.name}>
                        {file.name}
                      </span>
                      <span className="wp-import-selected-file__size">
                        &mdash; {formatFileSize(file.size)}
                      </span>
                    </button>
                    <button
                      aria-label="Supprimer le fichier"
                      className="wp-import-remove-file"
                      onClick={() => selectFile(null)}
                      type="button"
                    >
                      <Trash2 aria-hidden="true" size={17} />
                    </button>
                  </div>
                </>
              ) : (
                <button
                  className="wp-import-dropzone-trigger"
                  disabled={puzzleListIsLocked}
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                >
                  <UploadCloud aria-hidden="true" size={42} />
                  <strong>Glissez-déposez votre fichier CSV ici</strong>
                  <span>ou</span>
                  <small>Parcourir votre ordinateur</small>
                </button>
              )}
              {!file ? <em>Fichier accepté : .csv (max. 25 Mo)</em> : null}
            </div>
            <div className="wp-import-format">
              <Info aria-hidden="true" size={22} />
              <div>
                <strong>Votre fichier doit respecter le format CSV Woodpecker.</strong>
                <p>Téléchargez le modèle pour voir un exemple de fichier valide.</p>
              </div>
              <a className="wp-secondary wp-import-template-link" download href="/modele-import-puzzles.csv">
                <Download aria-hidden="true" size={17} />
                Télécharger le modèle CSV
              </a>
            </div>
            <div className="wp-import-actions">
              <button
                className="wp-secondary"
                disabled={isAnalyzing || isImportingCsv}
                onClick={onBackToTraining}
                type="button"
              >
                Annuler
              </button>
              <LoadingButton
                loadingLabel="Analyse en cours…"
                loading={isAnalyzing}
                className="wp-primary"
                disabled={!file || isAnalyzing || !canImportIntoTraining}
                onClick={analyze}
                type="button"
              >
                <span>{isAnalyzing ? 'Analyse en cours...' : 'Analyser le fichier'}</span>
                <ArrowRight aria-hidden="true" size={16} />
              </LoadingButton>
            </div>
          </>
        ) : null}
        {csvStep === 2 && analysis ? (
          <CsvAnalysisReview
            analysis={reviewAnalysis ?? analysis}
            csvFilter={csvFilter}
            csvFilterCounts={csvFilterCounts}
            filteredRows={filteredCsvRows}
            onCsvFilterChange={setCsvFilter}
            onRequestDeleteError={setErrorLinePendingDeletion}
          />
        ) : null}
        {csvStep === 2 && analysis ? (
          <div className="wp-import-actions wp-import-actions--between">
            <button
              className="wp-secondary"
              disabled={isImportingCsv}
              onClick={() => setCsvStep(1)}
              type="button"
            >
              <ArrowLeft aria-hidden="true" size={16} />
              Retour
            </button>
            <button
              className="wp-primary"
              disabled={isImportingCsv || !canImportIntoTraining}
              onClick={() => setCsvStep(3)}
              type="button"
            >
              Continuer vers l’importation <ArrowRight aria-hidden="true" size={16} />
            </button>
          </div>
        ) : null}
        {csvStep === 3 && analysis && !csvImportResult ? (
          <>
            <div className="wp-import-analysis-stats wp-import-analysis-stats--four">
              <ImportStat
                icon={<CheckCircle2 aria-hidden="true" size={18} />}
                label="Puzzles valides"
                tone="success"
                value={String(analysis.validCount)}
              />
              <ImportStat
                icon={<CircleX aria-hidden="true" size={18} />}
                label="Puzzles invalides"
                tone="danger"
                value={String(reviewAnalysis?.errorCount ?? 0)}
              />
              <ImportStat
                icon={<Copy aria-hidden="true" size={18} />}
                label="Doublons détectés"
                tone="warning"
                value={String(analysis.duplicateCount)}
              />
              <ImportStat
                icon={<FileSpreadsheet aria-hidden="true" size={18} />}
                label="Importables"
                value={String(effectiveImportableCount)}
              />
            </div>
            {requiresDuplicateConfirmation || requiresErrorConfirmation ? (
              <div className="wp-import-options">
                <h4>Confirmations</h4>
                {requiresDuplicateConfirmation ? (
                  <label className="wp-import-confirmation">
                    <input
                      checked={confirmedDuplicates}
                      onChange={(event) => setConfirmedDuplicates(event.target.checked)}
                      type="checkbox"
                    />
                    <span>
                      {analysis.duplicateCount} puzzle
                      {analysis.duplicateCount > 1
                        ? 's déjà présents ne seront pas ajoutés'
                        : ' déjà présent ne sera pas ajouté'}{' '}
                      (doublons).
                    </span>
                  </label>
                ) : null}
                {requiresErrorConfirmation ? (
                  <label className="wp-import-confirmation">
                    <input
                      checked={confirmedErrors}
                      onChange={(event) => setConfirmedErrors(event.target.checked)}
                      type="checkbox"
                    />
                    <span>
                      {reviewAnalysis?.errorCount ?? 0} puzzle
                      {(reviewAnalysis?.errorCount ?? 0) > 1
                        ? 's invalides ne seront pas ajoutés.'
                        : ' invalide ne sera pas ajouté.'}
                    </span>
                  </label>
                ) : null}
              </div>
            ) : null}
            <div className="wp-import-actions wp-import-actions--between">
              <button
                className="wp-secondary"
                disabled={isImportingCsv}
                onClick={() => setCsvStep(2)}
                type="button"
              >
                <ArrowLeft aria-hidden="true" size={16} />
                Retour
              </button>
              <LoadingButton
                loadingLabel="Import en cours…"
                loading={isImportingCsv}
                className="wp-primary"
                disabled={
                  isImportingCsv ||
                  !canImportIntoTraining ||
                  effectiveImportableCount < 1 ||
                  !confirmationsComplete
                }
                onClick={() => void handleImport()}
                type="button"
              >
                <UploadCloud aria-hidden="true" size={16} />
                {isImportingCsv
                  ? 'Import en cours...'
                  : `Importer ${effectiveImportableCount} puzzle${effectiveImportableCount > 1 ? 's' : ''}`}
              </LoadingButton>
            </div>
          </>
        ) : null}
        {csvStep === 3 && analysis && csvImportResult ? (
          <>
            <div className="wp-import-success">
              <CheckCircle2 aria-hidden="true" size={28} />
              <div>
                <strong>Import terminé</strong>
                <p>
                  {csvImportResult.importedCount} puzzle
                  {csvImportResult.importedCount > 1 ? 's ont été ajoutés' : ' a été ajouté'} à l’entraînement
                  à partir de l’analyse enregistrée.
                </p>
              </div>
            </div>
            <div className="wp-import-info-card">
              <strong>Résumé final</strong>
              <p>
                {csvImportResult.importedCount} puzzle
                {csvImportResult.importedCount > 1 ? 's ont été importés.' : ' a été importé.'}
              </p>
              <p>
                {analysis.errorCount + (skipDuplicates ? trainingDuplicateCount : 0)} ligne
                {analysis.errorCount + (skipDuplicates ? trainingDuplicateCount : 0) > 1
                  ? 's ont été ignorées'
                  : ' a été ignorée'}{' '}
                à cause des erreurs ou doublons exclus.
              </p>
            </div>
            <div className="wp-import-analysis-stats">
              <ImportStat
                icon={<CheckCircle2 aria-hidden="true" size={20} />}
                label="Importés"
                tone="success"
                value={String(csvImportResult.importedCount)}
              />
              <ImportStat
                icon={<FileSpreadsheet aria-hidden="true" size={20} />}
                label="Importables"
                value={String(effectiveImportableCount)}
              />
              <ImportStat
                icon={<CircleX aria-hidden="true" size={20} />}
                label="Puzzles invalides"
                tone="danger"
                value={String(reviewAnalysis?.errorCount ?? 0)}
              />
            </div>
            <div className="wp-import-actions">
              <button className="wp-secondary" onClick={resetCsvFlow} type="button">
                Importer un autre fichier
              </button>
              <button className="wp-primary" onClick={onBackToTraining} type="button">
                Revenir à l’entraînement
              </button>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
