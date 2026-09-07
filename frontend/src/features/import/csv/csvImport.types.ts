import type { PuzzleCsvRow } from './csvImport';
export type CsvAnalysisPreview = { rating: number; themes: string[] };
export type CsvAnalysisRow = { line: number; status: 'valid' | 'error' | 'duplicate'; duplicateReason?: 'file' | 'training'; fen?: string | null; message?: string; rating?: number | string | null; themes?: string[]; sourceId?: string | null };
export type CsvAnalysis = {
  analysisId: string;
  totalRows: number;
  usefulRowCount?: number;
  detectedHeaderCount?: number;
  expectedHeaderCount?: number;
  validCount: number;
  errorCount: number;
  duplicateCount: number;
  importableCount: number;
  errors: { line: number; message: string }[];
  preview?: CsvAnalysisPreview[];
  rows: CsvAnalysisRow[];
};
export type CsvStep = 1 | 2 | 3;
export type CsvImportOptions = { analysisId: string; skipDuplicates: boolean; skipErroredPuzzles: boolean };



export type ParsedCsvPayload = {
  errors: string[];
  fileName: string;
  rows: PuzzleCsvRow[];
};
