import { useEffect, useMemo, useRef, useState, type SetStateAction } from 'react';
import { apiRequest } from '../../../shared/api/client';
import { loadStoredSession } from '../../auth/services/authStorage';
import type { Training } from '../../trainings/types/training.types';
import type { CsvAnalysis, CsvStep, CsvImportOptions } from '../csv/csvImport.types.ts';
import type { LichessCriteria } from '../lichess/lichessImport.types.ts';
import {
  LICHESS_THEME_OPTIONS,
  normalizeSearchText,
  normalizeThemeDistribution,
} from '../lichess/lichessThemes';

export type ImportViewProps = {
  csvErrorMessage?: string;
  isImportingCsv: boolean;
  isImportingLichess: boolean;
  lichessErrorMessage?: string;
  onAnalyzeCsv: (file: File) => Promise<CsvAnalysis>;
  onBackToTraining: () => void;
  onEstimateLichessAvailability?: (
    criteria: Pick<LichessCriteria, 'count' | 'maxRating' | 'minRating' | 'themes' | 'minMoves' | 'maxMoves'>,
  ) => Promise<number | null>;
  onImportCsv: (options: CsvImportOptions) => Promise<{ importedCount: number }>;
  onImportLichess: (criteria: LichessCriteria) => void;
  onSelectCsvFile: (file: File | null) => void;
  puzzleListIsLocked: boolean;
  selectedTraining: Training | null;
};

export function useImportViewState({
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
}: ImportViewProps) {
  const [tab, setTab] = useState<'csv' | 'lichess'>('lichess');
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<CsvAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [csvStep, setCsvStep] = useState<CsvStep>(1);
  const [csvImportResult, setCsvImportResult] = useState<{ importedCount: number } | null>(null);
  const [count, setCount] = useState(300);
  const [minRating, setMinRating] = useState(800);
  const [maxRating, setMaxRating] = useState(2400);
  const [themeSelection, setThemeSelection] = useState<{
    selectedThemes: string[];
    distribution: 'random' | 'custom';
    themeDistribution: Record<string, number>;
  }>({ selectedThemes: [], distribution: 'random', themeDistribution: {} });
  const { selectedThemes, distribution, themeDistribution } = themeSelection;
  function setDistribution(value: SetStateAction<'random' | 'custom'>) {
    setThemeSelection((current) => ({
      ...current,
      distribution:
        current.selectedThemes.length < 2
          ? 'random'
          : typeof value === 'function'
            ? value(current.distribution)
            : value,
    }));
  }
  function setThemeDistribution(value: SetStateAction<Record<string, number>>) {
    setThemeSelection((current) => ({
      ...current,
      themeDistribution: typeof value === 'function' ? value(current.themeDistribution) : value,
    }));
  }
  function setSelectedThemes(value: SetStateAction<string[]>) {
    setThemeSelection((current) => {
      const next = typeof value === 'function' ? value(current.selectedThemes) : value;
      return {
        selectedThemes: next,
        distribution: next.length < 2 ? 'random' : current.distribution,
        themeDistribution: next.length ? normalizeThemeDistribution(current.themeDistribution, next) : {},
      };
    });
  }
  const [themeQuery, setThemeQuery] = useState('');
  const [catalogOptions, setCatalogOptions] = useState<{ themes: string[]; openings: string[] }>({
    themes: [],
    openings: [],
  });
  const [optionsFailure, setOptionsFailure] = useState<{ trainingIri: string; message: string } | null>(null);
  const trainingIri = selectedTraining?.['@id'];
  const optionsError = optionsFailure?.trainingIri === trainingIri ? (optionsFailure?.message ?? '') : '';
  useEffect(() => {
    const session = loadStoredSession();
    if (!session || !trainingIri) return;
    let cancelled = false;
    void apiRequest<{ themes: string[]; openings: string[] }>(
      `${trainingIri.replace(/^\/api/, '')}/imports/lichess/options`,
      { token: session.token },
    )
      .then((options) => {
        if (!cancelled) {
          setCatalogOptions(options);
          setOptionsFailure(null);
        }
      })
      .catch(() => {
        if (!cancelled)
          setOptionsFailure({
            trainingIri,
            message: 'Les thèmes supplémentaires et les ouvertures sont indisponibles pour le moment.',
          });
      });
    return () => {
      cancelled = true;
    };
  }, [trainingIri]);
  const themeOptions = useMemo(
    () => [
      ...LICHESS_THEME_OPTIONS,
      ...catalogOptions.themes
        .filter((value) => !LICHESS_THEME_OPTIONS.some((option) => option.value === value))
        .map((value) => ({ value, label: value.replace(/_/g, ' ') })),
    ],
    [catalogOptions.themes],
  );
  const searchOptions = useMemo(
    () => [
      ...themeOptions.map((option) => ({
        ...option,
        kind: ['opening', 'middlegame', 'endgame'].includes(option.value) ? 'phase' : 'theme',
      })),
      ...catalogOptions.openings.map((value) => ({
        value: `opening:${value}`,
        label: value.replace(/_/g, ' '),
        kind: 'opening',
      })),
    ],
    [themeOptions, catalogOptions.openings],
  );
  const [minMoves, setMinMoves] = useState('');
  const [maxMoves, setMaxMoves] = useState('');
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
    const rank = (label: string) => (label === query ? 0 : label.startsWith(query) ? 1 : 2);
    return searchOptions
      .filter((option) => !selectedThemes.includes(option.value))
      .filter((option) =>
        words.every((word) =>
          normalizeSearchText(`${option.label} ${option.value.replace(/_/g, ' ')}`).includes(word),
        ),
      )
      .sort(
        (a, b) =>
          rank(normalizeSearchText(a.label)) - rank(normalizeSearchText(b.label)) ||
          a.label.length - b.label.length ||
          a.label.localeCompare(b.label, 'fr'),
      );
  }, [themeQuery, selectedThemes, searchOptions]);
  const selectedThemeLabels = selectedThemes.map(
    (theme) => searchOptions.find((option) => option.value === theme)?.label ?? theme,
  );
  const countIsValid = Number.isInteger(count) && count >= 1 && count <= 1000;
  const ratingsAreValid =
    Number.isInteger(minRating) &&
    Number.isInteger(maxRating) &&
    minRating >= 100 &&
    maxRating <= 4000 &&
    minRating <= maxRating;
  const canImportIntoTraining = Boolean(selectedTraining) && !puzzleListIsLocked;
  const currentErrorMessage = tab === 'csv' ? csvErrorMessage : lichessErrorMessage;
  const parsedMinMoves = minMoves === '' ? undefined : Number(minMoves);
  const parsedMaxMoves = maxMoves === '' ? undefined : Number(maxMoves);
  const moveRangeIsValid =
    (parsedMinMoves === undefined || (Number.isInteger(parsedMinMoves) && parsedMinMoves >= 1)) &&
    (parsedMaxMoves === undefined || (Number.isInteger(parsedMaxMoves) && parsedMaxMoves >= 1)) &&
    (parsedMinMoves === undefined || parsedMaxMoves === undefined || parsedMinMoves <= parsedMaxMoves);
  const themeDistributionTotal = selectedThemes.reduce(
    (sum, theme) => sum + (themeDistribution[theme] ?? 0),
    0,
  );
  const customDistributionIsValid =
    distribution === 'random' || selectedThemes.length < 2 || themeDistributionTotal === 100;
  const reviewAnalysis = useMemo(() => {
    if (!analysis) return null;
    const rows = analysis.rows.filter(
      (row) => row.status !== 'error' || !dismissedErrorLines.includes(row.line),
    );
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
    () =>
      (analysis?.rows ?? []).filter((row) => row.status === 'duplicate' && row.duplicateReason === 'training')
        .length,
    [analysis],
  );
  const effectiveImportableCount = analysis?.importableCount ?? 0;
  const requiresDuplicateConfirmation = (reviewAnalysis?.duplicateCount ?? 0) > 0;
  const requiresErrorConfirmation = (reviewAnalysis?.errorCount ?? 0) > 0;
  const confirmationsComplete =
    (!requiresDuplicateConfirmation || confirmedDuplicates) &&
    (!requiresErrorConfirmation || confirmedErrors);
  const filteredCsvRows = useMemo(
    () => (reviewAnalysis?.rows ?? []).filter((row) => csvFilter === 'all' || row.status === csvFilter),
    [reviewAnalysis, csvFilter],
  );

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
        .then((nextCount) => {
          if (availabilityRequestRef.current === requestId) setAvailablePuzzleCount(nextCount);
        })
        .catch(() => {
          if (availabilityRequestRef.current === requestId) setAvailablePuzzleCount(null);
        })
        .finally(() => {
          if (availabilityRequestRef.current === requestId) setIsLoadingAvailability(false);
        });
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
    setSelectedThemes((current) => (current.includes(theme) ? current : [...current, theme]));
    setThemeQuery('');
  }

  function removeTheme(theme: string) {
    setSelectedThemes((current) => current.filter((value) => value !== theme));
  }

  return {
    isImportingCsv,
    isImportingLichess,
    onBackToTraining,
    onImportLichess,
    puzzleListIsLocked,
    tab,
    setTab,
    file,
    analysis,
    isAnalyzing,
    csvStep,
    setCsvStep,
    csvImportResult,
    count,
    setCount,
    minRating,
    setMinRating,
    maxRating,
    setMaxRating,
    selectedThemes,
    themeQuery,
    setThemeQuery,
    optionsError,
    searchOptions,
    distribution,
    setDistribution,
    minMoves,
    setMinMoves,
    maxMoves,
    setMaxMoves,
    themeDistribution,
    setThemeDistribution,
    availablePuzzleCount,
    isLoadingAvailability,
    skipDuplicates,
    confirmedDuplicates,
    setConfirmedDuplicates,
    confirmedErrors,
    setConfirmedErrors,
    csvFilter,
    setCsvFilter,
    setDismissedErrorLines,
    errorLinePendingDeletion,
    setErrorLinePendingDeletion,
    fileInputRef,
    filteredThemeOptions,
    selectedThemeLabels,
    countIsValid,
    ratingsAreValid,
    canImportIntoTraining,
    currentErrorMessage,
    parsedMinMoves,
    parsedMaxMoves,
    moveRangeIsValid,
    customDistributionIsValid,
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
    addTheme,
    removeTheme,
  };
}
