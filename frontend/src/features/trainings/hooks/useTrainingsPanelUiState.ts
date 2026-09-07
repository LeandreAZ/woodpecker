import { useState } from 'react';
import type { PuzzleCsvRow } from '../../import/csv/csvImport';
import { DEFAULT_TRAINING_BRANDING } from '../components/identity/TrainingBranding';
import type { View } from '../types/training.types';
import type { HistoryFilterPreset } from '../../history/types/history.types';

export function useTrainingsPanelUiState(initialView: View) {
  const [activeView, setActiveView] = useState<View>(initialView);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState(DEFAULT_TRAINING_BRANDING.icon);
  const [iconBackgroundColor, setIconBackgroundColor] = useState(DEFAULT_TRAINING_BRANDING.iconBackgroundColor);
  const [iconColor, setIconColor] = useState(DEFAULT_TRAINING_BRANDING.iconColor);
  const [selectedTrainingIri, setSelectedTrainingIri] = useState<string | null>(null);
  const [fen, setFen] = useState('');
  const [solutionText, setSolutionText] = useState('');
  const [themesText, setThemesText] = useState('');
  const [rating, setRating] = useState('');
  const [personalNote, setPersonalNote] = useState('');
  const [csvRows, setCsvRows] = useState<PuzzleCsvRow[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [csvFileName, setCsvFileName] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [selectedTrainingPuzzleIri, setSelectedTrainingPuzzleIri] = useState<string | null>(null);
  const [activeCycleIri, setActiveCycleIri] = useState<string | null>(null);
  const [activeTrainingSessionIri, setActiveTrainingSessionIri] = useState<string | null>(null);
  const [historyFilterPreset, setHistoryFilterPreset] = useState<HistoryFilterPreset | null>(null);
  const [savedCyclePuzzleIris, setSavedCyclePuzzleIris] = useState<Set<string>>(() => new Set());
  const [failedCyclePuzzleIris, setFailedCyclePuzzleIris] = useState<Set<string>>(() => new Set());

  return {
    activeCycleIri,
    activeTrainingSessionIri,
    activeView,
    csvErrors,
    csvFile,
    csvFileName,
    csvRows,
    description,
    failedCyclePuzzleIris,
    fen,
    historyFilterPreset,
    icon,
    iconBackgroundColor,
    iconColor,
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
    setCsvFile,
    setCsvFileName,
    setCsvRows,
    setDescription,
    setFailedCyclePuzzleIris,
    setFen,
    setHistoryFilterPreset,
    setIcon,
    setIconBackgroundColor,
    setIconColor,
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
