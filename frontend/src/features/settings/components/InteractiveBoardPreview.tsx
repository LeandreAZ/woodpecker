import { Chess } from 'chess.js';
import type { ComponentProps, CSSProperties } from 'react';
import { useMemo, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import {
  buildDropSquareStyle,
  buildSelectedSquareStyles,
  DEFAULT_BOARD_FEN,
  type BoardColorPalette
} from '../../solver/services/chessboardPreferences';

function InteractiveBoardPreviewBoard({ palette, showCoordinates, showLegalMoves }: { palette: BoardColorPalette; showCoordinates: boolean; showLegalMoves: boolean; }) {
  const [game] = useState(() => new Chess(DEFAULT_BOARD_FEN));
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);

  const legalSquares = useMemo(() => {
    if (!selectedSquare || !showLegalMoves) {
      return [] as string[];
    }

    return game.moves({ square: selectedSquare as never, verbose: true }).map((move) => move.to);
  }, [game, selectedSquare, showLegalMoves]);

  const squareStyles = useMemo(() => {
    const styles: Record<string, CSSProperties> = {};
    if (selectedSquare) {
      styles[selectedSquare] = buildSelectedSquareStyles(palette);
    }

    legalSquares.forEach((square) => {
      styles[square] = {
        ...(styles[square] ?? {}),
        ...buildDropSquareStyle(palette),
      };
    });

    return styles;
  }, [legalSquares, palette, selectedSquare]);

  return (
    <div className="wp-settings-v2-board-preview">
      <Chessboard
        options={{
          id: 'woodpecker-settings-board-preview-v2',
          position: DEFAULT_BOARD_FEN,
          allowDragging: false,
          allowDrawingArrows: false,
          showNotation: showCoordinates,
          showAnimations: true,
          animationDurationInMs: 180,
          onSquareClick: (...args) => {
            const square = typeof args[0] === 'string' ? args[0] : args[0]?.square;
            if (!square) {
              return;
            }
            const piece = game.get(square as never);
            if (selectedSquare === square) {
              setSelectedSquare(null);
              return;
            }
            if (piece && piece.color === game.turn()) {
              setSelectedSquare(square);
              return;
            }
            setSelectedSquare(null);
          },
          boardStyle: {
            aspectRatio: '1 / 1',
            border: '1px solid rgba(238, 244, 251, 0.12)',
            borderRadius: '5px',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.22)',
            height: 'auto',
            width: '100%',
          },
          darkSquareStyle: { backgroundColor: palette.darkSquareColor },
          lightSquareStyle: { backgroundColor: palette.lightSquareColor },
          dropSquareStyle: buildDropSquareStyle(palette),
          squareStyles,
        }}
      />
    </div>
  );
}

export function InteractiveBoardPreview(props: ComponentProps<typeof InteractiveBoardPreviewBoard>) {
  const identity = [props.showCoordinates, props.showLegalMoves, props.palette.darkSquareColor, props.palette.lightSquareColor].join('|');
  return <InteractiveBoardPreviewBoard key={identity} {...props} />;
}
