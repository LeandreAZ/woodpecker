import type { ComponentProps } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ImportView } from './TrainingsPanelContentViews';

vi.mock('../auth/authStorage', () => ({ loadStoredSession: vi.fn() }));
vi.mock('../../shared/api/client', () => ({ apiRequest: vi.fn() }));
import { apiRequest } from '../../shared/api/client';
import { loadStoredSession } from '../auth/authStorage';
beforeEach(() => { vi.mocked(loadStoredSession).mockReturnValue(null); vi.mocked(apiRequest).mockResolvedValue({ themes: [], openings: [] }); });

const selectedTraining = { '@id': '/api/trainings/1', createdAt: '2026-08-01T00:00:00+00:00', id: 1, mistakeLimit: 3, name: 'Tactiques', status: 'draft' as const };

const csvAnalysis = {
  analysisId: 'analysis-123',
  totalRows: 4,
  usefulRowCount: 4,
  detectedHeaderCount: 7,
  expectedHeaderCount: 10,
  validCount: 1,
  errorCount: 1,
  duplicateCount: 2,
  importableCount: 1,
  errors: [{ line: 4, message: 'FEN invalide.' }],
  rows: [
    { line: 2, status: 'valid' as const, fen: '8/8/8/8/8/8/8/8 w - - 0 1', rating: 1500, themes: ['fork'], sourceId: 'fresh-1' },
    { line: 3, status: 'duplicate' as const, duplicateReason: 'training' as const, fen: '8/8/8/8/8/8/8/K6k w - - 0 1', rating: 1600, themes: ['pin'], sourceId: 'existing-1', message: 'Puzzle deja present dans cet entrainement.' },
    { line: 4, status: 'error' as const, fen: 'invalid-fen', message: 'FEN invalide.' },
    { line: 5, status: 'duplicate' as const, duplicateReason: 'file' as const, fen: '8/8/8/8/8/8/8/7k w - - 0 1', rating: 1500, themes: ['fork'], sourceId: 'fresh-1', message: 'Doublon detecte dans le fichier.' },
  ],
  preview: [{ rating: 1500, themes: ['fork'] }],
};

function buildProps(overrides: Partial<ComponentProps<typeof ImportView>> = {}) {
  return {
    csvErrorMessage: undefined,
    isImportingCsv: false,
    isImportingLichess: false,
    lichessErrorMessage: undefined,
    onAnalyzeCsv: vi.fn().mockResolvedValue(csvAnalysis),
    onBackToTraining: vi.fn(),
    onEstimateLichessAvailability: vi.fn().mockResolvedValue(312487),
    onImportCsv: vi.fn().mockResolvedValue({ importedCount: 2 }),
    onImportLichess: vi.fn(),
    onSelectCsvFile: vi.fn(),
    puzzleListIsLocked: false,
    selectedTraining,
    ...overrides,
  };
}

describe('ImportView', () => {
  it('transmet une ouverture et les thèmes supplémentaires du catalogue', async () => {
    vi.mocked(loadStoredSession).mockReturnValue({ token: 'test-token', email: 'test@example.com' });
    vi.mocked(apiRequest).mockResolvedValue({ themes: ['catalogue_theme'], openings: ['sicilian_defense'] });
    const props = buildProps();
    render(<ImportView {...props} />);
    fireEvent.change(screen.getByPlaceholderText('Rechercher un thème, une phase ou une ouverture...'), { target: { value: 'sicilian' } });
    fireEvent.click(await screen.findByRole('button', { name: 'sicilian defense' }));
    fireEvent.change(screen.getByPlaceholderText('Rechercher un thème, une phase ou une ouverture...'), { target: { value: 'catalogue'  } });
    fireEvent.click(screen.getByRole('button', { name: 'catalogue theme' }));
    await waitFor(() => expect(props.onEstimateLichessAvailability).toHaveBeenLastCalledWith(expect.objectContaining({ themes: ['opening:sicilian_defense', 'catalogue_theme'] })));
    fireEvent.click(screen.getByRole('button', { name: 'Répartition personnalisée Définissez un pourcentage pour chaque thème choisi.' }));
    fireEvent.change(screen.getByDisplayValue('100'), { target: { value: '20' } });
    fireEvent.change(screen.getByDisplayValue('0'), { target: { value: '80' } });
    fireEvent.click(screen.getByRole('button', { name: 'Générer les 300 puzzles' }));
    expect(props.onImportLichess).toHaveBeenCalledWith(expect.objectContaining({ themes: ['opening:sicilian_defense', 'catalogue_theme'], distribution: 'custom', themeDistribution: { 'opening:sicilian_defense': 20, catalogue_theme: 80 } }));
  });

  it.each([['Ouverture', 'opening'], ['Finale', 'endgame'], ['Milieu de jeu', 'middlegame']])('rend la phase %s répartissable avec un thème', async (label, phase) => {
    const props = buildProps();
    render(<ImportView {...props} />);
    const search = screen.getByPlaceholderText('Rechercher un thème, une phase ou une ouverture...');
    fireEvent.change(search, { target: { value: 'Fourchette' } });
    fireEvent.click(screen.getByRole('button', { name: 'Fourchette' }));
    fireEvent.change(search, { target: { value: label } });
    fireEvent.click(screen.getByRole('button', { name: label }));
    await waitFor(() => expect(props.onEstimateLichessAvailability).toHaveBeenLastCalledWith(expect.objectContaining({ themes: ['fork', phase] })));
    fireEvent.click(screen.getByRole('button', { name: 'Générer les 300 puzzles' }));
    expect(props.onImportLichess).toHaveBeenLastCalledWith(expect.objectContaining({ themes: ['fork', phase] }));
    expect(screen.getByRole('button', { name: 'Répartition personnalisée Définissez un pourcentage pour chaque thème choisi.' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: `Retirer ${label}` }));
    fireEvent.click(screen.getByRole('button', { name: 'Générer les 300 puzzles' }));
    expect(props.onImportLichess).toHaveBeenLastCalledWith(expect.objectContaining({ themes: ['fork'] }));
  });

  it('envoie les critères Lichess du wizard', () => {
    const props = buildProps();
    render(<ImportView {...props} />);
    fireEvent.click(screen.getByRole('button', { name: '500' }));
    expect(screen.getByLabelText('Nombre de puzzles')).toHaveValue(500);
    fireEvent.change(screen.getByPlaceholderText('Rechercher un thème, une phase ou une ouverture...'), { target: { value: 'four' } });
    fireEvent.click(screen.getByRole('button', { name: 'Fourchette' }));
    fireEvent.change(screen.getByPlaceholderText('Rechercher un thème, une phase ou une ouverture...'), { target: { value: 'pion' } });
    fireEvent.click(screen.getByRole('button', { name: 'Pion avancé' }));
    fireEvent.click(screen.getByRole('button', { name: 'Répartition personnalisée Définissez un pourcentage pour chaque thème choisi.' }));
    fireEvent.change(screen.getByDisplayValue('100'), { target: { value: '50' } });
    fireEvent.change(screen.getByDisplayValue('0'), { target: { value: '50' } });
    fireEvent.click(screen.getByRole('button', { name: 'Générer les 500 puzzles' }));
    expect(props.onImportLichess).toHaveBeenCalledWith({
      count: 500,
      minRating: 800,
      maxRating: 2400,
      themes: ['fork', 'advancedpawn'],
      distribution: 'custom',
      themeDistribution: { fork: 50, advancedpawn: 50 },
      minMoves: undefined,
      maxMoves: undefined,
    });
  });

  it('synchronise les inputs de difficulté et les deux poignées du slider', () => {
    render(<ImportView {...buildProps()} />);

    fireEvent.change(screen.getByLabelText('Difficulté minimale'), { target: { value: '1200' } });
    expect(screen.getByLabelText('Min')).toHaveValue(1200);

    fireEvent.change(screen.getByLabelText('Max'), { target: { value: '2200' } });
    expect(screen.getByLabelText('Difficulté maximale')).toHaveValue('2200');
  });

  it('affiche tous les thèmes correspondant à la recherche', () => {
    render(<ImportView {...buildProps()} />);

    expect(screen.queryByRole('button', { name: 'Fourchette' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Rechercher un thème, une phase ou une ouverture...'), { target: { value: 'a' } });

    expect(document.querySelectorAll('.wp-import-theme-options button').length).toBeGreaterThan(6);
  });

  it('affiche les lignes CSV, filtre, impose les confirmations et importe depuis analysisId', async () => {
    const props = buildProps();
    render(<ImportView {...props} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Importer un fichier CSV' }));
    const input = document.querySelector('.wp-import-file-input') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['csv'], 'puzzles.csv', { type: 'text/csv' })] } });
    fireEvent.click(screen.getByRole('button', { name: 'Analyser le fichier' }));

    await waitFor(() => expect(screen.getByText('2. Validation des puzzles invalides')).toBeInTheDocument(), { timeout: 10000 });
    expect(screen.getByText('Lignes utiles')).toBeInTheDocument();
    expect(screen.getByText('En-têtes détectés')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Rechercher (FEN, ID Lichess, erreur...)')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Doublons 2/ }));
    expect(screen.getAllByText('Doublon').length).toBeGreaterThan(0);
    expect(screen.queryByText('FEN invalide.')).not.toBeInTheDocument();
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Continuer vers l’importation/ }));

    const importButton = screen.getByRole('button', { name: 'Importer 1 puzzle' });
    expect(importButton).toBeDisabled();

    fireEvent.click(screen.getByRole('checkbox', { name: /2 puzzles déjà présents ne seront pas ajoutés/ }));
    expect(importButton).toBeDisabled();

    fireEvent.click(screen.getByRole('checkbox', { name: /1 puzzle invalide ne sera pas ajouté/ }));
    expect(importButton).toBeEnabled();

    fireEvent.click(importButton);

    await waitFor(() => expect(props.onImportCsv).toHaveBeenCalledWith({ analysisId: 'analysis-123', skipDuplicates: true, skipErroredPuzzles: true }));
    expect(screen.getByText('Import terminé')).toBeInTheDocument();
    expect(screen.getByText('2 puzzles ont été ajoutés à l’entraînement à partir de l’analyse enregistrée.')).toBeInTheDocument();
  }, 10000);
});
