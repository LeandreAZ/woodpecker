import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PuzzleSolver } from './PuzzleSolver';

vi.mock('react-chessboard', () => ({
  Chessboard: ({ options }: { options: { onPieceDrop: (args: { sourceSquare: string; targetSquare: string }) => boolean } }) => (
    <div>
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
  it('ne compte pas deux fois la meme erreur', () => {
    render(<PuzzleSolver mistakeLimit={3} solution={['e2e4']} />);

    expect(screen.getByText('0 / 3')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Jouer erreur A' }));
    expect(screen.getByText('1 / 3')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Jouer erreur A' }));
    expect(screen.getByText('1 / 3')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Jouer erreur B' }));
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('declenche la completion avec les coups joues', () => {
    const onCompleted = vi.fn();

    render(<PuzzleSolver mistakeLimit={2} onCompleted={onCompleted} solution={['e2e4']} />);

    fireEvent.click(screen.getByRole('button', { name: 'Jouer coup juste' }));

    expect(screen.getByText('1 / 1')).toBeInTheDocument();
    expect(onCompleted).toHaveBeenCalledTimes(1);
    expect(onCompleted).toHaveBeenCalledWith(
      expect.objectContaining({
        mistakesCount: 0,
        playedMoves: ['e2e4'],
      }),
    );
  });

  it('declenche un echec une seule fois quand la limite est atteinte', () => {
    const onFailed = vi.fn();

    render(<PuzzleSolver mistakeLimit={2} onFailed={onFailed} solution={['e2e4']} />);

    fireEvent.click(screen.getByRole('button', { name: 'Jouer erreur A' }));
    fireEvent.click(screen.getByRole('button', { name: 'Jouer erreur B' }));
    fireEvent.click(screen.getByRole('button', { name: 'Jouer coup juste' }));

    expect(screen.getByText('2 / 2')).toBeInTheDocument();
    expect(onFailed).toHaveBeenCalledTimes(1);
  });
});
