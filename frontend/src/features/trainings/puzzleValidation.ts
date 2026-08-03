import { Chess } from 'chess.js';

type PuzzleValidationInput = {
  fen?: string | null;
  solution: string[];
};

type PuzzleValidationResult = {
  normalizedFen: string | null;
  normalizedSolution: string[];
};

const uciMovePattern = /^[a-h][1-8][a-h][1-8][qrbn]?$/i;

export function validatePuzzleInput(input: PuzzleValidationInput): PuzzleValidationResult {
  const normalizedFen = normalizeOptionalText(input.fen);
  const normalizedSolution = input.solution.map((move) => move.trim().toLowerCase()).filter(Boolean);

  if (normalizedSolution.length === 0) {
    throw new Error('Ajoute au moins un coup dans Moves.');
  }

  validateFen(normalizedFen);
  validateUciSequence(normalizedFen, normalizedSolution);

  return {
    normalizedFen,
    normalizedSolution,
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

function createGame(fen: string | null): Chess {
  return fen ? new Chess(fen) : new Chess();
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalizedValue = value?.trim() ?? '';

  return normalizedValue.length > 0 ? normalizedValue : null;
}
