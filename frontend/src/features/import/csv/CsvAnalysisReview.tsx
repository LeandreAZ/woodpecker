import type { ReactNode } from 'react';
import { CheckCircle2, CircleX, Copy, FileSpreadsheet, Info, Download, Trash2 } from 'lucide-react';
import type { CsvAnalysis, CsvAnalysisRow } from './csvImport.types.ts';
import { formatInteger } from '../utils/importFormatting';

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

export function CsvAnalysisReview({
  analysis,
  csvFilter,
  csvFilterCounts,
  filteredRows,
  onCsvFilterChange,
  onRequestDeleteError,
}: {
  analysis: CsvAnalysis;
  csvFilter: 'all' | 'valid' | 'error' | 'duplicate';
  csvFilterCounts: Record<'all' | 'valid' | 'error' | 'duplicate', number>;
  filteredRows: CsvAnalysisRow[];
  onCsvFilterChange: (value: 'all' | 'valid' | 'error' | 'duplicate') => void;
  onRequestDeleteError: (line: number) => void;
}) {
  const usefulRowCount = analysis.usefulRowCount ?? analysis.totalRows;

  return (
    <div className="wp-import-review">
      <div className="wp-import-analysis-stats wp-import-analysis-stats--five">
        <ImportStat icon={<CheckCircle2 aria-hidden="true" size={18} />} label="Puzzles valides" tone="success" value={String(analysis.validCount)} />
        <ImportStat icon={<CircleX aria-hidden="true" size={18} />} label="Puzzles invalides" tone="danger" value={String(analysis.errorCount)} />
        <ImportStat icon={<Copy aria-hidden="true" size={18} />} label="Doublons détectés" tone="warning" value={String(analysis.duplicateCount)} />
        <ImportStat icon={<FileSpreadsheet aria-hidden="true" size={18} />} label="Lignes utiles" value={String(usefulRowCount)} />
        <ImportStat icon={<Info aria-hidden="true" size={18} />} label="En-têtes détectés" value={`${analysis.detectedHeaderCount ?? 0} / ${analysis.expectedHeaderCount ?? 0}`} />
      </div>
      <div className="wp-import-review-toolbar wp-import-review-toolbar--validation">
        <div className="wp-import-filter-pills" role="tablist" aria-label="Filtres CSV">
          {[
            ['all', 'Tous', csvFilterCounts.all],
            ['valid', 'Valides', csvFilterCounts.valid],
            ['error', 'Invalides', csvFilterCounts.error],
            ['duplicate', 'Doublons', csvFilterCounts.duplicate],
          ].map(([value, label, count]) => (
            <button
              aria-pressed={csvFilter === value}
              className={csvFilter === value ? 'is-active' : ''}
              key={value}
              onClick={() => onCsvFilterChange(value as 'all' | 'valid' | 'error' | 'duplicate')}
              type="button"
            >
              <span>{label} {count}</span>
            </button>
          ))}
        </div>
        <button className="wp-secondary wp-import-report-button" onClick={() => exportAnalysisReport(analysis)} type="button"><Download aria-hidden="true" size={16} />Exporter le rapport</button>
      </div>
      {filteredRows.length ? (
        <div className="wp-import-rows-table" role="region" aria-label="Résultats CSV">
          <div className="wp-import-rows-table__head wp-import-rows-table__head--csv">
            <span>#</span>
            <span>Aperçu</span>
            <span>FEN / ID Lichess</span>
            <span>Difficulté</span>
            <span>Statut</span>
            <span>Détail</span>
            <span>Action</span>
          </div>
          {filteredRows.map((row, index) => (
            <div className="wp-import-rows-table__row wp-import-rows-table__row--csv" key={`${row.line}-${row.status}-${row.sourceId ?? 'none'}`}>
              <span className="wp-import-table-index">#{index + 1}</span>
              <span className="wp-import-preview-board"><CsvRowBoard fen={row.fen} /></span>
              <span className="wp-import-table-stack"><strong title={row.fen ?? undefined}>{truncateFen(row.fen)}</strong>{row.sourceId?.trim() ? <small>Lichess ID: {row.sourceId}</small> : null}</span>
              <span className="wp-import-rating-value">{renderDifficultyValue(row.rating)}</span>
              <span><span className={`wp-import-chip is-${row.status === 'valid' ? 'success' : row.status === 'error' ? 'danger' : 'warning'}`}>{formatCsvRowStatus(row)}</span></span>
              <span className="wp-import-table-stack"><strong>{row.status === 'valid' ? '—' : row.message ?? '—'}</strong>{row.status !== 'valid' ? <small>{row.status === 'duplicate' && row.sourceId ? `ID: ${row.sourceId}` : `Ligne ${row.line}`}</small> : null}</span>
              <span>{renderCsvRowAction(row, onRequestDeleteError)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="wp-empty">Aucune ligne ne correspond à ce filtre.</p>
      )}
    </div>
  );
}

function CsvRowBoard({ fen }: { fen?: string | null }) {
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
        }))}
    </span>
  );
}

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
        throw new Error('invalid fen');
      }
      return cells;
    });
  } catch {
    return null;
  }
}

function truncateFen(fen?: string | null) {
  if (!fen) {
    return 'FEN indisponible';
  }

  return fen.length > 34 ? `${fen.slice(0, 34)}…` : fen;
}

function renderDifficultyValue(rating?: number | string | null) {
  const numericRating = typeof rating === 'number' ? rating : typeof rating === 'string' ? Number(rating) : NaN;
  if (!Number.isFinite(numericRating)) {
    return '—';
  }

  return formatInteger(numericRating);
}

function renderCsvRowAction(row: CsvAnalysisRow, onRequestDeleteError: (line: number) => void) {
  if (row.status === 'error') {
    return <button aria-label={'Retirer le puzzle invalide de la ligne ' + row.line} className="wp-import-action-button" onClick={() => onRequestDeleteError(row.line)} type="button"><Trash2 aria-hidden="true" size={15} /></button>;
  }

  return '—';
}

function formatCsvRowStatus(row: CsvAnalysisRow) {
  if (row.status === 'valid') {
    return 'Valide';
  }

  if (row.status === 'error') {
    return 'Invalide';
  }

  return 'Doublon';
}

function escapeCsvCell(value: number | string | null | undefined) {
  const normalizedValue = String(value ?? '');
  if (!/[";\n]/.test(normalizedValue)) {
    return normalizedValue;
  }

  return `"${normalizedValue.replace(/"/g, '""')}"`;
}

function exportAnalysisReport(analysis: CsvAnalysis) {
  const csv = [
    ['Ligne', 'Statut', 'Doublon', 'Message', 'FEN', 'ID Lichess', 'Rating', 'Themes'],
    ...analysis.rows.map((row) => [
      row.line,
      formatCsvRowStatus(row),
      row.duplicateReason ?? '',
      row.message ?? '',
      row.fen ?? '',
      row.sourceId ?? '',
      row.rating ?? '',
      (row.themes ?? []).join(', '),
    ]),
  ].map((line) => line.map((value) => escapeCsvCell(value)).join(';')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `rapport-analyse-${analysis.analysisId}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
}

export function ImportStat({ icon, label, tone, value }: { icon: ReactNode; label: string; tone?: 'danger' | 'success' | 'warning'; value: string }) {
  return <div className={`wp-import-stat${tone ? ` is-${tone}` : ''}`}><div className="wp-import-stat__header">{icon}<span>{label}</span></div><strong>{value}</strong></div>;
}

