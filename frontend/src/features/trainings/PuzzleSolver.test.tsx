import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { PuzzleSolver } from './PuzzleSolver';

vi.mock('react-chessboard', () => ({
  Chessboard: ({
    options,
  }: {
    options: {
      boardOrientation?: string;
      onPieceDrop: (args: { sourceSquare: string; targetSquare: string }) => boolean;
    };
  }) => (
    <div>
      <div data-testid="board-orientation">{options.boardOrientation}</div>
      <button type="button" onClick={() => options.onPieceDrop({ sourceSquare: 'a2', targetSquare: 'a3' })}>
        Jouer erreur A
      </button>
      <button type="button" onClick={() => options.onPieceDrop({ sourceSquare: 'b2', targetSquare: 'b3' })}>
        Jouer erreur B
      </button>
      <button type="button" onClick={() => options.onPieceDrop({ sourceSquare: 'e2', targetSquare: 'e4' })}>
        Jouer coup juste
      </button>
    </div>
  ),
}));

describe('PuzzleSolver', () => {
  it('declenche le premier echec une seule fois puis reinitialise l etat de la tentative', () => {
    const onFirstMistake = vi.fn();
    const onStateChange = vi.fn();

    render(<PuzzleSolver onFirstMistake={onFirstMistake} onStateChange={onStateChange} solution={['e2e4']} />);

    fireEvent.click(screen.getByRole('button', { name: 'Jouer erreur A' }));
    fireEvent.click(screen.getByRole('button', { name: 'Jouer erreur B' }));

    expect(onFirstMistake).toHaveBeenCalledTimes(1);
    expect(onStateChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        completed: false,
        evaluationFailed: true,
        mistakesCount: 0,
        playedMoves: [],
        resolved: false,
      }),
    );
  });

  it('enregistre une tentative ratee puis une nouvelle tentative reussie', () => {
    const onCompleted = vi.fn();
    const onFailed = vi.fn();

    render(<PuzzleSolver onCompleted={onCompleted} onFailed={onFailed} solution={['e2e4']} />);

    fireEvent.click(screen.getByRole('button', { name: 'Jouer erreur A' }));
    fireEvent.click(screen.getByRole('button', { name: 'Jouer coup juste' }));

    expect(onFailed).toHaveBeenCalledTimes(1);
    expect(onFailed).toHaveBeenCalledWith({
      mistakesCount: 1,
      playedMoves: ['a2a3'],
    });
    expect(onCompleted).toHaveBeenCalledTimes(1);
    expect(onCompleted).toHaveBeenCalledWith({
      mistakesCount: 0,
      playedMoves: ['e2e4'],
    });
  });


  it('ne boucle pas quand le parent rerend avec une solution equivalente apres un coup joue', () => {
    function Harness() {
      const [lastSnapshotMessage, setLastSnapshotMessage] = useState('aucun');

      return (
        <>
          <div data-testid="snapshot-message">{lastSnapshotMessage}</div>
          <PuzzleSolver
            onStateChange={(snapshot) => setLastSnapshotMessage(snapshot.feedback.message)}
            solution={['e2e4']}
          />
        </>
      );
    }

    render(<Harness />);

    expect(screen.getByTestId('snapshot-message')).toHaveTextContent('Trouvez le meilleur coup.');

    fireEvent.click(screen.getByRole('button', { name: 'Jouer coup juste' }));

    expect(screen.getByTestId('snapshot-message')).toHaveTextContent('Bravo, solution trouvée du premier coup.');
    expect(screen.getByText('Jouer coup juste')).toBeInTheDocument();
  });

  it('garde l orientation initiale issue du fen', () => {
    render(<PuzzleSolver fen="4k3/8/8/8/8/8/8/4K3 b - - 0 1" solution={['e2e4']} />);

    expect(screen.getByTestId('board-orientation')).toHaveTextContent('black');
  });
});
