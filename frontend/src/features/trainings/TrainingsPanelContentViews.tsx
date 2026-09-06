import { LoadingButton } from '../../components/ui/LoadingButton';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  CircleX,
  Copy,
  Download,
  FileSpreadsheet,
  Info,
  Search,
  Sparkles,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { apiRequest } from '../../shared/api/client';
import { loadStoredSession } from '../auth/authStorage';
import TrainingsHistoryView from './TrainingsHistoryViewV2';
import TrainingsSettingsView from './TrainingsSettingsViewV2';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
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
type CsvAnalysisRow = { line: number; status: 'valid' | 'error' | 'duplicate'; duplicateReason?: 'file' | 'training'; fen?: string | null; message?: string; rating?: number | string | null; themes?: string[]; sourceId?: string | null };
type CsvAnalysis = {
  analysisId: string;
  totalRows: number;
  usefulRowCount?: number;
  detectedHeaderCount?: number;
  expectedHeaderCount?: number;
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
type CsvStep = 1 | 2 | 3;
type CsvImportOptions = { analysisId: string; skipDuplicates: boolean; skipErroredPuzzles: boolean };

const QUICK_PUZZLE_COUNTS = [100, 300, 500, 1000] as const;
const PIECE_SYMBOLS: Record<string, string> = {
  K: '♔',
  Q: '♕',
  R: '♖',
  B: '♗',
  N: '♘',
  P: '♙',
  k: '♚',
  q: '♛',
  r: '♜',
  b: '♝',
  n: '♞',
  p: '♟',
};

const LICHESS_THEME_OPTIONS = [
  { label: 'Attaque sur f2 ou f7', value: 'attackingf2f7' },
  { label: 'Mat de Balestra', value: 'balestramate' },
  { label: 'Mat des deux cochons', value: 'blindswinemate' },
  { label: 'Capture du défenseur', value: 'capturingdefender' },
  { label: 'Coup colinéaire', value: 'collinearmove' },
  { label: 'Mat du coin', value: 'cornermate' },
  { label: 'Avantage décisif', value: 'crushing' },
  { label: 'Échec à la découverte', value: 'discoveredcheck' },
  { label: 'Prise en passant', value: 'enpassant' },
  { label: 'Mat des épaulettes', value: 'epaulettemate' },
  { label: 'Mat de la boîte', value: 'killboxmate' },
  { label: 'Long', value: 'long' },
  { label: 'Maître contre maître', value: 'mastervsmaster' },
  { label: 'Mat de Morphy', value: 'morphysmate' },
  { label: 'Mat de l’opéra', value: 'operamate' },
  { label: 'Mat de Pillsbury', value: 'pillsburysmate' },
  { label: 'Promotion', value: 'promotion' },
  { label: 'Coup calme', value: 'quietmove' },
  { label: 'Super grand maître', value: 'supergm' },
  { label: 'Mat de la queue d’hirondelle', value: 'swallowstailmate' },
  { label: 'Mat du triangle', value: 'trianglemate' },
  { label: 'Mat de Vuković', value: 'vukovicmate' },

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
  const [catalogOptions, setCatalogOptions] = useState<{ themes: string[]; openings: string[] }>({ themes: [], openings: [] });
  const [optionsError, setOptionsError] = useState('');
  const trainingIri = selectedTraining?.['@id'];
  useEffect(() => {
    const session = loadStoredSession();
    if (!session || !trainingIri) return;
    let cancelled = false;
    setOptionsError('');
    void apiRequest<{ themes: string[]; openings: string[] }>(`${trainingIri.replace(/^\/api/, '')}/imports/lichess/options`, { token: session.token })
      .then((options) => { if (!cancelled) setCatalogOptions(options); })
      .catch(() => { if (!cancelled) setOptionsError('Les thèmes supplémentaires et les ouvertures sont indisponibles pour le moment.'); });
    return () => { cancelled = true; };
  }, [trainingIri]);
  const themeOptions = useMemo(() => [
    ...LICHESS_THEME_OPTIONS,
    ...catalogOptions.themes.filter((value) => !LICHESS_THEME_OPTIONS.some((option) => option.value === value))
      .map((value) => ({ value, label: value.replace(/_/g, ' ') })),
  ], [catalogOptions.themes]);
  const searchOptions = useMemo(() => [
    ...themeOptions.map((option) => ({ ...option, kind: ['opening', 'middlegame', 'endgame'].includes(option.value) ? 'phase' : 'theme' })),
    ...catalogOptions.openings.map((value) => ({ value: `opening:${value}`, label: value.replace(/_/g, ' '), kind: 'opening' })),
  ], [themeOptions, catalogOptions.openings]);
  const [distribution, setDistribution] = useState<'random' | 'custom'>('random');
  const [minMoves, setMinMoves] = useState('');
  const [maxMoves, setMaxMoves] = useState('');
  const [themeDistribution, setThemeDistribution] = useState<Record<string, number>>({});
  const [availablePuzzleCount, setAvailablePuzzleCount] = useState<number | null>(null);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const skipDuplicates = true;
  const [confirmedDuplicates, setConfirmedDuplicates] = useState(false);
  const [confirmedErrors, setConfirmedErrors] = useState(false);
  const [csvFilter, setCsvFilter] = useState<'all' | 'valid' | 'error' | 'duplicate'>('all');
  const [dismissedErrorLines, setDismissedErrorLines] = useState<number[]>([]);
  const [errorLinePendingDeletion, setErrorLinePendingDeletion] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvImportRequestRef = useRef(false);
  const availabilityRequestRef = useRef(0);
  const availabilityEstimatorRef = useRef(onEstimateLichessAvailability);
  const filteredThemeOptions = useMemo(() => {
    const query = normalizeSearchText(themeQuery);

    if (!query) {
      return [];
    }

    const words = query.split(/\s+/);
    const rank = (label: string) => label === query ? 0 : label.startsWith(query) ? 1 : 2;
    return searchOptions
      .filter((option) => !selectedThemes.includes(option.value))
      .filter((option) => words.every((word) => normalizeSearchText(`${option.label} ${option.value.replace(/_/g, ' ')}`).includes(word)))
      .sort((a, b) => rank(normalizeSearchText(a.label)) - rank(normalizeSearchText(b.label)) || a.label.length - b.label.length || a.label.localeCompare(b.label, 'fr'));
  }, [themeQuery, selectedThemes, searchOptions]);
  const selectedThemeLabels = selectedThemes.map(
    (theme) => searchOptions.find((option) => option.value === theme)?.label ?? theme,
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
  const reviewAnalysis = useMemo(() => {
    if (!analysis) return null;
    const rows = analysis.rows.filter((row) => row.status !== 'error' || !dismissedErrorLines.includes(row.line));
    return { ...analysis, errorCount: rows.filter((row) => row.status === 'error').length, rows };
  }, [analysis, dismissedErrorLines]);
  const csvFilterCounts = useMemo(() => {
    const rows = reviewAnalysis?.rows ?? [];

    return {
      all: rows.length,
      valid: rows.filter((row) => row.status === 'valid').length,
      error: rows.filter((row) => row.status === 'error').length,
      duplicate: rows.filter((row) => row.status === 'duplicate').length,
    };
  }, [reviewAnalysis]);
  const trainingDuplicateCount = useMemo(
    () => (analysis?.rows ?? []).filter((row) => row.status === 'duplicate' && row.duplicateReason === 'training').length,
    [analysis],
  );
  const effectiveImportableCount = analysis?.importableCount ?? 0;
  const requiresDuplicateConfirmation = (reviewAnalysis?.duplicateCount ?? 0) > 0;
  const requiresErrorConfirmation = (reviewAnalysis?.errorCount ?? 0) > 0;
  const confirmationsComplete = (!requiresDuplicateConfirmation || confirmedDuplicates) && (!requiresErrorConfirmation || confirmedErrors);
  const filteredCsvRows = useMemo(
    () => (reviewAnalysis?.rows ?? []).filter((row) => csvFilter === 'all' || row.status === csvFilter),
    [reviewAnalysis, csvFilter],
  );

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
      setDismissedErrorLines([]);
      setErrorLinePendingDeletion(null);
      setCsvStep(2);
    } catch {
      setCsvStep(1);
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleImport() {
    if (!analysis || csvImportRequestRef.current) {
      return;
    }

    csvImportRequestRef.current = true;
    try {
      const result = await onImportCsv({
        analysisId: analysis.analysisId,
        skipDuplicates,
        skipErroredPuzzles: true,
      });

      setCsvImportResult({ importedCount: result.importedCount });
    } finally {
      csvImportRequestRef.current = false;
    }
  }

  function selectFile(nextFile: File | null) {
    setFile(nextFile);
    setAnalysis(null);
    setCsvImportResult(null);
    setCsvStep(1);
    setCsvFilter('all');
    setConfirmedDuplicates(false);
    setConfirmedErrors(false);
    setDismissedErrorLines([]);
    setErrorLinePendingDeletion(null);
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
            {['Sélection', 'Validation', 'Importation'].map((label, index) => (
              <li className={csvStep === index + 1 ? 'is-current' : csvStep > index + 1 ? 'is-complete' : ''} key={label}>
                <span>{csvStep > index + 1 ? <CheckCircle2 aria-hidden="true" size={16} /> : index + 1}</span>
                {label}
              </li>
            ))}
          </ol>
          <div className="wp-panel wp-import-step">
            <div className="wp-import-section-heading">
              <div>
                <h3>{csvStep === 1 ? '1. Sélection du fichier CSV' : csvStep === 2 ? '2. Validation des puzzles invalides' : '3. Importation des puzzles'}</h3>
                <p>{csvStep === 1 ? 'Sélectionnez le fichier CSV contenant vos puzzles à importer.' : csvStep === 2 ? 'Vérifiez les puzzles détectés et corrigez ou retirez les puzzles invalides avant l’import.' : csvImportResult ? 'L’import a été effectué à partir de l’analyse existante.' : 'Vérifiez les informations ci-dessous avant d’importer vos puzzles.'}</p>
              </div>
              {file && csvStep !== 1 ? <div className="wp-import-file"><FileSpreadsheet aria-hidden="true" size={18} /><span>{file.name}</span><button className="wp-link-button wp-import-edit-button" onClick={() => fileInputRef.current?.click()} type="button">Changer</button></div> : null}
            </div>
            <input accept=".csv,text/csv" className="wp-import-file-input" onChange={(event) => { selectFile(event.target.files?.[0] ?? null); event.currentTarget.value = ''; }} ref={fileInputRef} type="file" />
            {csvStep === 1 ? (
              <>
                <div className={file ? 'wp-import-dropzone has-file' : 'wp-import-dropzone'} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); selectFile(event.dataTransfer.files?.[0] ?? null); }}>
                  {file ? <>
                    <div className="wp-import-dropzone-surface">
                      <UploadCloud aria-hidden="true" size={42} />
                      <strong>Glissez-déposez votre fichier CSV ici</strong>
                      <span>ou</span>
                      <button className="wp-secondary" disabled={puzzleListIsLocked} onClick={() => fileInputRef.current?.click()} type="button">Parcourir votre ordinateur</button>
                    </div>
                    <div className="wp-import-selected-file">
                      <button aria-label="Remplacer le fichier CSV" className="wp-import-dropzone-trigger wp-import-dropzone-trigger--file" disabled={puzzleListIsLocked} onClick={() => fileInputRef.current?.click()} type="button">
                        <span className="wp-import-selected-file__name" title={file.name}>{file.name}</span>
                        <span className="wp-import-selected-file__size">&mdash; {formatFileSize(file.size)}</span>
                      </button>
                      <button aria-label="Supprimer le fichier" className="wp-import-remove-file" onClick={() => selectFile(null)} type="button"><Trash2 aria-hidden="true" size={17} /></button>
                    </div>
                  </> : <button className="wp-import-dropzone-trigger" disabled={puzzleListIsLocked} onClick={() => fileInputRef.current?.click()} type="button"><UploadCloud aria-hidden="true" size={42} /><strong>Glissez-déposez votre fichier CSV ici</strong><span>ou</span><small>Parcourir votre ordinateur</small></button>}
                  {!file ? <em>Fichier accepté : .csv (max. 25 Mo)</em> : null}
                </div>
                <div className="wp-import-format"><Info aria-hidden="true" size={22} /><div><strong>Votre fichier doit respecter le format CSV Woodpecker.</strong><p>Téléchargez le modèle pour voir un exemple de fichier valide.</p></div><a className="wp-secondary wp-import-template-link" download href="/modele-import-puzzles.csv"><Download aria-hidden="true" size={17} />Télécharger le modèle CSV</a></div>
                <div className="wp-import-actions"><button className="wp-secondary" disabled={isAnalyzing || isImportingCsv} onClick={onBackToTraining} type="button">Annuler</button><LoadingButton loadingLabel="Analyse en cours…" loading={isAnalyzing} className="wp-primary" disabled={!file || isAnalyzing || !canImportIntoTraining} onClick={analyze} type="button"><span>{isAnalyzing ? 'Analyse en cours...' : 'Analyser le fichier'}</span><ArrowRight aria-hidden="true" size={16} /></LoadingButton></div>
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
              <div className="wp-import-actions wp-import-actions--between"><button className="wp-secondary" disabled={isImportingCsv} onClick={() => setCsvStep(1)} type="button"><ArrowLeft aria-hidden="true" size={16} />Retour</button><button className="wp-primary" disabled={isImportingCsv || !canImportIntoTraining} onClick={() => setCsvStep(3)} type="button">Continuer vers l’importation <ArrowRight aria-hidden="true" size={16} /></button></div>
            ) : null}
            {csvStep === 3 && analysis && !csvImportResult ? (
              <>
                <div className="wp-import-analysis-stats wp-import-analysis-stats--four">
                  <ImportStat icon={<CheckCircle2 aria-hidden="true" size={18} />} label="Puzzles valides" tone="success" value={String(analysis.validCount)} />
                  <ImportStat icon={<CircleX aria-hidden="true" size={18} />} label="Puzzles invalides" tone="danger" value={String(reviewAnalysis?.errorCount ?? 0)} />
                  <ImportStat icon={<Copy aria-hidden="true" size={18} />} label="Doublons détectés" tone="warning" value={String(analysis.duplicateCount)} />
                  <ImportStat icon={<FileSpreadsheet aria-hidden="true" size={18} />} label="Importables" value={String(effectiveImportableCount)} />
                </div>
                {(requiresDuplicateConfirmation || requiresErrorConfirmation) ? <div className="wp-import-options"><h4>Confirmations</h4>{requiresDuplicateConfirmation ? <label className="wp-import-confirmation"><input checked={confirmedDuplicates} onChange={(event) => setConfirmedDuplicates(event.target.checked)} type="checkbox" /><span>{analysis.duplicateCount} puzzle{analysis.duplicateCount > 1 ? 's déjà présents ne seront pas ajoutés' : ' déjà présent ne sera pas ajouté'} (doublons).</span></label> : null}{requiresErrorConfirmation ? <label className="wp-import-confirmation"><input checked={confirmedErrors} onChange={(event) => setConfirmedErrors(event.target.checked)} type="checkbox" /><span>{reviewAnalysis?.errorCount ?? 0} puzzle{(reviewAnalysis?.errorCount ?? 0) > 1 ? 's invalides ne seront pas ajoutés.' : ' invalide ne sera pas ajouté.'}</span></label> : null}</div> : null}
                <div className="wp-import-actions wp-import-actions--between"><button className="wp-secondary" disabled={isImportingCsv} onClick={() => setCsvStep(2)} type="button"><ArrowLeft aria-hidden="true" size={16} />Retour</button><LoadingButton loadingLabel="Import en cours…" loading={isImportingCsv} className="wp-primary" disabled={isImportingCsv || !canImportIntoTraining || effectiveImportableCount < 1 || !confirmationsComplete} onClick={() => void handleImport()} type="button"><UploadCloud aria-hidden="true" size={16} />{isImportingCsv ? 'Import en cours...' : `Importer ${effectiveImportableCount} puzzle${effectiveImportableCount > 1 ? 's' : ''}`}</LoadingButton></div>
              </>
            ) : null}
            {csvStep === 3 && analysis && csvImportResult ? (
              <>
                <div className="wp-import-success"><CheckCircle2 aria-hidden="true" size={28} /><div><strong>Import terminé</strong><p>{csvImportResult.importedCount} puzzle{csvImportResult.importedCount > 1 ? 's ont été ajoutés' : ' a été ajouté'} à l’entraînement à partir de l’analyse enregistrée.</p></div></div>
                <div className="wp-import-info-card"><strong>Résumé final</strong><p>{csvImportResult.importedCount} puzzle{csvImportResult.importedCount > 1 ? 's ont été importés.' : ' a été importé.'}</p><p>{analysis.errorCount + (skipDuplicates ? trainingDuplicateCount : 0)} ligne{analysis.errorCount + (skipDuplicates ? trainingDuplicateCount : 0) > 1 ? 's ont été ignorées' : ' a été ignorée'} à cause des erreurs ou doublons exclus.</p></div>
                <div className="wp-import-analysis-stats"><ImportStat icon={<CheckCircle2 aria-hidden="true" size={20} />} label="Importés" tone="success" value={String(csvImportResult.importedCount)} /><ImportStat icon={<FileSpreadsheet aria-hidden="true" size={20} />} label="Importables" value={String(effectiveImportableCount)} /><ImportStat icon={<CircleX aria-hidden="true" size={20} />} label="Puzzles invalides" tone="danger" value={String(reviewAnalysis?.errorCount ?? 0)} /></div>
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
              <summary><span><h3>3. Thèmes (optionnel)</h3><p>Sélectionnez des thèmes, des phases ou des ouvertures. Chaque puzzle correspond à au moins une catégorie sélectionnée.</p></span><ChevronDown aria-hidden="true" size={18} /></summary>
              <label className="wp-import-search-field"><Search aria-hidden="true" size={16} /><input onChange={(event) => setThemeQuery(event.target.value)} aria-label="Rechercher un thème, une phase ou une ouverture" placeholder="Rechercher un thème, une phase ou une ouverture..." value={themeQuery} /></label>
              {selectedThemes.length ? <div className="wp-import-theme-list">{selectedThemes.map((theme) => <button aria-label={`Retirer ${searchOptions.find((option) => option.value === theme)?.label ?? theme}`} className="wp-import-theme-chip is-selected" key={theme} onClick={() => removeTheme(theme)} type="button">{searchOptions.find((option) => option.value === theme)?.label ?? theme}<span aria-hidden="true">×</span></button>)}
              </div> : null}
              {themeQuery.trim() ? <div className="wp-import-theme-options">{filteredThemeOptions.length ? filteredThemeOptions.map((option) => <button className="wp-import-theme-chip" key={`${option.kind}-${option.value}`} title={option.label} onClick={() => addTheme(option.value)} type="button">{option.label}</button>) : <p className="wp-import-theme-empty">Aucun thème correspondant.</p>}</div> : null}
              {optionsError ? <p role="status">{optionsError}</p> : null}
            </details>
            {selectedThemes.length >= 2 ? (
            <details className="wp-panel wp-import-step wp-import-step-card" open>
              <summary><span><h3>4. Répartition (optionnel)</h3><p>Choisissez comment répartir les puzzles.</p></span><ChevronDown aria-hidden="true" size={18} /></summary>
              <div className="wp-import-distribution-options">
                <button aria-pressed={distribution === 'random'} className={distribution === 'random' ? 'is-selected' : ''} onClick={() => setDistribution('random')} type="button"><span className="wp-import-radio" /> <strong>Répartition aléatoire</strong><small>Lichess répartit automatiquement les puzzles.</small></button>
                <button aria-pressed={distribution === 'custom'} className={distribution === 'custom' ? 'is-selected' : ''} onClick={() => setDistribution('custom')} type="button"><span className="wp-import-radio" /> <strong>Répartition personnalisée</strong><small>Définissez un pourcentage pour chaque thème choisi.</small></button>
              </div>
              {distribution === 'custom' && selectedThemes.length ? <div className="wp-import-theme-distribution">{selectedThemes.map((theme) => <label key={theme}><span>{searchOptions.find((option) => option.value === theme)?.label ?? theme}</span><div><input max="100" min="0" onChange={(event) => setThemeDistribution((current) => ({ ...current, [theme]: Number(event.target.value) }))} type="number" value={themeDistribution[theme] ?? 0} /><small>%</small></div></label>)}</div> : null}
              {!customDistributionIsValid ? <p className="alert error-alert">La répartition personnalisée doit totaliser 100 %.</p> : null}
            </details>
            ) : null}
            <details className="wp-panel wp-import-advanced">
              <summary><span>{selectedThemes.length >= 2 ? 5 : 4}. Options avancées</span><ChevronDown aria-hidden="true" size={18} /></summary>
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
            <LoadingButton loadingLabel="Génération en cours…" loading={isImportingLichess} className="wp-primary full" disabled={!countIsValid || !ratingsAreValid || !moveRangeIsValid || !customDistributionIsValid || isImportingLichess || !canImportIntoTraining} onClick={() => onImportLichess({ count, minRating, maxRating, themes: selectedThemes, distribution, themeDistribution: distribution === 'custom' ? themeDistribution : undefined, minMoves: parsedMinMoves, maxMoves: parsedMaxMoves })} type="button">{isImportingLichess ? 'Génération en cours...' : `Générer les ${count} puzzles`}</LoadingButton>
            <small className="wp-import-summary-footnote">Un set sera créé et ajouté à votre entraînement.</small>
          </aside>
        </section>
      )}
      <ConfirmationModal confirmLabel="Retirer le puzzle invalide" description="Cette ligne sera retirée de la revue avant l’import." isDanger onClose={() => setErrorLinePendingDeletion(null)} onConfirm={() => { if (errorLinePendingDeletion !== null) { setDismissedErrorLines((current) => current.includes(errorLinePendingDeletion) ? current : [...current, errorLinePendingDeletion]); setConfirmedErrors(false); } setErrorLinePendingDeletion(null); }} open={errorLinePendingDeletion !== null} title="Retirer ce puzzle invalide ?" />
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
  filteredRows,
  onCsvFilterChange,
  onRequestDeleteError,
}: {
  analysis: CsvAnalysis;
  csvFilter: 'all' | 'valid' | 'error' | 'duplicate';
  csvFilterCounts: Record<'all' | 'valid' | 'error' | 'duplicate', number>;
  filteredRows: CsvAnalysisRow[];
  onCsvFilterChange: (value: 'all' | 'valid' | 'error' | 'duplicate') => void;
  onRequestDeleteError: (line: number) => void;
}) {
  const usefulRowCount = analysis.usefulRowCount ?? analysis.totalRows;

  return (
    <div className="wp-import-review">
      <div className="wp-import-analysis-stats wp-import-analysis-stats--five">
        <ImportStat icon={<CheckCircle2 aria-hidden="true" size={18} />} label="Puzzles valides" tone="success" value={String(analysis.validCount)} />
        <ImportStat icon={<CircleX aria-hidden="true" size={18} />} label="Puzzles invalides" tone="danger" value={String(analysis.errorCount)} />
        <ImportStat icon={<Copy aria-hidden="true" size={18} />} label="Doublons détectés" tone="warning" value={String(analysis.duplicateCount)} />
        <ImportStat icon={<FileSpreadsheet aria-hidden="true" size={18} />} label="Lignes utiles" value={String(usefulRowCount)} />
        <ImportStat icon={<Info aria-hidden="true" size={18} />} label="En-têtes détectés" value={`${analysis.detectedHeaderCount ?? 0} / ${analysis.expectedHeaderCount ?? 0}`} />
      </div>
      <div className="wp-import-review-toolbar wp-import-review-toolbar--validation">
        <div className="wp-import-filter-pills" role="tablist" aria-label="Filtres CSV">
          {[
            ['all', 'Tous', csvFilterCounts.all],
            ['valid', 'Valides', csvFilterCounts.valid],
            ['error', 'Invalides', csvFilterCounts.error],
            ['duplicate', 'Doublons', csvFilterCounts.duplicate],
          ].map(([value, label, count]) => (
            <button
              aria-pressed={csvFilter === value}
              className={csvFilter === value ? 'is-active' : ''}
              key={value}
              onClick={() => onCsvFilterChange(value as 'all' | 'valid' | 'error' | 'duplicate')}
              type="button"
            >
              <span>{label} {count}</span>
            </button>
          ))}
        </div>
        <button className="wp-secondary wp-import-report-button" onClick={() => exportAnalysisReport(analysis)} type="button"><Download aria-hidden="true" size={16} />Exporter le rapport</button>
      </div>
      {filteredRows.length ? (
        <div className="wp-import-rows-table" role="region" aria-label="Résultats CSV">
          <div className="wp-import-rows-table__head wp-import-rows-table__head--csv">
            <span>#</span>
            <span>Aperçu</span>
            <span>FEN / ID Lichess</span>
            <span>Difficulté</span>
            <span>Statut</span>
            <span>Détail</span>
            <span>Action</span>
          </div>
          {filteredRows.map((row, index) => (
            <div className="wp-import-rows-table__row wp-import-rows-table__row--csv" key={`${row.line}-${row.status}-${row.sourceId ?? 'none'}`}>
              <span className="wp-import-table-index">#{index + 1}</span>
              <span className="wp-import-preview-board"><CsvRowBoard fen={row.fen} /></span>
              <span className="wp-import-table-stack"><strong title={row.fen ?? undefined}>{truncateFen(row.fen)}</strong>{row.sourceId?.trim() ? <small>Lichess ID: {row.sourceId}</small> : null}</span>
              <span className="wp-import-rating-value">{renderDifficultyValue(row.rating)}</span>
              <span><span className={`wp-import-chip is-${row.status === 'valid' ? 'success' : row.status === 'error' ? 'danger' : 'warning'}`}>{formatCsvRowStatus(row)}</span></span>
              <span className="wp-import-table-stack"><strong>{row.status === 'valid' ? '—' : row.message ?? '—'}</strong>{row.status !== 'valid' ? <small>{row.status === 'duplicate' && row.sourceId ? `ID: ${row.sourceId}` : `Ligne ${row.line}`}</small> : null}</span>
              <span>{renderCsvRowAction(row, onRequestDeleteError)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="wp-empty">Aucune ligne ne correspond à ce filtre.</p>
      )}
    </div>
  );
}

function CsvRowBoard({ fen }: { fen?: string | null }) {
  const rows = parseFenBoard(fen);

  if (!rows) {
    return <span className="wp-detail-problem-preview__empty">?</span>;
  }

  return (
    <span className="wp-detail-problem-preview__board" aria-hidden="true">
      {rows.map((row, rowIndex) =>
        row.map((piece, columnIndex) => {
          const isDark = (rowIndex + columnIndex) % 2 === 1;
          const cellClassName = isDark
            ? 'wp-detail-problem-preview__cell is-dark'
            : 'wp-detail-problem-preview__cell is-light';

          return (
            <span className={cellClassName} key={`${rowIndex}-${columnIndex}`}>
              {piece ? PIECE_SYMBOLS[piece] ?? '' : ''}
            </span>
          );
        }))}
    </span>
  );
}

function parseFenBoard(fen?: string | null) {
  const board = fen?.trim().split(' ')[0] ?? '';
  const rows = board.split('/');
  if (rows.length !== 8) {
    return null;
  }

  try {
    return rows.map((row) => {
      const cells: string[] = [];
      for (const token of row) {
        const emptyCount = Number(token);
        if (Number.isInteger(emptyCount) && emptyCount > 0) {
          for (let index = 0; index < emptyCount; index += 1) {
            cells.push('');
          }
        } else {
          cells.push(token);
        }
      }
      if (cells.length !== 8) {
        throw new Error('invalid fen');
      }
      return cells;
    });
  } catch {
    return null;
  }
}

function truncateFen(fen?: string | null) {
  if (!fen) {
    return 'FEN indisponible';
  }

  return fen.length > 34 ? `${fen.slice(0, 34)}…` : fen;
}

function renderDifficultyValue(rating?: number | string | null) {
  const numericRating = typeof rating === 'number' ? rating : typeof rating === 'string' ? Number(rating) : NaN;
  if (!Number.isFinite(numericRating)) {
    return '—';
  }

  return formatInteger(numericRating);
}

function renderCsvRowAction(row: CsvAnalysisRow, onRequestDeleteError: (line: number) => void) {
  if (row.status === 'error') {
    return <button aria-label={'Retirer le puzzle invalide de la ligne ' + row.line} className="wp-import-action-button" onClick={() => onRequestDeleteError(row.line)} type="button"><Trash2 aria-hidden="true" size={15} /></button>;
  }

  return '—';
}

function formatCsvRowStatus(row: CsvAnalysisRow) {
  if (row.status === 'valid') {
    return 'Valide';
  }

  if (row.status === 'error') {
    return 'Invalide';
  }

  return 'Doublon';
}

function formatInteger(value: number) {
  return new Intl.NumberFormat('fr-FR').format(value);
}

function escapeCsvCell(value: number | string | null | undefined) {
  const normalizedValue = String(value ?? '');
  if (!/[";\n]/.test(normalizedValue)) {
    return normalizedValue;
  }

  return `"${normalizedValue.replace(/"/g, '""')}"`;
}

function exportAnalysisReport(analysis: CsvAnalysis) {
  const csv = [
    ['Ligne', 'Statut', 'Doublon', 'Message', 'FEN', 'ID Lichess', 'Rating', 'Themes'],
    ...analysis.rows.map((row) => [
      row.line,
      formatCsvRowStatus(row),
      row.duplicateReason ?? '',
      row.message ?? '',
      row.fen ?? '',
      row.sourceId ?? '',
      row.rating ?? '',
      (row.themes ?? []).join(', '),
    ]),
  ].map((line) => line.map((value) => escapeCsvCell(value)).join(';')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `rapport-analyse-${analysis.analysisId}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
}

function ImportStat({ icon, label, tone, value }: { icon: ReactNode; label: string; tone?: 'danger' | 'success' | 'warning'; value: string }) {
  return <div className={`wp-import-stat${tone ? ` is-${tone}` : ''}`}><div className="wp-import-stat__header">{icon}<span>{label}</span></div><strong>{value}</strong></div>;
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
