import {
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';

export function HistoryPagination({ currentPage, totalPages, pageNumbers, setPage }: { currentPage: number; totalPages: number; pageNumbers: Array<number | 'ellipsis-left' | 'ellipsis-right'>; setPage: Dispatch<SetStateAction<number>> }) {
  return (
    <div className="wp-training-history-pagination wp-training-history-pagination--v2">
      <button aria-label="Page précédente" className="wp-training-history-pagination__edge" disabled={currentPage === 1} type="button" onClick={() => setPage((value) => Math.max(1, value - 1))}>
        <ChevronLeft size={16} />Précédent
      </button>
      <div className="wp-training-history-pagination__pages">
        {pageNumbers.map((pageNumber) => pageNumber === 'ellipsis-left' || pageNumber === 'ellipsis-right' ? (
          <span key={pageNumber} className="wp-training-history-pagination__ellipsis">…</span>
        ) : (
          <button
            key={pageNumber}
            className={pageNumber === currentPage ? 'is-active' : undefined}
            type="button"
            onClick={() => setPage(pageNumber)}
          >
            {pageNumber}
          </button>
        ))}
      </div>
      <button aria-label="Page suivante" className="wp-training-history-pagination__edge" disabled={currentPage === totalPages} type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
        Suivant<ChevronRight size={16} />
      </button>
    </div>
  );
}
