import { describe, expect, it } from 'vitest';
import { parsePuzzleCsv } from './csvImport';

describe('parsePuzzleCsv', () => {
  it('supporte les en-tetes separes par des points-virgules', () => {
    const result = parsePuzzleCsv(['Moves;Themes;Rating', 'e2e4;fork;1500'].join('\n'));

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
    const result = parsePuzzleCsv([
      'Moves,Themes,PersonalNote',
      'e2e4,"Fork; fork ; Mate","  Note test  "',
    ].join('\n'));

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
    const result = parsePuzzleCsv(['Themes,Rating', 'fork,1500'].join('\n'));

    expect(result.rows).toEqual([]);
    expect(result.errors).toEqual(['Colonne obligatoire manquante : Moves ou solution.']);
  });

  it('signale les guillemets csv non fermes', () => {
    const result = parsePuzzleCsv(['Moves,Themes', '"e2e4,fork'].join('\n'));

    expect(result.rows).toEqual([]);
    expect(result.errors).toEqual(['Ligne 2 : guillemets CSV non fermes.']);
  });

  it('rejette un fichier vide', () => {
    const result = parsePuzzleCsv(['   ', ''].join('\n'));

    expect(result.rows).toEqual([]);
    expect(result.errors).toEqual(['Le fichier CSV est vide.']);
  });

  it('signale les colonnes inconnues et dupliquees', () => {
    const result = parsePuzzleCsv(['Moves,Moves,Unknown', 'e2e4,e2e4,value'].join('\n'));

    expect(result.rows).toEqual([]);
    expect(result.errors).toEqual([
      'Colonne dupliquee : moves',
      'Colonne inconnue : unknown',
    ]);
  });

  it('signale un nombre de colonnes incoherent sur une ligne', () => {
    const result = parsePuzzleCsv(['Moves,Themes', 'e2e4'].join('\n'));

    expect(result.rows).toEqual([]);
    expect(result.errors).toEqual(['Ligne 2 : nombre de colonnes invalide (1 au lieu de 2).']);
  });

  it('conserve les separateurs proteges par des guillemets dans une cellule', () => {
    const result = parsePuzzleCsv(['Moves,PersonalNote', 'e2e4,"Plan, motif; idee"'].join('\n'));

    expect(result.errors).toEqual([]);
    expect(result.rows[0]).toEqual({
      fen: null,
      solution: ['e2e4'],
      themes: [],
      rating: null,
      personalNote: 'Plan, motif; idee',
    });
  });
});
