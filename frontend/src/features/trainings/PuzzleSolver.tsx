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

type SolverState = {
  game: Chess;
  currentFen: string;
  moveIndex: number;
  playedMoves: string[];
  feedback: Feedback;
};

export function PuzzleSolver({ fen, solution }: PuzzleSolverProps) {
  const initialFen = fen?.trim() || undefined;
  const normalizedSolution = useMemo(
    () => solution.map((move) => move.trim()).filter(Boolean),
    [solution],
  );
  const [solverState, setSolverState] = useState(() =>
    createInitialSolverState(initialFen, normalizedSolution),
  );

  const { game, currentFen, moveIndex, playedMoves, feedback } = solverState;
  const boardOrientation = game.turn() === 'w' ? 'white' : 'black';

  function resetPuzzle() {
    setSolverState(createInitialSolverState(initialFen, normalizedSolution));
  }

  function handlePieceDrop(sourceSquare: string, targetSquare: string | null): boolean {
    if (!targetSquare) {
      return false;
    }

    const expectedMove = normalizedSolution[moveIndex];

    if (!expectedMove) {
      setSolverState({
        ...solverState,
        feedback: {
          kind: 'success',
          message: 'Puzzle déjà terminé.',
        },
      });

      return false;
    }

    const attemptedMove = `${sourceSquare}${targetSquare}`;

    if (!isExpectedMove(attemptedMove, expectedMove)) {
      setSolverState({
        ...solverState,
        feedback: {
          kind: 'error',
          message: `Mauvais coup. Coup attendu : ${expectedMove}.`,
        },
      });

      return false;
    }

    const playerMove = playMove(game, expectedMove);

    if (!playerMove) {
      setSolverState({
        ...solverState,
        feedback: {
          kind: 'error',
          message: `Le coup ${expectedMove} n'est pas légal depuis cette position.`,
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
          game,
          currentFen: game.fen(),
          moveIndex: nextMoveIndex,
          playedMoves: nextPlayedMoves,
          feedback: {
            kind: 'error',
            message: `La réponse ${normalizedSolution[nextMoveIndex]} n'est pas légale depuis cette position.`,
          },
        });

        return true;
      }

      nextPlayedMoves.push(moveToUci(replyMove));
      nextMoveIndex += 1;
    }

    setSolverState({
      game,
      currentFen: game.fen(),
      moveIndex: nextMoveIndex,
      playedMoves: nextPlayedMoves,
      feedback:
        nextMoveIndex >= normalizedSolution.length
          ? {
              kind: 'success',
              message: 'Puzzle terminé. Bien joué !',
            }
          : {
              kind: 'info',
              message: `Bon coup. Prochain coup : ${normalizedSolution[nextMoveIndex]}.`,
            },
    });

    return true;
  }

  return (
    <div className="solver-panel">
      <div className="solver-board">
        <Chessboard
          options={{
            id: 'woodpecker-solver-board',
            position: currentFen,
            boardOrientation,
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
        <div className="solver-stat-card">
          <span>Progression</span>
          <strong>
            {Math.min(moveIndex, normalizedSolution.length)} / {normalizedSolution.length}
          </strong>
        </div>

        <p className={`solver-feedback solver-feedback-${feedback.kind}`}>{feedback.message}</p>

        <div className="solver-meta-card">
          <span>Format Lichess</span>
          <p>
            La FEN est avant le premier coup. Le premier coup de Moves est joué automatiquement.
          </p>
        </div>

        <div className="solver-meta-card">
          <span>Moves</span>
          <p>{normalizedSolution.join(' ')}</p>
        </div>

        {playedMoves.length > 0 && (
          <div className="solver-meta-card">
            <span>Historique</span>
            <p>{playedMoves.join(' ')}</p>
          </div>
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
    message: 'Joue le prochain coup de la ligne Moves Lichess.',
  };

  if (solution.length > 0) {
    const firstMove = playMove(game, solution[0]);

    if (firstMove) {
      playedMoves.push(moveToUci(firstMove));
      moveIndex = 1;
      feedback =
        solution.length > 1
          ? {
              kind: 'info',
              message: `Premier coup Lichess joué automatiquement. À toi : ${solution[1]}.`,
            }
          : {
              kind: 'success',
              message: 'Puzzle terminé après le premier coup Lichess.',
            };
    } else {
      feedback = {
        kind: 'error',
        message: `Le premier coup Lichess ${solution[0]} n'est pas légal depuis cette FEN.`,
      };
    }
  }

  return {
    game,
    currentFen: game.fen(),
    moveIndex,
    playedMoves,
    feedback,
  };
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
