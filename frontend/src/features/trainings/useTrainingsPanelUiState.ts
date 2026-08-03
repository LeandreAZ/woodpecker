import { useState } from 'react';
import type { PuzzleCsvRow } from './csvImport';
import type { View } from './trainingsTypes';

export function useTrainingsPanelUiState() {
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
  const [mistakeLimitOverride, setMistakeLimitOverride] = useState<number | null>(null);

  return {
    activeCycleIri,
    activeTrainingSessionIri,
    activeView,
    csvErrors,
    csvFileName,
    csvRows,
    description,
    failedCyclePuzzleIris,
    fen,
    mistakeLimitOverride,
    name,
    personalNote,
    rating,
    savedCyclePuzzleIris,
    selectedTrainingIri,
    selectedTrainingPuzzleIri,
    setActiveCycleIri,
    setActiveTrainingSessionIri,
    setActiveView,
    setCsvErrors,
    setCsvFileName,
    setCsvRows,
    setDescription,
    setFailedCyclePuzzleIris,
    setFen,
    setMistakeLimitOverride,
    setName,
    setPersonalNote,
    setRating,
    setSavedCyclePuzzleIris,
    setSelectedTrainingIri,
    setSelectedTrainingPuzzleIri,
    setSolutionText,
    setThemesText,
    solutionText,
    themesText,
  };
}
