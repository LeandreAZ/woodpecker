import { useMemo, useState } from 'react';
import { Chess, type Move } from 'chess.js';
import { Chessboard } from 'react-chessboard';

type PuzzleSolverProps = {
  fen?: string | null;
  solution: string[];
};

type Feedback = {
  kind: 'info' | 'success' | 'error';
  message: string;
};

const defaultFeedback: Feedback = {
  kind: 'info',
  message: 'Play the next move from the solution.',
};

export function PuzzleSolver({ fen, solution }: PuzzleSolverProps) {
  const initialFen = fen?.trim() || undefined;
  const [game, setGame] = useState(() => createGame(initialFen));
  const [currentFen, setCurrentFen] = useState(() => game.fen());
  const [moveIndex, setMoveIndex] = useState(0);
  const [playedMoves, setPlayedMoves] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<Feedback>(defaultFeedback);

  const normalizedSolution = useMemo(
    () => solution.map((move) => move.trim()).filter(Boolean),
    [solution],
  );

  function resetPuzzle() {
    const nextGame = createGame(initialFen);
    setGame(nextGame);
    setCurrentFen(nextGame.fen());
    setMoveIndex(0);
    setPlayedMoves([]);
    setFeedback(defaultFeedback);
  }

  function handlePieceDrop(sourceSquare: string, targetSquare: string | null): boolean {
    if (!targetSquare) {
      return false;
    }

    const expectedMove = normalizedSolution[moveIndex];

    if (!expectedMove) {
      setFeedback({
        kind: 'success',
        message: 'Puzzle already solved.',
      });

      return false;
    }

    const attemptedMove = `${sourceSquare}${targetSquare}`;

    if (!isExpectedMove(attemptedMove, expectedMove)) {
      setFeedback({
        kind: 'error',
        message: `Wrong move. Expected ${expectedMove}.`,
      });

      return false;
    }

    const playerMove = playMove(game, expectedMove);

    if (!playerMove) {
      setFeedback({
        kind: 'error',
        message: `Move ${expectedMove} is not legal from this position.`,
      });

      return false;
    }

    const nextPlayedMoves = [...playedMoves, moveToUci(playerMove)];
    let nextMoveIndex = moveIndex + 1;

    while (nextMoveIndex < normalizedSolution.length) {
      const replyMove = playMove(game, normalizedSolution[nextMoveIndex]);

      if (!replyMove) {
        setPlayedMoves(nextPlayedMoves);
        setCurrentFen(game.fen());
        setMoveIndex(nextMoveIndex);
        setFeedback({
          kind: 'error',
          message: `Reply ${normalizedSolution[nextMoveIndex]} is not legal from this position.`,
        });

        return true;
      }

      nextPlayedMoves.push(moveToUci(replyMove));
      nextMoveIndex += 1;

      if (nextMoveIndex < normalizedSolution.length) {
        break;
      }
    }

    setPlayedMoves(nextPlayedMoves);
    setCurrentFen(game.fen());
    setMoveIndex(nextMoveIndex);
    setFeedback(
      nextMoveIndex >= normalizedSolution.length
        ? {
            kind: 'success',
            message: 'Puzzle solved.',
          }
        : {
            kind: 'info',
            message: `Good. Next move: ${normalizedSolution[nextMoveIndex]}.`,
          },
    );

    return true;
  }

  return (
    <div className="solver-panel">
      <div className="solver-board">
        <Chessboard
          options={{
            id: 'woodpecker-solver-board',
            position: currentFen,
            onPieceDrop: ({ sourceSquare, targetSquare }) =>
              handlePieceDrop(sourceSquare, targetSquare),
            boardStyle: {
              borderRadius: '12px',
              boxShadow: '0 18px 40px rgba(23, 33, 26, 0.16)',
            },
          }}
        />
      </div>

      <div className="solver-info">
        <p className={`solver-feedback solver-feedback-${feedback.kind}`}>{feedback.message}</p>
        <p className="muted">
          Progress: {Math.min(moveIndex, normalizedSolution.length)} / {normalizedSolution.length}{' '}
          moves
        </p>
        <p className="muted">Solution: {normalizedSolution.join(' ')}</p>
        {playedMoves.length > 0 && <p className="muted">Played: {playedMoves.join(' ')}</p>}
        <button className="small-button" type="button" onClick={resetPuzzle}>
          Reset puzzle
        </button>
      </div>
    </div>
  );
}

function createGame(fen: string | undefined): Chess {
  try {
    return fen ? new Chess(fen) : new Chess();
  } catch {
    return new Chess();
  }
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
