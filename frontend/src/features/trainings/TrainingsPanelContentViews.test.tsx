import type { ComponentProps } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ImportView } from './TrainingsPanelContentViews';

const selectedTraining = { '@id': '/api/trainings/1', createdAt: '2026-08-01T00:00:00+00:00', id: 1, mistakeLimit: 3, name: 'Tactiques', status: 'draft' as const };

const csvAnalysis = {
  analysisId: 'analysis-123',
  totalRows: 4,
  validCount: 1,
  errorCount: 1,
  duplicateCount: 2,
  importableCount: 1,
  errors: [{ line: 4, message: 'FEN invalide.' }],
  rows: [
    { line: 2, status: 'valid' as const, rating: 1500, themes: ['fork'], sourceId: 'fresh-1' },
    { line: 3, status: 'duplicate' as const, duplicateReason: 'training' as const, rating: 1600, themes: ['pin'], sourceId: 'existing-1', message: 'Puzzle deja present dans cet entrainement.' },
    { line: 4, status: 'error' as const, message: 'FEN invalide.' },
    { line: 5, status: 'duplicate' as const, duplicateReason: 'file' as const, rating: 1500, themes: ['fork'], sourceId: 'fresh-1', message: 'Doublon detecte dans le fichier.' },
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
  it('envoie les critères Lichess du wizard', () => {
    const props = buildProps();
    render(<ImportView {...props} />);
    fireEvent.click(screen.getByRole('button', { name: '500' }));
    expect(screen.getByLabelText('Nombre de puzzles')).toHaveValue(500);
    fireEvent.change(screen.getByPlaceholderText('Rechercher un thème...'), { target: { value: 'four' } });
    fireEvent.click(screen.getByRole('button', { name: 'Fourchette' }));
    fireEvent.change(screen.getByPlaceholderText('Rechercher un thème...'), { target: { value: 'pion' } });
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

  it('n’affiche les suggestions de thèmes qu’après une recherche et les limite', () => {
    render(<ImportView {...buildProps()} />);

    expect(screen.queryByRole('button', { name: 'Fourchette' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Rechercher un thème...'), { target: { value: 'a' } });

    expect(screen.getAllByRole('button', { name: /Tactique|Mat en 1|Mat en 2|Mat en 3|Attaque double|Avantage|Sacrifice/ }).length).toBeLessThanOrEqual(6);
  });

  it('affiche les lignes CSV, filtre, recherche, importe depuis analysisId et montre l’état final de succès', async () => {
    const props = buildProps();
    render(<ImportView {...props} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Importer un fichier CSV' }));
    const input = document.querySelector('.wp-import-file-input') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['csv'], 'puzzles.csv', { type: 'text/csv' })] } });
    fireEvent.click(screen.getByRole('button', { name: 'Analyser le fichier' }));

    await waitFor(() => expect(screen.getByText('2. Validation et erreurs')).toBeInTheDocument(), { timeout: 10000 });
    expect(screen.getByText('Importables')).toBeInTheDocument();
    expect(screen.getByText('Puzzle deja present dans cet entrainement.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Doublons/ }));
    expect(screen.getByText('Doublon entraînement')).toBeInTheDocument();
    expect(screen.queryByText('FEN invalide.')).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Rechercher une ligne, un thème ou un message...'), { target: { value: 'existing-1' } });
    expect(screen.getByText('#3')).toBeInTheDocument();
    expect(screen.queryByText('#5')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Continuer vers l’importation/ }));
    fireEvent.click(screen.getByLabelText('Éviter les doublons déjà présents dans l’entraînement'));
    expect(screen.getByRole('button', { name: 'Importer 2 puzzles' })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'Importer 2 puzzles' }));

    await waitFor(() => expect(props.onImportCsv).toHaveBeenCalledWith({ analysisId: 'analysis-123', skipDuplicates: false, skipErroredPuzzles: true }));
    expect(screen.getByText('Import terminé')).toBeInTheDocument();
    expect(screen.getByText('2 puzzles ont été ajoutés à l’entraînement à partir de l’analyse enregistrée.')).toBeInTheDocument();
  }, 10000);
});
