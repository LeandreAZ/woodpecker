import { describe, expect, it } from 'vitest';
import { parsePuzzleCsv } from './csvImport';

describe('parsePuzzleCsv', () => {
  it('supporte les en-tetes separes par des points-virgules', () => {
    const result = parsePuzzleCsv('Moves;Themes;Rating\ne2e4;fork;1500');

    expect(result.errors).toEqual([]);
    expect(result.rows).toEqual([
      {
        fen: null,
        solution: ['e2e4'],
        themes: ['fork'],
        rating: 1500,
        personalNote: null,
      },
    ]);
  });

  it('normalise les themes et la note perso importes', () => {
    const result = parsePuzzleCsv('Moves,Themes,PersonalNote\ne2e4,"Fork; fork ; Mate","  Note test  "');

    expect(result.errors).toEqual([]);
    expect(result.rows[0]).toEqual({
      fen: null,
      solution: ['e2e4'],
      themes: ['fork', 'mate'],
      rating: null,
      personalNote: 'Note test',
    });
  });

  it('signale les puzzles dupliques', () => {
    const result = parsePuzzleCsv(['Moves', 'e2e4', 'e2e4'].join('\n'));

    expect(result.rows).toHaveLength(1);
    expect(result.errors).toEqual(['Ligne 3 : Ce puzzle apparait plusieurs fois dans le fichier.']);
  });

  it('rejette un fichier sans colonne de coups', () => {
    const result = parsePuzzleCsv('Themes,Rating\nfork,1500');

    expect(result.rows).toEqual([]);
    expect(result.errors).toEqual(['Colonne obligatoire manquante : Moves ou solution.']);
  });

  it('signale les guillemets csv non fermes', () => {
    const result = parsePuzzleCsv('Moves,Themes\n"e2e4,fork');

    expect(result.rows).toEqual([]);
    expect(result.errors).toEqual(['Ligne 2 : guillemets CSV non fermes.']);
  });
});
