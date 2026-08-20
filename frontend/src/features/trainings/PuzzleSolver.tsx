import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Chess, type Move } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import './puzzle-solver.css';

type PuzzleSolverProps = {
  fen?: string | null;
  mistakeLimit: number;
  onCompleted?: (result: PuzzleCompletionResult) => void;
  onFailed?: (result: PuzzleCompletionResult) => void;
  solution: string[];
};

export type PuzzleCompletionResult = {
  durationMilliseconds: number;
  mistakesCount: number;
  playedMoves: string[];
};

type Feedback = {
  kind: 'info' | 'success' | 'error';
  message: string;
};

type SolverState = {
  countedMistakeKeys: Set<string>;
  game: Chess;
  currentFen: string;
  moveIndex: number;
  playedMoves: string[];
  feedback: Feedback;
  mistakesCount: number;
  startedAt: number;
  completedAt: number | null;
};

type ChessSquare = Parameters<Chess['get']>[0];

function PuzzleSolver({ fen, mistakeLimit, onCompleted, onFailed, solution }: PuzzleSolverProps) {
  const initialFen = fen?.trim() || undefined;
  const normalizedSolution = useMemo(() => solution.map((move) => move.trim()).filter(Boolean), [solution]);
  const [solverState, setSolverState] = useState(() => createInitialSolverState(initialFen));
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [rightClickMarkers, setRightClickMarkers] = useState<Record<string, CSSProperties>>({});

  const { countedMistakeKeys, game, currentFen, moveIndex, playedMoves, feedback, mistakesCount, startedAt, completedAt } = solverState;
  const boardOrientation = game.turn() === 'w' ? 'white' : 'black';
  const legalTargetSquares = selectedSquare ? getLegalTargetSquares(game, selectedSquare) : [];
  const squareStyles = getSquareStyles(selectedSquare, legalTargetSquares, rightClickMarkers);
  const boardFeedbackClassName = ['wp-puzzle-solver-v2__board', feedback.kind === 'success' ? 'is-success' : '', feedback.kind === 'error' ? 'is-error' : '']
    .filter(Boolean)
    .join(' ');

  useEffect(() => {
    setSelectedSquare(null);
    setRightClickMarkers({});
    setSolverState(createInitialSolverState(initialFen));
  }, [initialFen, normalizedSolution]);

  function handlePieceDrop(sourceSquare: string, targetSquare: string | null): boolean {
    if (completedAt || !targetSquare) {
      return false;
    }

    const expectedMove = normalizedSolution[moveIndex];
    if (!expectedMove) {
      setSolverState({
        ...solverState,
        feedback: { kind: 'success', message: 'Séquence complétée.' },
      });
      return false;
    }

    const attemptedMove = sourceSquare + targetSquare;

    if (!isExpectedMove(attemptedMove, expectedMove)) {
      const mistakeKey = String(moveIndex) + ':' + attemptedMove.toLowerCase();
      if (countedMistakeKeys.has(mistakeKey)) {
        setSolverState({
          ...solverState,
          feedback: { kind: 'info', message: 'Cette erreur a déjà été comptée. Essayez une autre idée.' },
        });
        return false;
      }

      const nextCountedMistakeKeys = new Set(countedMistakeKeys);
      nextCountedMistakeKeys.add(mistakeKey);
      const nextMistakesCount = mistakesCount + 1;
      const failedAt = nextMistakesCount >= mistakeLimit ? Date.now() : null;

      setSolverState({
        ...solverState,
        countedMistakeKeys: nextCountedMistakeKeys,
        mistakesCount: nextMistakesCount,
        completedAt: failedAt,
        feedback: {
          kind: 'error',
          message: failedAt ? 'Tentative échouée. Revenez au puzzle suivant.' : 'Mauvais coup. Continuez à chercher.',
        },
      });

      if (failedAt) {
        onFailed?.({
          durationMilliseconds: failedAt - startedAt,
          mistakesCount: nextMistakesCount,
          playedMoves,
        });
      }

      return false;
    }

    const playerMove = playMove(game, expectedMove);
    if (!playerMove) {
      setSolverState({
        ...solverState,
        mistakesCount: mistakesCount + 1,
        feedback: { kind: 'error', message: 'Le coup attendu n’est pas légal depuis cette position.' },
      });
      return false;
    }

    const nextPlayedMoves = [...playedMoves, moveToUci(playerMove)];
    let nextMoveIndex = moveIndex + 1;

    if (nextMoveIndex < normalizedSolution.length) {
      const replyMove = playMove(game, normalizedSolution[nextMoveIndex]);
      if (!replyMove) {
        setSolverState({
          ...solverState,
          game,
          currentFen: game.fen(),
          moveIndex: nextMoveIndex,
          playedMoves: nextPlayedMoves,
          feedback: { kind: 'error', message: 'La réponse automatique n’est pas légale depuis cette position.' },
        });
        setSelectedSquare(null);
        return true;
      }

      nextPlayedMoves.push(moveToUci(replyMove));
      nextMoveIndex += 1;
    }

    const isCompleted = nextMoveIndex >= normalizedSolution.length;
    const finishedAt = isCompleted ? Date.now() : null;
    const durationMilliseconds = (finishedAt ?? Date.now()) - startedAt;

    setSolverState({
      ...solverState,
      game,
      currentFen: game.fen(),
      moveIndex: nextMoveIndex,
      playedMoves: nextPlayedMoves,
      completedAt: finishedAt,
      feedback: isCompleted ? { kind: 'success', message: 'Bravo, solution trouvée.' } : { kind: 'info', message: 'Bon coup. Trouvez la suite.' },
    });

    if (isCompleted) {
      onCompleted?.({ durationMilliseconds, mistakesCount, playedMoves: nextPlayedMoves });
    }

    setSelectedSquare(null);
    setRightClickMarkers({});
    return true;
  }

  function handleSquareClick(square: string) {
    if (!selectedSquare) {
      const piece = game.get(square as ChessSquare);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
      }
      return;
    }

    if (selectedSquare === square) {
      setSelectedSquare(null);
      return;
    }

    const moved = handlePieceDrop(selectedSquare, square);
    if (!moved) {
      const piece = game.get(square as ChessSquare);
      setSelectedSquare(piece && piece.color === game.turn() ? square : null);
    }
  }

  function handleSquareRightClick(square: string) {
    setRightClickMarkers((current) => {
      const next = { ...current };
      if (next[square]) {
        delete next[square];
      } else {
        next[square] = {
          backgroundColor: 'rgba(232, 70, 70, 0.34)',
          boxShadow: 'inset 0 0 0 3px rgba(232, 70, 70, 0.78)',
        };
      }
      return next;
    });
  }

  return (
    <div className="wp-puzzle-solver-v2">
      <div className={boardFeedbackClassName}>
        <Chessboard
          options={{
            id: 'woodpecker-solver-board',
            position: currentFen,
            boardOrientation,
            allowDragging: true,
            allowDrawingArrows: true,
            showAnimations: true,
            showNotation: true,
            animationDurationInMs: 180,
            canDragPiece: (...args) => canDragCurrentTurnPiece(args[0], game),
            onPieceDrop: (...args) => {
              const { sourceSquare, targetSquare } = normalizeDropArgs(args[0], args[1]);
              return handlePieceDrop(sourceSquare, targetSquare);
            },
            onSquareClick: (...args) => {
              const square = normalizeSquareArg(args[0]);
              if (square) {
                handleSquareClick(square);
              }
            },
            onSquareRightClick: (...args) => {
              const square = normalizeSquareArg(args[0]);
              if (square) {
                handleSquareRightClick(square);
              }
            },
            boardStyle: {
              aspectRatio: '1 / 1',
              border: '1px solid rgba(238, 244, 251, 0.16)',
              borderRadius: '12px',
              boxShadow: '0 22px 52px rgba(0, 0, 0, 0.36)',
              height: 'auto',
              width: '100%',
              touchAction: 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none',
            },
            darkSquareStyle: { backgroundColor: '#7f9f56' },
            lightSquareStyle: { backgroundColor: '#f0e6c8' },
            dropSquareStyle: { boxShadow: 'inset 0 0 0 4px rgba(131, 228, 133, 0.52)' },
            draggingPieceStyle: { cursor: 'grabbing', filter: 'drop-shadow(0 10px 12px rgba(0, 0, 0, 0.34))' },
            squareStyles,
          }}
        />
      </div>
    </div>
  );
}

function createInitialSolverState(fen: string | undefined): SolverState {
  const game = createGame(fen);

  return {
    countedMistakeKeys: new Set(),
    game,
    currentFen: game.fen(),
    moveIndex: 0,
    playedMoves: [],
    feedback: { kind: 'info', message: 'Trouvez le meilleur coup.' },
    mistakesCount: 0,
    startedAt: Date.now(),
    completedAt: null,
  };
}

function createGame(fen: string | undefined): Chess {
  try {
    return fen ? new Chess(fen) : new Chess();
  } catch {
    return new Chess();
  }
}

function getLegalTargetSquares(game: Chess, square: string): string[] {
  return game.moves({ square: square as ChessSquare, verbose: true }).map((move) => move.to);
}

function normalizeSquareArg(arg: unknown): string | null {
  if (typeof arg === 'string') {
    return arg;
  }

  if (arg && typeof arg === 'object' && 'square' in arg && typeof (arg as { square?: unknown }).square === 'string') {
    return (arg as { square: string }).square;
  }

  return null;
}

function normalizeDropArgs(firstArg: unknown, secondArg: unknown): { sourceSquare: string; targetSquare: string | null } {
  if (typeof firstArg === 'string') {
    return {
      sourceSquare: firstArg,
      targetSquare: typeof secondArg === 'string' ? secondArg : null,
    };
  }

  if (firstArg && typeof firstArg === 'object') {
    const data = firstArg as { sourceSquare?: unknown; targetSquare?: unknown };
    return {
      sourceSquare: typeof data.sourceSquare === 'string' ? data.sourceSquare : '',
      targetSquare: typeof data.targetSquare === 'string' ? data.targetSquare : null,
    };
  }

  return { sourceSquare: '', targetSquare: null };
}

function canDragCurrentTurnPiece(arg: unknown, game: Chess): boolean {
  if (typeof arg === 'string') {
    return arg[0] === game.turn();
  }

  if (arg && typeof arg === 'object' && 'piece' in arg) {
    const piece = (arg as { piece?: unknown }).piece;
    if (piece && typeof piece === 'object' && 'pieceType' in piece && typeof (piece as { pieceType?: unknown }).pieceType === 'string') {
      return ((piece as { pieceType: string }).pieceType[0]) === game.turn();
    }

    if (typeof piece === 'string') {
      return piece[0] === game.turn();
    }
  }

  return true;
}

function getSquareStyles(selectedSquare: string | null, legalTargetSquares: string[], rightClickMarkers: Record<string, CSSProperties>): Record<string, CSSProperties> {
  const styles: Record<string, CSSProperties> = { ...rightClickMarkers };

  if (selectedSquare) {
    styles[selectedSquare] = {
      ...styles[selectedSquare],
      background: 'radial-gradient(circle, rgba(255, 213, 92, 0.72) 0%, rgba(255, 213, 92, 0.34) 55%, transparent 56%)',
    };
  }

  for (const square of legalTargetSquares) {
    styles[square] = {
      ...styles[square],
      background: 'radial-gradient(circle, rgba(20, 31, 44, 0.34) 0%, rgba(20, 31, 44, 0.34) 18%, transparent 20%)',
    };
  }

  return styles;
}

function isExpectedMove(attemptedMove: string, expectedMove: string): boolean {
  return expectedMove.toLowerCase().startsWith(attemptedMove.toLowerCase());
}

function playMove(game: Chess, uciMove: string): Move | null {
  const from = uciMove.slice(0, 2);
  const to = uciMove.slice(2, 4);
  const promotion = uciMove.slice(4, 5) || undefined;

  try {
    return game.move({ from, to, promotion });
  } catch {
    return null;
  }
}

function moveToUci(move: Move): string {
  return move.from + move.to + (move.promotion ?? '');
}

export { PuzzleSolver };
export default PuzzleSolver;
