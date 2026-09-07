import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PuzzleRow } from '../../types/detail.types';

const DETAIL_COLLECTION_PAGE_SIZE = 5;

const PIECE_SYMBOLS: Record<string, string> = {
  K: '♔',
  Q: '♕',
  R: '♖',
  B: '♗',
  N: '♘',
  P: '♙',
  k: '♚',
  q: '♛',
  r: '♜',
  b: '♝',
  n: '♞',
  p: '♟',
};

function parseFenBoard(fen?: string | null) {
  const board = fen?.trim().split(' ')[0] ?? '';
  const rows = board.split('/');
  if (rows.length !== 8) {
    return null;
  }

  try {
    return rows.map((row) => {
      const cells: string[] = [];
      for (const token of row) {
        const emptyCount = Number(token);
        if (Number.isInteger(emptyCount) && emptyCount > 0) {
          for (let index = 0; index < emptyCount; index += 1) {
            cells.push('');
          }
        } else {
          cells.push(token);
        }
      }

      if (cells.length !== 8) {
        throw new Error('invalid fen row');
      }

      return cells;
    });
  } catch {
    return null;
  }
}

function PuzzlePreview({ fen }: { fen?: string | null }) {
  const rows = parseFenBoard(fen);

  if (!rows) {
    return <span className="wp-detail-problem-preview__empty">?</span>;
  }

  return (
    <span className="wp-detail-problem-preview__board" aria-hidden="true">
      {rows.map((row, rowIndex) =>
        row.map((piece, columnIndex) => {
          const isDark = (rowIndex + columnIndex) % 2 === 1;
          const cellClassName = isDark
            ? 'wp-detail-problem-preview__cell is-dark'
            : 'wp-detail-problem-preview__cell is-light';
          return (
            <span className={cellClassName} key={`${rowIndex}-${columnIndex}`}>
              {piece ? PIECE_SYMBOLS[piece] ?? '' : ''}
            </span>
          );
        }),
      )}
    </span>
  );
}

function buildPaginationItems(pageCount: number, currentPage: number) {
  if (pageCount <= 1) {
    return [1];
  }

  const pages = new Set<number>([1, pageCount, currentPage, currentPage - 1, currentPage + 1]);
  const orderedPages = Array.from(pages)
    .filter((page) => page >= 1 && page <= pageCount)
    .sort((left, right) => left - right);

  const items: Array<number | 'ellipsis'> = [];
  orderedPages.forEach((page, index) => {
    const previousPage = orderedPages[index - 1];
    if (previousPage && page - previousPage > 1) {
      items.push('ellipsis');
    }
    items.push(page);
  });

  return items;
}

export function DetailCollection({
  canOpenSolver,
  onPuzzleSelect,
  rows,
  totalProblems,
}: {
  canOpenSolver: boolean;
  onPuzzleSelect: (trainingPuzzleIri: string) => void;
  rows: PuzzleRow[];
  totalProblems: number;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(rows.length / DETAIL_COLLECTION_PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, pageCount);
  const startIndex = (safeCurrentPage - 1) * DETAIL_COLLECTION_PAGE_SIZE;
  const endIndex = Math.min(startIndex + DETAIL_COLLECTION_PAGE_SIZE, rows.length);
  const paginatedRows = rows.slice(startIndex, endIndex);
  const paginationItems = buildPaginationItems(pageCount, safeCurrentPage);

  const openPuzzle = (row: PuzzleRow) => {
    if (!canOpenSolver || row.accessDisabled) {
      return;
    }

    onPuzzleSelect(row.id);
  };

  return (
    <section className="wp-panel wp-detail-section wp-detail-collection">
      <div className="wp-detail-section__header">
        <div>
          <h2>Collection de problèmes</h2>
          <p>{totalProblems} problème{totalProblems > 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="wp-detail-collection__table-wrap">
        <table className="wp-detail-collection__table">
          <thead>
            <tr>
              <th className="is-center">#</th>
              <th>Aperçu</th>
              <th className="is-center">Statut</th>
              <th className="is-center">Difficulté</th>
              <th className="is-center">Tentatives</th>
              <th className="is-center">Dernière tentative</th>
              <th className="is-center">Accès</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row) => (
              <tr key={row.id}>
                <td className="is-center">{row.positionLabel}</td>
                <td>
                  <button
                    className="wp-detail-problem-preview"
                    disabled={row.accessDisabled}
                    type="button"
                    onClick={() => openPuzzle(row)}
                  >
                    <PuzzlePreview fen={row.previewFen} />
                  </button>
                </td>
                <td className="is-center">
                  <span className={`wp-detail-badge is-${row.statusTone}`}>{row.statusLabel}</span>
                </td>
                <td className="is-center">{row.ratingValueLabel}</td>
                <td className="is-center">{row.attemptsLabel}</td>
                <td className="is-center">{row.attemptedAtLabel}</td>
                <td className="is-center">
                  <button
                    aria-label={`Accéder au problème ${row.positionLabel}`}
                    className="wp-detail-arrow-button"
                    disabled={row.accessDisabled}
                    type="button"
                    onClick={() => openPuzzle(row)}
                  >
                    <ChevronRight aria-hidden="true" size={18} strokeWidth={2} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="wp-detail-collection__mobile-list">
        {paginatedRows.map((row) => (
          <button
            key={`mobile-${row.id}`}
            className="wp-detail-collection-card"
            disabled={row.accessDisabled}
            type="button"
            onClick={() => openPuzzle(row)}
          >
            <span className="wp-detail-collection-card__preview">
              <PuzzlePreview fen={row.previewFen} />
            </span>
            <span className="wp-detail-collection-card__copy">
              <span className="wp-detail-collection-card__head">
                <strong>Problème {row.positionLabel}</strong>
              </span>
              <span className="wp-detail-collection-card__meta">
                <span className={`wp-detail-badge is-${row.statusTone}`}>{row.statusLabel}</span>
                <span className="wp-detail-collection-card__elo">{row.ratingValueLabel}</span>
              </span>
            </span>
            <ChevronRight aria-hidden="true" className="wp-detail-collection-card__arrow" size={18} strokeWidth={2} />
          </button>
        ))}
      </div>

      {pageCount > 1 ? (
        <div className="wp-detail-collection__pagination">
          <span className="wp-detail-collection__pagination-copy">
            {startIndex + 1} à {endIndex} sur {rows.length} problème{rows.length > 1 ? 's' : ''}
          </span>

          <div className="wp-detail-collection__pagination-controls">
            <button
              aria-label="Page précédente"
              className="wp-detail-pagination-button"
              disabled={safeCurrentPage === 1}
              type="button"
              onClick={() => setCurrentPage(safeCurrentPage - 1)}
            >
              <ChevronLeft aria-hidden="true" size={16} strokeWidth={2} />
            </button>

            {paginationItems.map((item, index) =>
              item === 'ellipsis' ? (
                <span className="wp-detail-pagination-ellipsis" key={`ellipsis-${index}`}>
                  …
                </span>
              ) : (
                <button
                  aria-current={item === safeCurrentPage ? 'page' : undefined}
                  className={item === safeCurrentPage ? 'wp-detail-pagination-button is-active' : 'wp-detail-pagination-button'}
                  key={item}
                  type="button"
                  onClick={() => setCurrentPage(item)}
                >
                  {item}
                </button>
              ),
            )}

            <button
              aria-label="Page suivante"
              className="wp-detail-pagination-button"
              disabled={safeCurrentPage === pageCount}
              type="button"
              onClick={() => setCurrentPage(safeCurrentPage + 1)}
            >
              <ChevronRight aria-hidden="true" size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

