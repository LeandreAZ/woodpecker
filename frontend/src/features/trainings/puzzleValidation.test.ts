import { describe, expect, it } from 'vitest';
import {
  normalizePersonalNote,
  normalizeThemes,
  parseOptionalRating,
  validatePuzzleInput,
} from './puzzleValidation';

describe('puzzleValidation', () => {
  it('normalise la solution, la FEN et les themes optionnels', () => {
    const result = validatePuzzleInput({
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      solution: [' E2E4 ', 'e7e5', ' g1f3 '],
      themes: [' Fork ', 'fork', 'mate; tactic '],
    });

    expect(result).toEqual({
      normalizedFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      normalizedPersonalNote: null,
      normalizedSolution: ['e2e4', 'e7e5', 'g1f3'],
      normalizedThemes: ['fork', 'mate', 'tactic'],
    });
  });

  it('refuse un coup UCI invalide', () => {
    expect(() =>
      validatePuzzleInput({
        fen: null,
        solution: ['oops'],
      }),
    ).toThrow("n'est pas au format UCI valide");
  });

  it('refuse une promotion impossible', () => {
    expect(() =>
      validatePuzzleInput({
        fen: null,
        solution: ['e2e4q'],
      }),
    ).toThrow('promotion invalide');
  });

  it('borne la note perso', () => {
    expect(normalizePersonalNote('  note utile  ')).toBe('note utile');
    expect(() => normalizePersonalNote('a'.repeat(501))).toThrow('500 caracteres');
  });

  it('parse le rating optionnel', () => {
    expect(parseOptionalRating('')).toBeNull();
    expect(parseOptionalRating('1450')).toBe(1450);
    expect(() => parseOptionalRating('1450.5')).toThrow('entier positif');
  });

  it('dedoublonne les themes sans garder les vides', () => {
    expect(normalizeThemes(['fork', ' fork ', 'mate;fork', ''])).toEqual(['fork', 'mate']);
  });
});
