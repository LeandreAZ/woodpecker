import { describe, expect, it } from 'vitest';
import { parseOptionalRating, validatePuzzleInput } from './puzzleValidation';

describe('puzzleValidation', () => {
  it('normalise la solution et la FEN optionnelle', () => {
    const result = validatePuzzleInput({
      fen: '   ',
      solution: [' E2E4 ', 'e7e5', ' g1f3 '],
    });

    expect(result).toEqual({
      normalizedFen: null,
      normalizedSolution: ['e2e4', 'e7e5', 'g1f3'],
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

  it('parse le rating optionnel', () => {
    expect(parseOptionalRating('')).toBeNull();
    expect(parseOptionalRating('1450')).toBe(1450);
    expect(() => parseOptionalRating('1450.5')).toThrow('entier positif');
  });
});
