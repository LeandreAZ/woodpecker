import { Chess } from 'chess.js';

type PuzzleValidationInput = {
  fen?: string | null;
  personalNote?: string | null;
  solution: string[];
  themes?: string[] | null;
};

type PuzzleValidationResult = {
  normalizedFen: string | null;
  normalizedPersonalNote: string | null;
  normalizedSolution: string[];
  normalizedThemes: string[];
};

const maxPersonalNoteLength = 500;
const uciMovePattern = /^[a-h][1-8][a-h][1-8][qrbn]?$/i;

export function validatePuzzleInput(input: PuzzleValidationInput): PuzzleValidationResult {
  const normalizedFen = normalizeFen(input.fen);
  const normalizedSolution = normalizeSolution(input.solution);

  if (normalizedSolution.length === 0) {
    throw new Error('Ajoute au moins un coup dans Moves.');
  }

  validateUciSequence(normalizedFen, normalizedSolution);

  return {
    normalizedFen,
    normalizedPersonalNote: normalizePersonalNote(input.personalNote),
    normalizedSolution,
    normalizedThemes: normalizeThemes(input.themes ?? []),
  };
}

export function parseOptionalRating(value: string): number | null {
  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    return null;
  }

  const rating = Number(normalizedValue);

  if (!Number.isInteger(rating) || rating <= 0) {
    throw new Error('Le rating doit etre un entier positif.');
  }

  return rating;
}

export function validateFen(fen: string | null): void {
  if (!fen) {
    return;
  }

  try {
    new Chess(fen);
  } catch {
    throw new Error('La FEN fournie est invalide.');
  }
}

export function validateUciSequence(fen: string | null, solution: string[]): void {
  const game = createGame(fen);

  solution.forEach((move, index) => {
    if (!uciMovePattern.test(move)) {
      throw new Error(`Le coup ${index + 1} (${move}) n'est pas au format UCI valide.`);
    }

    validatePromotionMove(move, index);

    const playedMove = game.move({
      from: move.slice(0, 2),
      to: move.slice(2, 4),
      promotion: move.slice(4, 5) || undefined,
    });

    if (!playedMove) {
      throw new Error(`Le coup ${index + 1} (${move}) n'est pas legal depuis la position courante.`);
    }
  });
}

export function normalizeThemes(themes: string[] | string): string[] {
  const sourceThemes = Array.isArray(themes) ? themes : [themes];
  const seenThemes = new Set<string>();
  const normalizedThemes: string[] = [];

  sourceThemes
    .flatMap((theme) => theme.split(/[;,]+/))
    .map((theme) => theme.trim().toLowerCase())
    .filter(Boolean)
    .forEach((theme) => {
      if (seenThemes.has(theme)) {
        return;
      }

      seenThemes.add(theme);
      normalizedThemes.push(theme);
    });

  return normalizedThemes;
}

export function normalizePersonalNote(value: string | null | undefined): string | null {
  const normalizedValue = value?.trim() ?? '';

  if (normalizedValue.length === 0) {
    return null;
  }

  if (normalizedValue.length > maxPersonalNoteLength) {
    throw new Error(`La note perso ne doit pas depasser ${maxPersonalNoteLength} caracteres.`);
  }

  return normalizedValue;
}

function createGame(fen: string | null): Chess {
  return fen ? new Chess(fen) : new Chess();
}

function normalizeFen(value: string | null | undefined): string | null {
  const normalizedValue = value?.trim() ?? '';

  if (normalizedValue.length === 0) {
    return null;
  }

  validateFen(normalizedValue);

  return new Chess(normalizedValue).fen();
}

function normalizeSolution(solution: string[]): string[] {
  return solution.map((move) => move.trim().toLowerCase()).filter(Boolean);
}

function validatePromotionMove(move: string, index: number): void {
  if (move.length !== 5) {
    return;
  }

  const fromRank = move[1];
  const toRank = move[3];
  const isValidPromotionPath = (fromRank === '7' && toRank === '8') || (fromRank === '2' && toRank === '1');

  if (!isValidPromotionPath) {
    throw new Error(`Le coup ${index + 1} (${move}) contient une promotion invalide.`);
  }
}
