import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Circle,
  CircleX,
  Download,
  FileSpreadsheet,
  Pencil,
  Search,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import TrainingsHistoryView from './TrainingsHistoryViewV2';
import TrainingsSettingsView from './TrainingsSettingsViewV2';
import { PageHeader } from './TrainingsViewPrimitives';
import type {
  HistoryFilterPreset,
  HistoryOverview,
  Training,
  TrainingAttemptHistory,
  TrainingCycleHistory,
  UserSettingsOverview,
  View,
} from './trainingsTypes';

type CsvAnalysisPreview = { rating: number; themes: string[] };
type CsvAnalysisRow = { line: number; status: 'valid' | 'error' | 'duplicate'; duplicateReason?: 'file' | 'training'; message?: string; rating?: number; themes?: string[]; sourceId?: string };
type CsvAnalysis = {
  analysisId: string;
  totalRows: number;
  validCount: number;
  errorCount: number;
  duplicateCount: number;
  importableCount: number;
  errors: { line: number; message: string }[];
  preview?: CsvAnalysisPreview[];
  rows: CsvAnalysisRow[];
};
type LichessCriteria = {
  count: number;
  minRating: number;
  maxRating: number;
  themes: string[];
  distribution: 'random' | 'custom';
  themeDistribution?: Record<string, number>;
  minMoves?: number;
  maxMoves?: number;
};
type CsvStep = 1 | 2 | 3 | 4;
type CsvImportOptions = { analysisId: string; skipDuplicates: boolean; skipErroredPuzzles: boolean };

const QUICK_PUZZLE_COUNTS = [100, 300, 500, 1000] as const;

const LICHESS_THEME_OPTIONS = [
  { label: 'Pion avancé', value: 'advancedpawn' },
  { label: 'Avantage', value: 'advantage' },
  { label: 'Mat d’Anastasie', value: 'anastasiamate' },
  { label: 'Mat arabe', value: 'arabianmate' },
  { label: 'Attraction', value: 'attraction' },
  { label: 'Mat du couloir', value: 'backrankmate' },
  { label: 'Finale de fous', value: 'bishopendgame' },
  { label: 'Mat de Boden', value: 'bodenmate' },
  { label: 'Petit roque', value: 'castling' },
  { label: 'Déblayage', value: 'clearance' },
  { label: 'Coup défensif', value: 'defensivemove' },
  { label: 'Déviation', value: 'deflection' },
  { label: 'Attaque à la découverte', value: 'discoveredattack' },
  { label: 'Double attaque', value: 'doubleattack' },
  { label: 'Double échec', value: 'doublecheck' },
  { label: 'Mat aux deux fous', value: 'doublebishopmate' },
  { label: 'Mat aux deux tours', value: 'doublerookmate' },
  { label: 'Mat du couloir diagonal', value: 'dovetailmate' },
  { label: 'Égalité', value: 'equality' },
  { label: 'Roi exposé', value: 'exposedking' },
  { label: 'Fourchette', value: 'fork' },
  { label: 'Pièce en prise', value: 'hangingpiece' },
  { label: 'Mat du crochet', value: 'hookmate' },
  { label: 'Interférence', value: 'interference' },
  { label: 'Coup intermédiaire', value: 'intermezzo' },
  { label: 'Attaque à l’aile roi', value: 'kingsideattack' },
  { label: 'Finale de cavaliers', value: 'knightendgame' },
  { label: 'Fourchette de cavalier', value: 'knightfork' },
  { label: 'Maître', value: 'master' },
  { label: 'Mat', value: 'mate' },
  { label: 'Mat en 1', value: 'matein1' },
  { label: 'Mat en 2', value: 'matein2' },
  { label: 'Mat en 3', value: 'matein3' },
  { label: 'Mat en 4', value: 'matein4' },
  { label: 'Mat en 5', value: 'matein5' },
  { label: 'Milieu de jeu', value: 'middlegame' },
  { label: 'Un coup', value: 'onemove' },
  { label: 'Ouverture', value: 'opening' },
  { label: 'Finale de pions', value: 'pawnendgame' },
  { label: 'Clouage', value: 'pin' },
  { label: 'Attaque à l’aile dame', value: 'queensideattack' },
  { label: 'Finale de dames', value: 'queenendgame' },
  { label: 'Finale dame-tour', value: 'queenrookendgame' },
  { label: 'Finale de tours', value: 'rookendgame' },
  { label: 'Sacrifice', value: 'sacrifice' },
  { label: 'Court', value: 'short' },
  { label: 'Enfilade', value: 'skewer' },
  { label: 'Mat étouffé', value: 'smotheredmate' },
  { label: 'Technique', value: 'technical' },
  { label: 'Pièce piégée', value: 'trappedpiece' },
  { label: 'Sous-promotion', value: 'underpromotion' },
  { label: 'Très long', value: 'verylong' },
  { label: 'Attaque aux rayons X', value: 'xrayattack' },
  { label: 'Zugzwang', value: 'zugzwang' },
  { label: 'Finale', value: 'endgame' },
] as const;

export function ImportView({
  csvErrorMessage,
  isImportingCsv,
  isImportingLichess,
  lichessErrorMessage,
  onAnalyzeCsv,
  onBackToTraining,
  onEstimateLichessAvailability,
  onImportCsv,
  onImportLichess,
  onSelectCsvFile,
  puzzleListIsLocked,
  selectedTraining,
}: {
  csvErrorMessage?: string;
  isImportingCsv: boolean;
  isImportingLichess: boolean;
  lichessErrorMessage?: string;
  onAnalyzeCsv: (file: File) => Promise<CsvAnalysis>;
  onBackToTraining: () => void;
  onEstimateLichessAvailability?: (criteria: Pick<LichessCriteria, 'count' | 'maxRating' | 'minRating' | 'themes' | 'minMoves' | 'maxMoves'>) => Promise<number | null>;
  onImportCsv: (options: CsvImportOptions) => Promise<{ importedCount: number }>;
  onImportLichess: (criteria: LichessCriteria) => void;
  onSelectCsvFile: (file: File | null) => void;
  puzzleListIsLocked: boolean;
  selectedTraining: Training | null;
}) {
  const [tab, setTab] = useState<'csv' | 'lichess'>('lichess');
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<CsvAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [csvStep, setCsvStep] = useState<CsvStep>(1);
  const [csvImportResult, setCsvImportResult] = useState<{ importedCount: number } | null>(null);
  const [count, setCount] = useState(300);
  const [minRating, setMinRating] = useState(800);
  const [maxRating, setMaxRating] = useState(2400);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [themeQuery, setThemeQuery] = useState('');
  const [distribution, setDistribution] = useState<'random' | 'custom'>('random');
  const [minMoves, setMinMoves] = useState('');
  const [maxMoves, setMaxMoves] = useState('');
  const [themeDistribution, setThemeDistribution] = useState<Record<string, number>>({});
  const [availablePuzzleCount, setAvailablePuzzleCount] = useState<number | null>(null);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [skipErroredPuzzles, setSkipErroredPuzzles] = useState(true);
  const [csvFilter, setCsvFilter] = useState<'all' | 'valid' | 'error' | 'duplicate'>('all');
  const [csvQuery, setCsvQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const availabilityRequestRef = useRef(0);
  const availabilityEstimatorRef = useRef(onEstimateLichessAvailability);
  const filteredThemeOptions = useMemo(() => {
    const query = normalizeSearchText(themeQuery);

    if (!query) {
      return [];
    }

    return LICHESS_THEME_OPTIONS
      .filter((option) => !selectedThemes.includes(option.value)
        && (normalizeSearchText(option.label).includes(query) || option.value.includes(query)))
      .slice(0, 6);
  }, [themeQuery, selectedThemes]);
  const selectedThemeLabels = selectedThemes.map(
    (theme) => LICHESS_THEME_OPTIONS.find((option) => option.value === theme)?.label ?? theme,
  );
  const countIsValid = Number.isInteger(count) && count >= 1 && count <= 1000;
  const ratingsAreValid = Number.isInteger(minRating) && Number.isInteger(maxRating) && minRating >= 100 && maxRating <= 4000 && minRating <= maxRating;
  const canImportIntoTraining = Boolean(selectedTraining) && !puzzleListIsLocked;
  const currentErrorMessage = tab === 'csv' ? csvErrorMessage : lichessErrorMessage;
  const parsedMinMoves = minMoves === '' ? undefined : Number(minMoves);
  const parsedMaxMoves = maxMoves === '' ? undefined : Number(maxMoves);
  const moveRangeIsValid = (parsedMinMoves === undefined || (Number.isInteger(parsedMinMoves) && parsedMinMoves >= 1))
    && (parsedMaxMoves === undefined || (Number.isInteger(parsedMaxMoves) && parsedMaxMoves >= 1))
    && (parsedMinMoves === undefined || parsedMaxMoves === undefined || parsedMinMoves <= parsedMaxMoves);
  const themeDistributionTotal = selectedThemes.reduce((sum, theme) => sum + (themeDistribution[theme] ?? 0), 0);
  const customDistributionIsValid = distribution === 'random' || selectedThemes.length < 2 || themeDistributionTotal === 100;
  const csvFilterCounts = useMemo(() => {
    const rows = analysis?.rows ?? [];

    return {
      all: rows.length,
      valid: rows.filter((row) => row.status === 'valid').length,
      error: rows.filter((row) => row.status === 'error').length,
      duplicate: rows.filter((row) => row.status === 'duplicate').length,
    };
  }, [analysis]);
  const trainingDuplicateCount = useMemo(
    () => (analysis?.rows ?? []).filter((row) => row.status === 'duplicate' && row.duplicateReason === 'training').length,
    [analysis],
  );
  const effectiveImportableCount = analysis
    ? analysis.importableCount + (skipDuplicates ? 0 : trainingDuplicateCount)
    : 0;
  const filteredCsvRows = useMemo(() => {
    const query = normalizeSearchText(csvQuery);

    return (analysis?.rows ?? []).filter((row) => {
      if (csvFilter !== 'all' && row.status !== csvFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return normalizeSearchText([
        String(row.line),
        row.sourceId ?? '',
        row.message ?? '',
        String(row.rating ?? ''),
        row.duplicateReason === 'training' ? 'deja present entrainement' : '',
        ...(row.themes ?? []),
      ].join(' ')).includes(query);
    });
  }, [analysis, csvFilter, csvQuery]);

  useEffect(() => {
    if (selectedThemes.length < 2 && distribution === 'custom') {
      setDistribution('random');
    }
  }, [distribution, selectedThemes.length]);

  useEffect(() => {
    if (!selectedThemes.length) {
      setThemeDistribution({});
      return;
    }

    setThemeDistribution((current) => normalizeThemeDistribution(current, selectedThemes));
  }, [selectedThemes]);

  useEffect(() => {
    availabilityEstimatorRef.current = onEstimateLichessAvailability;
  }, [onEstimateLichessAvailability]);

  useEffect(() => {
    const estimateAvailability = availabilityEstimatorRef.current;
    if (!estimateAvailability) {
      return;
    }

    const requestId = ++availabilityRequestRef.current;
    const timeout = window.setTimeout(() => {
      setIsLoadingAvailability(true);
      void estimateAvailability({
        count,
        minRating,
        maxRating,
        themes: selectedThemes,
        minMoves: parsedMinMoves,
        maxMoves: parsedMaxMoves,
      })
        .then((nextCount) => { if (availabilityRequestRef.current === requestId) setAvailablePuzzleCount(nextCount); })
        .catch(() => { if (availabilityRequestRef.current === requestId) setAvailablePuzzleCount(null); })
        .finally(() => { if (availabilityRequestRef.current === requestId) setIsLoadingAvailability(false); });
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [count, maxRating, minRating, parsedMaxMoves, parsedMinMoves, selectedThemes]);

  async function analyze() {
    if (!file) {
      return;
    }

    setIsAnalyzing(true);
    setCsvImportResult(null);

    try {
      const nextAnalysis = await onAnalyzeCsv(file);
      setAnalysis(nextAnalysis);
      setCsvStep(2);
    } catch {
      setCsvStep(1);
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleImport() {
    if (!analysis) {
      return;
    }

    const result = await onImportCsv({
      analysisId: analysis.analysisId,
      skipDuplicates,
      skipErroredPuzzles,
    });

    setCsvImportResult({ importedCount: result.importedCount });
    setCsvStep(4);
  }

  function selectFile(nextFile: File | null) {
    setFile(nextFile);
    setAnalysis(null);
    setCsvImportResult(null);
    setCsvStep(1);
    setCsvFilter('all');
    setCsvQuery('');
    onSelectCsvFile(nextFile);
  }

  function resetCsvFlow() {
    selectFile(null);
  }

  function addTheme(theme: string) {
    setSelectedThemes((current) => current.includes(theme) ? current : [...current, theme]);
    setThemeQuery('');
  }

  function removeTheme(theme: string) {
    setSelectedThemes((current) => current.filter((value) => value !== theme));
  }

  return (
    <div className="wp-page wp-import-wizard">
      <PageHeader title="Importer des puzzles" description="Ajoutez des puzzles à votre entraînement en les générant depuis Lichess ou en important un fichier CSV." />
      {puzzleListIsLocked ? <p className="alert error-alert">La collection est verrouillée dès qu’un cycle existe.</p> : null}
      <div className="wp-import-tabs" role="tablist">
        <button aria-selected={tab === 'lichess'} className={tab === 'lichess' ? 'is-active' : ''} onClick={() => setTab('lichess')} role="tab" type="button">Générer avec Lichess</button>
        <button aria-selected={tab === 'csv'} className={tab === 'csv' ? 'is-active' : ''} onClick={() => setTab('csv')} role="tab" type="button">Importer un fichier CSV</button>
      </div>
      {currentErrorMessage ? <p className="alert error-alert">{currentErrorMessage}</p> : null}
      {tab === 'csv' ? (
        <section aria-label="Import CSV" className="wp-import-csv" role="tabpanel">
          <ol aria-label="Étapes de l’import CSV" className="wp-import-steps">
            {['Sélection', 'Validation', 'Importation', 'Succès'].map((label, index) => (
              <li className={csvStep === index + 1 ? 'is-current' : csvStep > index + 1 ? 'is-complete' : ''} key={label}>
                <span>{csvStep > index + 1 ? <CheckCircle2 aria-hidden="true" size={16} /> : index + 1}</span>
                {label}
              </li>
            ))}
          </ol>
          <div className="wp-panel wp-import-step">
            <div className="wp-import-section-heading">
              <div>
                <h3>{csvStep === 1 ? '1. Sélection du fichier CSV' : csvStep === 2 ? '2. Validation et erreurs' : csvStep === 3 ? '3. Importation des puzzles' : '4. Import terminé'}</h3>
                <p>{csvStep === 1 ? 'Sélectionnez le fichier CSV contenant vos puzzles à importer.' : csvStep === 2 ? 'Vérifiez les lignes détectées, les erreurs et les doublons avant de lancer l’import.' : csvStep === 3 ? 'Confirmez les options d’import à partir de cette analyse existante.' : 'Votre analyse a bien été utilisée pour importer les puzzles.'}</p>
              </div>
              {csvStep === 1 ? <a aria-label="Télécharger le modèle CSV" className="wp-import-icon-button" download href="/modele-import-puzzles.csv"><Download aria-hidden="true" size={18} /></a> : null}
              {file && csvStep !== 1 ? <div className="wp-import-file"><FileSpreadsheet aria-hidden="true" size={18} /><span>{file.name}</span><button className="wp-link-button wp-import-edit-button" onClick={() => fileInputRef.current?.click()} type="button"><Pencil aria-hidden="true" size={14} />Modifier</button></div> : null}
            </div>
            <input accept=".csv,text/csv" className="wp-import-file-input" onChange={(event) => selectFile(event.target.files?.[0] ?? null)} ref={fileInputRef} type="file" />
            {csvStep === 1 ? (
              <>
                <button className="wp-import-dropzone" disabled={puzzleListIsLocked} onClick={() => fileInputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); selectFile(event.dataTransfer.files?.[0] ?? null); }} type="button">{file ? <><FileSpreadsheet aria-hidden="true" size={42} /><strong>{file.name}</strong><span>{formatFileSize(file.size)} · Fichier prêt</span><em>Cliquer pour remplacer le fichier</em></> : <><UploadCloud aria-hidden="true" size={42} /><strong>Glissez-déposez votre fichier CSV ici</strong><span>ou</span><small>Parcourir votre ordinateur</small><em>Fichier accepté : .csv (max. 25 Mo)</em></>}</button>
                {file ? <button aria-label="Supprimer le fichier" className="wp-link-button wp-import-edit-button" onClick={() => selectFile(null)} type="button">Supprimer</button> : null}
                <div className="wp-import-actions"><button className="wp-secondary" disabled={isAnalyzing || isImportingCsv} onClick={() => selectFile(null)} type="button">Annuler</button><button className="wp-primary" disabled={!file || isAnalyzing || !canImportIntoTraining} onClick={analyze} type="button"><span>{isAnalyzing ? 'Analyse en cours...' : 'Analyser le fichier'}</span><ArrowRight aria-hidden="true" size={16} /></button></div>
              </>
            ) : null}
            {(csvStep === 2 || csvStep === 3) && analysis ? (
              <CsvAnalysisReview
                analysis={analysis}
                csvFilter={csvFilter}
                csvFilterCounts={csvFilterCounts}
                csvQuery={csvQuery}
                effectiveImportableCount={effectiveImportableCount}
                filteredRows={filteredCsvRows}
                onCsvFilterChange={setCsvFilter}
                onCsvQueryChange={setCsvQuery}
              />
            ) : null}
            {csvStep === 2 && analysis ? (
              <div className="wp-import-actions"><button className="wp-secondary" disabled={isImportingCsv} onClick={() => setCsvStep(1)} type="button">Retour</button><button className="wp-primary" disabled={isImportingCsv || !canImportIntoTraining} onClick={() => setCsvStep(3)} type="button">Continuer vers l’importation <ArrowRight aria-hidden="true" size={16} /></button></div>
            ) : null}
            {csvStep === 3 && analysis ? (
              <>
                <div className="wp-import-options"><h4>Options d’import</h4><label className="wp-import-check"><input checked={skipDuplicates} onChange={(event) => setSkipDuplicates(event.target.checked)} type="checkbox" /><span>Éviter les doublons déjà présents dans l’entraînement</span></label><label className="wp-import-check"><input checked={skipErroredPuzzles} onChange={(event) => setSkipErroredPuzzles(event.target.checked)} type="checkbox" /><span>Ignorer les puzzles en erreur</span></label></div>
                <div className="wp-import-actions"><button className="wp-secondary wp-import-edit-button" disabled={isImportingCsv} onClick={() => setCsvStep(2)} type="button"><Pencil aria-hidden="true" size={14} />Revoir l’analyse</button><button className="wp-primary" disabled={isImportingCsv || !canImportIntoTraining || effectiveImportableCount < 1} onClick={() => void handleImport()} type="button"><UploadCloud aria-hidden="true" size={16} />{isImportingCsv ? 'Import en cours...' : `Importer ${effectiveImportableCount} puzzle${effectiveImportableCount > 1 ? 's' : ''}`}</button></div>
              </>
            ) : null}
            {csvStep === 4 && analysis && csvImportResult ? (
              <>
                <div className="wp-import-success"><CheckCircle2 aria-hidden="true" size={28} /><div><strong>Import terminé</strong><p>{csvImportResult.importedCount} puzzle{csvImportResult.importedCount > 1 ? 's ont été ajoutés' : ' a été ajouté'} à l’entraînement à partir de l’analyse enregistrée.</p></div></div>
                <div className="wp-import-analysis-stats"><ImportStat icon={<CheckCircle2 aria-hidden="true" size={20} />} label="Importés" tone="success" value={String(csvImportResult.importedCount)} /><ImportStat icon={<FileSpreadsheet aria-hidden="true" size={20} />} label="Importables" value={String(analysis.importableCount)} /><ImportStat icon={<CircleX aria-hidden="true" size={20} />} label="Erreurs" tone="danger" value={String(analysis.errorCount)} /></div>
                <div className="wp-import-actions"><button className="wp-secondary" onClick={resetCsvFlow} type="button">Importer un autre fichier</button><button className="wp-primary" onClick={onBackToTraining} type="button">Revenir à l’entraînement</button></div>
              </>
            ) : null}
          </div>
        </section>
      ) : (
        <section aria-label="Génération Lichess" className="wp-import-grid" role="tabpanel">
          <div className="wp-import-configuration">
            <details className="wp-panel wp-import-step wp-import-step-card" open>
              <summary><span><h3>1. Nombre de puzzles</h3><p>Définissez le nombre de puzzles à générer.</p></span><ChevronDown aria-hidden="true" size={18} /></summary>
              <div className="wp-import-count-row">
                <div className="wp-import-count-control"><label>Nombre de puzzles<input max="1000" min="1" onChange={(event) => setCount(Number(event.target.value))} type="number" value={count} /></label><div className="wp-import-quick-counts">{QUICK_PUZZLE_COUNTS.map((preset) => <button aria-pressed={count === preset} className={count === preset ? 'is-active' : ''} key={preset} onClick={() => setCount(preset)} type="button">{preset}</button>)}</div></div>
                <p className="wp-import-availability"><strong>{availablePuzzleCount === null ? '—' : formatInteger(availablePuzzleCount)}</strong><span>{isLoadingAvailability ? 'Mise à jour...' : 'puzzles disponibles'}</span></p>
              </div>
              {!countIsValid ? <p className="alert error-alert">Choisissez un nombre entier entre 1 et 1 000.</p> : null}
            </details>
            <details className="wp-panel wp-import-step wp-import-step-card" open>
              <summary><span><h3>2. Difficulté (rating Lichess)</h3><p>Sélectionnez l’intervalle de difficulté.</p></span><ChevronDown aria-hidden="true" size={18} /></summary>
              <div className="wp-import-rating-fields">
                <label>Min<input max={maxRating} min="100" onChange={(event) => setMinRating(Math.min(Number(event.target.value), maxRating))} type="number" value={minRating} /></label>
                <label>Max<input max="4000" min={minRating} onChange={(event) => setMaxRating(Math.max(Number(event.target.value), minRating))} type="number" value={maxRating} /></label>
              </div>
              <div className="wp-import-dual-range">
                <div aria-hidden="true" className="wp-import-dual-range__track"><span style={{ left: `${((minRating - 100) / 3900) * 100}%`, right: `${100 - ((maxRating - 100) / 3900) * 100}%` }} /></div>
                <input aria-label="Difficulté minimale" max="4000" min="100" onChange={(event) => setMinRating(Math.min(Number(event.target.value), maxRating))} type="range" value={minRating} />
                <input aria-label="Difficulté maximale" max="4000" min="100" onChange={(event) => setMaxRating(Math.max(Number(event.target.value), minRating))} type="range" value={maxRating} />
              </div>
              {!ratingsAreValid ? <p className="alert error-alert">La plage doit contenir des ratings entiers entre 100 et 4 000.</p> : null}
            </details>
            <details className="wp-panel wp-import-step wp-import-step-card" open>
              <summary><span><h3>3. Thèmes (optionnel)</h3><p>Sélectionnez un ou plusieurs thèmes. Laissez vide pour tous les thèmes.</p></span><ChevronDown aria-hidden="true" size={18} /></summary>
              <label className="wp-import-search-field"><Search aria-hidden="true" size={16} /><input onChange={(event) => setThemeQuery(event.target.value)} placeholder="Rechercher un thème..." value={themeQuery} /></label>
              {selectedThemes.length ? <div className="wp-import-theme-list">{selectedThemes.map((theme) => <button aria-label={`Retirer ${LICHESS_THEME_OPTIONS.find((option) => option.value === theme)?.label ?? theme}`} className="wp-import-theme-chip is-selected" key={theme} onClick={() => removeTheme(theme)} type="button">{LICHESS_THEME_OPTIONS.find((option) => option.value === theme)?.label ?? theme}<span aria-hidden="true">×</span></button>)}</div> : null}
              {themeQuery.trim() ? <div className="wp-import-theme-options">{filteredThemeOptions.length ? filteredThemeOptions.map((option) => <button className="wp-import-theme-chip" key={option.value} onClick={() => addTheme(option.value)} type="button">{option.label}</button>) : <p className="wp-import-theme-empty">Aucun thème correspondant.</p>}</div> : null}
            </details>
            {selectedThemes.length >= 2 ? (
            <details className="wp-panel wp-import-step wp-import-step-card" open>
              <summary><span><h3>4. Répartition (optionnel)</h3><p>Choisissez comment répartir les puzzles.</p></span><ChevronDown aria-hidden="true" size={18} /></summary>
              <div className="wp-import-distribution-options">
                <button aria-pressed={distribution === 'random'} className={distribution === 'random' ? 'is-selected' : ''} onClick={() => setDistribution('random')} type="button"><span className="wp-import-radio" /> <strong>Répartition aléatoire</strong><small>Lichess répartit automatiquement les puzzles.</small></button>
                <button aria-pressed={distribution === 'custom'} className={distribution === 'custom' ? 'is-selected' : ''} onClick={() => setDistribution('custom')} type="button"><span className="wp-import-radio" /> <strong>Répartition personnalisée</strong><small>Définissez un pourcentage pour chaque thème choisi.</small></button>
              </div>
              {distribution === 'custom' && selectedThemes.length ? <div className="wp-import-theme-distribution">{selectedThemes.map((theme) => <label key={theme}><span>{LICHESS_THEME_OPTIONS.find((option) => option.value === theme)?.label ?? theme}</span><div><input max="100" min="0" onChange={(event) => setThemeDistribution((current) => ({ ...current, [theme]: Number(event.target.value) }))} type="number" value={themeDistribution[theme] ?? 0} /><small>%</small></div></label>)}</div> : null}
              {!customDistributionIsValid ? <p className="alert error-alert">La répartition personnalisée doit totaliser 100 %.</p> : null}
            </details>
            ) : null}
            <details className="wp-panel wp-import-advanced">
              <summary><span>5. Options avancées</span><ChevronDown aria-hidden="true" size={18} /></summary>
              <div className="wp-import-advanced-grid">
                <label>Nombre min de coups<input min="1" onChange={(event) => setMinMoves(event.target.value)} placeholder="Ex : 1" type="number" value={minMoves} /></label>
                <label>Nombre max de coups<input min="1" onChange={(event) => setMaxMoves(event.target.value)} placeholder="Ex : 10" type="number" value={maxMoves} /></label>
              </div>
              {!moveRangeIsValid ? <p className="alert error-alert">La longueur doit être un nombre positif et le minimum ne peut pas dépasser le maximum.</p> : null}
            </details>
          </div>
          <aside className="wp-panel wp-import-summary">
            <div><Sparkles aria-hidden="true" size={22} /><h3>Résumé de votre set</h3></div>
            <dl>
              <div><dt>Puzzles</dt><dd>{countIsValid ? count : '—'}</dd></div>
              <div><dt>Difficulté</dt><dd>{ratingsAreValid ? `${minRating} – ${maxRating}` : 'À corriger'}</dd></div>
              <div><dt>Thèmes</dt><dd>{selectedThemeLabels.length ? `${selectedThemeLabels.length} sélectionnés` : 'Tous les thèmes'}</dd></div>
              <div><dt>Répartition</dt><dd>{distribution === 'custom' ? 'Personnalisée' : 'Aléatoire'}</dd></div>
              <div><dt>Nombre min de coups</dt><dd>{parsedMinMoves ?? 'Aucun'}</dd></div>
              <div><dt>Nombre max de coups</dt><dd>{parsedMaxMoves ?? 'Aucun'}</dd></div>
            </dl>
            <p className="wp-import-summary-note"><strong>Disponibilité actuelle</strong><br />{availablePuzzleCount === null ? 'Indisponible pour le moment.' : `${formatInteger(availablePuzzleCount)} puzzles disponibles avec ces filtres.`}</p>
            <button className="wp-primary full" disabled={!countIsValid || !ratingsAreValid || !moveRangeIsValid || !customDistributionIsValid || isImportingLichess || !canImportIntoTraining} onClick={() => onImportLichess({ count, minRating, maxRating, themes: selectedThemes, distribution, themeDistribution: distribution === 'custom' ? themeDistribution : undefined, minMoves: parsedMinMoves, maxMoves: parsedMaxMoves })} type="button">{isImportingLichess ? 'Génération en cours...' : `Générer les ${count} puzzles`}</button>
            <small className="wp-import-summary-footnote">Un set sera créé et ajouté à votre entraînement.</small>
          </aside>
        </section>
      )}
    </div>
  );
}

function normalizeSearchText(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function normalizeThemeDistribution(current: Record<string, number>, themes: string[]) {
  if (!themes.length) {
    return {};
  }

  const baseValue = Math.floor(100 / themes.length);
  let remaining = 100;
  const next: Record<string, number> = {};

  themes.forEach((theme, index) => {
    const fallback = index === themes.length - 1 ? remaining : baseValue;
    const value = current[theme] ?? fallback;
    next[theme] = value;
    remaining -= value;
  });

  if (remaining !== 0) {
    const lastTheme = themes[themes.length - 1];
    next[lastTheme] = Math.max(0, (next[lastTheme] ?? 0) + remaining);
  }

  return next;
}

function formatFileSize(value: number) {
  return value < 1024 * 1024 ? Math.ceil(value / 1024) + ' Ko' : (value / (1024 * 1024)).toFixed(1) + ' Mo';
}

function CsvAnalysisReview({
  analysis,
  csvFilter,
  csvFilterCounts,
  csvQuery,
  effectiveImportableCount,
  filteredRows,
  onCsvFilterChange,
  onCsvQueryChange,
}: {
  analysis: CsvAnalysis;
  csvFilter: 'all' | 'valid' | 'error' | 'duplicate';
  csvFilterCounts: Record<'all' | 'valid' | 'error' | 'duplicate', number>;
  csvQuery: string;
  effectiveImportableCount: number;
  filteredRows: CsvAnalysisRow[];
  onCsvFilterChange: (value: 'all' | 'valid' | 'error' | 'duplicate') => void;
  onCsvQueryChange: (value: string) => void;
}) {
  return (
    <div className="wp-import-review">
      <div className="wp-import-analysis-stats wp-import-analysis-stats--four">
        <ImportStat icon={<CheckCircle2 aria-hidden="true" size={20} />} label="Valides" tone="success" value={String(analysis.validCount)} />
        <ImportStat icon={<CircleX aria-hidden="true" size={20} />} label="Erreurs" tone="danger" value={String(analysis.errorCount)} />
        <ImportStat icon={<Circle aria-hidden="true" size={20} />} label="Doublons" value={String(analysis.duplicateCount)} />
        <ImportStat icon={<FileSpreadsheet aria-hidden="true" size={20} />} label="Importables" value={String(effectiveImportableCount)} />
      </div>
      <div className="wp-import-review-toolbar">
        <div className="wp-import-filter-pills" role="tablist" aria-label="Filtres CSV">
          {[
            ['all', 'Tous', csvFilterCounts.all],
            ['valid', 'Valides', csvFilterCounts.valid],
            ['error', 'Erreurs', csvFilterCounts.error],
            ['duplicate', 'Doublons', csvFilterCounts.duplicate],
          ].map(([value, label, count]) => (
            <button
              aria-pressed={csvFilter === value}
              className={csvFilter === value ? 'is-active' : ''}
              key={value}
              onClick={() => onCsvFilterChange(value as 'all' | 'valid' | 'error' | 'duplicate')}
              type="button"
            >
              <span>{label}</span>
              <strong>{count}</strong>
            </button>
          ))}
        </div>
        <label className="wp-import-search-field wp-import-search-field--compact">
          <Search aria-hidden="true" size={16} />
          <input onChange={(event) => onCsvQueryChange(event.target.value)} placeholder="Rechercher une ligne, un thème ou un message..." value={csvQuery} />
        </label>
      </div>
      <p className="wp-import-results-count">{filteredRows.length} ligne{filteredRows.length > 1 ? 's' : ''} affichée{filteredRows.length > 1 ? 's' : ''} sur {analysis.rows.length}.</p>
      {filteredRows.length ? (
        <div className="wp-import-rows-table" role="region" aria-label="Résultats CSV">
          <div className="wp-import-rows-table__head">
            <span>Ligne</span>
            <span>Statut</span>
            <span>Puzzle ID</span>
            <span>Rating</span>
            <span>Thèmes</span>
            <span>Détail</span>
          </div>
          {filteredRows.map((row) => (
            <div className="wp-import-rows-table__row" key={`${row.line}-${row.status}-${row.sourceId ?? 'none'}`}>
              <span>#{row.line}</span>
              <span><span className={`wp-status-pill ${row.status === 'valid' ? 'success' : row.status === 'error' ? 'danger' : 'warning'}`}>{formatCsvRowStatus(row)}</span></span>
              <span>{row.sourceId ?? '—'}</span>
              <span>{row.rating ?? '—'}</span>
              <span>{row.themes?.length ? row.themes.join(', ') : 'Sans thème'}</span>
              <span>{row.message ?? '—'}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="wp-empty">Aucune ligne ne correspond à ce filtre.</p>
      )}
    </div>
  );
}

function formatCsvRowStatus(row: CsvAnalysisRow) {
  if (row.status === 'valid') {
    return 'Valide';
  }

  if (row.status === 'error') {
    return 'Erreur';
  }

  return row.duplicateReason === 'training' ? 'Doublon entraînement' : 'Doublon fichier';
}

function formatInteger(value: number) {
  return new Intl.NumberFormat('fr-FR').format(value);
}

function ImportStat({ icon, label, tone, value }: { icon: ReactNode; label: string; tone?: 'danger' | 'success'; value: string }) {
  return <div className={`wp-import-stat${tone ? ` is-${tone}` : ''}`}>{icon}<span>{label}</span><strong>{value}</strong></div>;
}

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
