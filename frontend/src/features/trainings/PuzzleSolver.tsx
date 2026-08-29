import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Chess, type Move } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import {
  DEFAULT_DARK_SQUARE_COLOR,
  DEFAULT_LIGHT_SQUARE_COLOR,
  buildDropSquareStyle,
  buildSelectedSquareStyles,
  type BoardColorPalette,
} from './chessboardPreferences';
import './puzzle-solver.css';

type PuzzleSolverProps = {
  animateMoves?: boolean;
  darkSquareColor?: string;
  fen?: string | null;
  initialEvaluationFailed?: boolean;
  lightSquareColor?: string;
  onCompleted?: (result: PuzzleCompletionResult) => void;
  onFailed?: (result: PuzzleCompletionResult) => void;
  onFirstMistake?: (result: PuzzleCompletionResult) => void;
  onStateChange?: (snapshot: PuzzleSolverSnapshot) => void;
  showCoordinates?: boolean;
  showLegalMoves?: boolean;
  showRightClickTargets?: boolean;
  solution: string[];
};

export type PuzzleCompletionResult = {
  mistakesCount: number;
  playedMoves: string[];
};

export type PuzzleSolverSnapshot = {
  completed: boolean;
  evaluationFailed: boolean;
  feedback: Feedback;
  mistakesCount: number;
  playedMoves: string[];
  resolved: boolean;
};

type Feedback = {
  kind: 'info' | 'success' | 'error';
  message: string;
};

type SolverState = {
  completed: boolean;
  currentFen: string;
  evaluationFailed: boolean;
  feedback: Feedback;
  game: Chess;
  mistakesCount: number;
  moveIndex: number;
  playedMoves: string[];
};

type ChessSquare = Parameters<Chess['get']>[0];

export function PuzzleSolver({
  animateMoves = true,
  darkSquareColor = DEFAULT_DARK_SQUARE_COLOR,
  fen,
  initialEvaluationFailed = false,
  lightSquareColor = DEFAULT_LIGHT_SQUARE_COLOR,
  onCompleted,
  onFailed,
  onFirstMistake,
  onStateChange,
  showCoordinates = true,
  showLegalMoves = true,
  showRightClickTargets = true,
  solution,
}: PuzzleSolverProps) {
  const initialFen = fen?.trim() || undefined;
  const normalizedSolution = useMemo(() => solution.map((move) => move.trim()).filter(Boolean), [solution]);
  const boardPalette = useMemo<BoardColorPalette>(() => ({ darkSquareColor, lightSquareColor }), [darkSquareColor, lightSquareColor]);
  const initialOrientation = useMemo(() => {
    const game = createGame(initialFen);
    return game.turn() === 'w' ? 'white' : 'black';
  }, [initialFen]);
  const solutionKey = useMemo(() => normalizedSolution.join('|'), [normalizedSolution]);
  const [solverState, setSolverState] = useState(() => createInitialSolverState(initialFen, initialEvaluationFailed));
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [rightClickMarkers, setRightClickMarkers] = useState<Record<string, CSSProperties>>({});
  const lastReportedSnapshotRef = useRef<PuzzleSolverSnapshot | null>(null);
  const onStateChangeRef = useRef(onStateChange);

  const {
    completed,
    currentFen,
    evaluationFailed,
    feedback,
    game,
    mistakesCount,
    moveIndex,
    playedMoves,
  } = solverState;
  const legalTargetSquares = selectedSquare && showLegalMoves ? getLegalTargetSquares(game, selectedSquare) : [];
  const squareStyles = getSquareStyles(selectedSquare, legalTargetSquares, rightClickMarkers, boardPalette);
  const boardFeedbackClassName = [
    'wp-puzzle-solver-v2__board',
    feedback.kind === 'success' ? 'is-success' : '',
    feedback.kind === 'error' ? 'is-error' : '',
  ]
    .filter(Boolean)
    .join(' ');

  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  useEffect(() => {
    setSelectedSquare(null);
    setRightClickMarkers({});
    setSolverState(createInitialSolverState(initialFen, initialEvaluationFailed));
    lastReportedSnapshotRef.current = null;
  }, [initialEvaluationFailed, initialFen, solutionKey]);

  useEffect(() => {
    const nextSnapshot: PuzzleSolverSnapshot = {
      completed,
      evaluationFailed,
      feedback,
      mistakesCount,
      playedMoves,
      resolved: completed,
    };

    if (solverSnapshotsMatch(lastReportedSnapshotRef.current, nextSnapshot)) {
      return;
    }

    lastReportedSnapshotRef.current = nextSnapshot;
    onStateChangeRef.current?.(nextSnapshot);
  }, [completed, evaluationFailed, feedback, mistakesCount, playedMoves]);

  function handlePieceDrop(sourceSquare: string, targetSquare: string | null): boolean {
    if (completed || !sourceSquare || !targetSquare) {
      return false;
    }

    const expectedMove = normalizedSolution[moveIndex];
    if (!expectedMove) {
      setSolverState((current) => ({
        ...current,
        completed: true,
        feedback: { kind: 'success', message: 'Séquence complétée.' },
      }));
      return false;
    }

    const legalMove = getLegalMove(game, sourceSquare, targetSquare);
    if (!legalMove) {
      return false;
    }

    const attemptedMove = sourceSquare + targetSquare;

    if (!isExpectedMove(attemptedMove, expectedMove)) {
      const failureResult = {
        mistakesCount: mistakesCount + 1,
        playedMoves: [...playedMoves, attemptedMove],
      };
      const hadAlreadyFailed = evaluationFailed;

      setSolverState(createFailedSolverState(initialFen));
      onFailed?.(failureResult);

      if (!hadAlreadyFailed) {
        onFirstMistake?.(failureResult);
      }

      setSelectedSquare(null);
      setRightClickMarkers({});
      return false;
    }

    const nextGame = createGame(currentFen);
    const playerMove = playMove(nextGame, expectedMove);
    if (!playerMove) {
      setSolverState((current) => ({
        ...current,
        feedback: { kind: 'error', message: 'Le coup attendu n’est pas légal depuis cette position.' },
      }));
      return false;
    }

    const nextPlayedMoves = [...playedMoves, moveToUci(playerMove)];
    let nextMoveIndex = moveIndex + 1;

    if (nextMoveIndex < normalizedSolution.length) {
      const replyMove = playMove(nextGame, normalizedSolution[nextMoveIndex]);
      if (!replyMove) {
        setSolverState((current) => ({
          ...current,
          currentFen: nextGame.fen(),
          game: nextGame,
          moveIndex: nextMoveIndex,
          playedMoves: nextPlayedMoves,
          feedback: { kind: 'error', message: 'La réponse automatique n’est pas légale depuis cette position.' },
        }));
        setSelectedSquare(null);
        return true;
      }

      nextPlayedMoves.push(moveToUci(replyMove));
      nextMoveIndex += 1;
    }

    const isCompleted = nextMoveIndex >= normalizedSolution.length;
    const nextEvaluationFailed = evaluationFailed;

    setSolverState((current) => ({
      ...current,
      completed: isCompleted,
      currentFen: nextGame.fen(),
      game: nextGame,
      moveIndex: nextMoveIndex,
      playedMoves: nextPlayedMoves,
      feedback: isCompleted
        ? nextEvaluationFailed
          ? {
              kind: 'info',
              message: 'Solution trouvée. Le puzzle reste raté pour le cycle, mais il est maintenant figé.',
            }
          : { kind: 'success', message: 'Bravo, solution trouvée du premier coup.' }
        : { kind: 'info', message: 'Bon coup. Trouvez la suite.' },
    }));

    if (isCompleted) {
      onCompleted?.({
        mistakesCount,
        playedMoves: nextPlayedMoves,
      });
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
    if (!showRightClickTargets) {
      return;
    }

    setRightClickMarkers((current) => {
      const next = { ...current };
      if (next[square]) {
        delete next[square];
      } else {
        next[square] = {
          backgroundColor: 'rgba(239, 68, 68, 0.28)',
          boxShadow: 'inset 0 0 0 2px rgba(239, 68, 68, 0.82)',
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
            boardOrientation: initialOrientation,
            allowDragging: true,
            allowDrawingArrows: true,
            showAnimations: animateMoves,
            showNotation: showCoordinates,
            animationDurationInMs: 180,
            canDragPiece: (...args) => canDragCurrentTurnPiece(args[0], game),
            onPieceDrop: (...args) => {
              const { sourceSquare, targetSquare } = normalizeDropArgs(args[0], undefined);
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
              border: '1px solid rgba(238, 244, 251, 0.12)',
              borderRadius: '12px',
              boxShadow: '0 18px 42px rgba(0, 0, 0, 0.32)',
              height: 'auto',
              width: '100%',
              touchAction: 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none',
            },
            darkSquareStyle: { backgroundColor: darkSquareColor },
            lightSquareStyle: { backgroundColor: lightSquareColor },
            dropSquareStyle: buildDropSquareStyle(boardPalette),
            draggingPieceStyle: { cursor: 'grabbing', filter: 'drop-shadow(0 10px 12px rgba(0, 0, 0, 0.34))' },
            squareStyles,
          }}
        />
      </div>
    </div>
  );
}

function solverSnapshotsMatch(left: PuzzleSolverSnapshot | null, right: PuzzleSolverSnapshot) {
  return Boolean(
    left
    && left.completed === right.completed
    && left.evaluationFailed === right.evaluationFailed
    && left.feedback.kind === right.feedback.kind
    && left.feedback.message === right.feedback.message
    && left.mistakesCount === right.mistakesCount
    && left.resolved === right.resolved
    && left.playedMoves.length === right.playedMoves.length
    && left.playedMoves.every((move, index) => move === right.playedMoves[index]),
  );
}

function createInitialSolverState(fen: string | undefined, initialEvaluationFailed: boolean): SolverState {
  const game = createGame(fen);

  return {
    completed: false,
    currentFen: game.fen(),
    evaluationFailed: initialEvaluationFailed,
    feedback: initialEvaluationFailed
      ? {
          kind: 'info',
          message: 'Ce puzzle est déjà raté pour ce cycle. Continuez à chercher librement la solution.',
        }
      : { kind: 'info', message: 'Trouvez le meilleur coup.' },
    game,
    mistakesCount: 0,
    moveIndex: 0,
    playedMoves: [],
  };
}

function createFailedSolverState(fen: string | undefined): SolverState {
  const game = createGame(fen);

  return {
    completed: false,
    currentFen: game.fen(),
    evaluationFailed: true,
    feedback: {
      kind: 'error',
      message: 'Puzzle raté. Continuez à chercher mais les tentatives seront encore enregistrées.',
    },
    game,
    mistakesCount: 0,
    moveIndex: 0,
    playedMoves: [],
  };
}

function createGame(fen: string | undefined): Chess {
  try {
    return fen ? new Chess(fen) : new Chess();
  } catch {
    return new Chess();
  }
}

function getLegalMove(game: Chess, sourceSquare: string, targetSquare: string): Move | null {
  const legalMoves = game.moves({ square: sourceSquare as ChessSquare, verbose: true });
  return legalMoves.find((move) => move.to === targetSquare) ?? null;
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
      return (piece as { pieceType: string }).pieceType[0] === game.turn();
    }

    if (typeof piece === 'string') {
      return piece[0] === game.turn();
    }
  }

  return true;
}

function getSquareStyles(
  selectedSquare: string | null,
  legalTargetSquares: string[],
  rightClickMarkers: Record<string, CSSProperties>,
  palette: BoardColorPalette,
): Record<string, CSSProperties> {
  const styles: Record<string, CSSProperties> = { ...rightClickMarkers };

  if (selectedSquare) {
    styles[selectedSquare] = {
      ...styles[selectedSquare],
      ...buildSelectedSquareStyles(palette),
    };
  }

  for (const square of legalTargetSquares) {
    styles[square] = {
      ...styles[square],
      background:
        'radial-gradient(circle, rgba(20, 31, 44, 0.38) 0%, rgba(20, 31, 44, 0.38) 18%, transparent 20%)',
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

export default PuzzleSolver;
