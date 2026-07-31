import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Chess, type Move } from 'chess.js';
import { Chessboard } from 'react-chessboard';

type PuzzleSolverProps = {
  fen?: string | null;
  onCompleted?: (result: PuzzleCompletionResult) => void;
  onFailed?: (result: PuzzleCompletionResult) => void;
  solution: string[];
};

export type PuzzleCompletionResult = {
  durationMilliseconds: number;
  mistakesCount: number;
  playedMoves: string[];
};

const maxMistakesBeforeFailure = 3;

type Feedback = {
  kind: 'info' | 'success' | 'error';
  message: string;
};

type SolverState = {
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

export function PuzzleSolver({ fen, onCompleted, onFailed, solution }: PuzzleSolverProps) {
  const initialFen = fen?.trim() || undefined;
  const normalizedSolution = useMemo(
    () => solution.map((move) => move.trim()).filter(Boolean),
    [solution],
  );
  const [solverState, setSolverState] = useState(() =>
    createInitialSolverState(initialFen, normalizedSolution),
  );
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [isSolutionVisible, setIsSolutionVisible] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const { game, currentFen, moveIndex, playedMoves, feedback, mistakesCount, startedAt, completedAt } =
    solverState;
  const boardOrientation = game.turn() === 'w' ? 'white' : 'black';
  const legalTargetSquares = selectedSquare ? getLegalTargetSquares(game, selectedSquare) : [];
  const squareStyles = getSquareStyles(selectedSquare, legalTargetSquares);
  const elapsedMilliseconds = (completedAt ?? now) - startedAt;

  useEffect(() => {
    if (completedAt) {
      return undefined;
    }

    const interval = window.setInterval(() => setNow(Date.now()), 1000);

    return () => window.clearInterval(interval);
  }, [completedAt]);

  function resetPuzzle() {
    setSelectedSquare(null);
    setIsSolutionVisible(false);
    setNow(Date.now());
    setSolverState(createInitialSolverState(initialFen, normalizedSolution));
  }

  function handlePieceDrop(sourceSquare: string, targetSquare: string | null): boolean {
    if (completedAt) {
      return false;
    }

    if (!targetSquare) {
      return false;
    }

    const expectedMove = normalizedSolution[moveIndex];

    if (!expectedMove) {
      setSolverState({
        ...solverState,
        feedback: {
          kind: 'success',
          message: '',
        },
      });

      return false;
    }

    const attemptedMove = `${sourceSquare}${targetSquare}`;

    if (!isExpectedMove(attemptedMove, expectedMove)) {
      const nextMistakesCount = mistakesCount + 1;
      const failedAt = nextMistakesCount >= maxMistakesBeforeFailure ? Date.now() : null;

      setSolverState({
        ...solverState,
        mistakesCount: nextMistakesCount,
        completedAt: failedAt,
        feedback: {
          kind: 'error',
          message: failedAt
            ? 'Tentative échouée. Tu peux recommencer.'
            : 'Mauvais coup. Continue à chercher.',
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
        feedback: {
          kind: 'error',
          message: "Le coup attendu n'est pas légal depuis cette position.",
        },
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
          feedback: {
            kind: 'error',
            message: "La réponse automatique n'est pas légale depuis cette position.",
          },
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
      feedback: isCompleted
        ? {
            kind: 'success',
            message: '',
          }
        : {
            kind: 'info',
            message: 'Bon coup. Trouve la suite.',
          },
    });

    if (isCompleted) {
      onCompleted?.({
        durationMilliseconds,
        mistakesCount,
        playedMoves: nextPlayedMoves,
      });
    }

    setSelectedSquare(null);
    return true;
  }

  function handleSquareClick(square: string): void {
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

  return (
    <div className="solver-panel">
      <div className="solver-board-shell">
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
            canDragPiece: ({ piece }) => piece.pieceType[0] === game.turn(),
            onPieceDrop: ({ sourceSquare, targetSquare }) =>
              handlePieceDrop(sourceSquare, targetSquare),
            onSquareClick: ({ square }) => handleSquareClick(square),
            boardStyle: {
              aspectRatio: '1 / 1',
              border: '1px solid rgba(238, 244, 251, 0.18)',
              borderRadius: '14px',
              boxShadow: '0 18px 44px rgba(0, 0, 0, 0.32)',
              height: 'auto',
              width: '100%',
            },
            darkSquareStyle: { backgroundColor: '#7fa35b' },
            lightSquareStyle: { backgroundColor: '#eeeed2' },
            dropSquareStyle: { boxShadow: 'inset 0 0 0 4px rgba(69, 200, 120, 0.55)' },
            draggingPieceStyle: {
              cursor: 'grabbing',
              filter: 'drop-shadow(0 10px 12px rgba(0, 0, 0, 0.34))',
            },
            squareStyles,
          }}
        />
      </div>

      <div className="solver-info">
        <div className="solver-compact-stats">
          <div className="solver-stat-card">
            <span>Progression</span>
            <strong>
              {Math.min(moveIndex, normalizedSolution.length)} / {normalizedSolution.length}
            </strong>
          </div>
          <div className="solver-stat-card">
            <span>Temps</span>
            <strong>{formatDuration(elapsedMilliseconds)}</strong>
          </div>
          <div className="solver-stat-card">
            <span>Erreurs</span>
            <strong>{mistakesCount}</strong>
          </div>
        </div>

        {feedback.message && (
          <p className={`solver-feedback solver-feedback-${feedback.kind}`}>{feedback.message}</p>
        )}

        {isSolutionVisible ? (
          <div className="solver-solution-card">
            <span>Solution</span>
            <strong>{formatSolutionForDisplay(initialFen, normalizedSolution)}</strong>
          </div>
        ) : (
          <button
            className="solver-reveal-button"
            type="button"
            onClick={() => setIsSolutionVisible(true)}
          >
            Voir la solution
          </button>
        )}

        <button className="small-button" type="button" onClick={resetPuzzle}>
          Recommencer
        </button>
      </div>
    </div>
  );
}

function createInitialSolverState(fen: string | undefined, solution: string[]): SolverState {
  const game = createGame(fen);
  const playedMoves: string[] = [];
  let moveIndex = 0;
  let feedback: Feedback = {
    kind: 'info',
    message: 'Trouve le meilleur coup.',
  };

  if (solution.length > 1) {
    const firstMove = playMove(game, solution[0]);

    if (firstMove) {
      playedMoves.push(moveToUci(firstMove));
      moveIndex = 1;
      feedback = {
        kind: 'info',
        message: 'Le premier coup Lichess a été joué. À toi de trouver la suite.',
      };
    } else {
      feedback = {
        kind: 'error',
        message: "Le premier coup Lichess n'est pas légal depuis cette FEN.",
      };
    }
  }

  return {
    game,
    currentFen: game.fen(),
    moveIndex,
    playedMoves,
    feedback,
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

function getSquareStyles(
  selectedSquare: string | null,
  legalTargetSquares: string[],
): Record<string, CSSProperties> {
  const styles: Record<string, CSSProperties> = {};

  if (selectedSquare) {
    styles[selectedSquare] = {
      background:
        'radial-gradient(circle, rgba(255, 221, 92, 0.72) 0%, rgba(255, 221, 92, 0.34) 55%, transparent 56%)',
    };
  }

  for (const square of legalTargetSquares) {
    styles[square] = {
      background:
        'radial-gradient(circle, rgba(19, 28, 39, 0.34) 0%, rgba(19, 28, 39, 0.34) 18%, transparent 20%)',
    };
  }

  return styles;
}

function formatSolutionForDisplay(fen: string | undefined, solution: string[]): string {
  if (solution.length === 0) {
    return 'Aucune solution';
  }

  const game = createGame(fen);
  const sanMoves: string[] = [];

  for (const uciMove of solution) {
    const move = playMove(game, uciMove);

    if (!move) {
      return solution.join('  ');
    }

    sanMoves.push(move.san);
  }

  return sanMoves.join('  ');
}

function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function isExpectedMove(attemptedMove: string, expectedMove: string): boolean {
  return expectedMove.toLowerCase().startsWith(attemptedMove.toLowerCase());
}

function playMove(game: Chess, uciMove: string): Move | null {
  const from = uciMove.slice(0, 2);
  const to = uciMove.slice(2, 4);
  const promotion = uciMove.slice(4, 5) || undefined;

  return game.move({
    from,
    to,
    promotion,
  });
}

function moveToUci(move: Move): string {
  return `${move.from}${move.to}${move.promotion ?? ''}`;
}
