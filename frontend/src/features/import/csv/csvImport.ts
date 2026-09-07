import { normalizePersonalNote, parseOptionalRating, validatePuzzleInput } from '../../solver/domain/puzzleValidation';

export type PuzzleCsvRow = {
  fen: string | null;
  solution: string[];
  themes: string[];
  rating: number | null;
  personalNote: string | null;
};

type CsvParseResult = {
  rows: PuzzleCsvRow[];
  errors: string[];
};

const duplicateRowMessage = 'Ce puzzle apparait plusieurs fois dans le fichier.';
const knownHeaders = new Set([
  'game_url',
  'moves',
  'nbplays',
  'openingtags',
  'personalnote',
  'personal_note',
  'popularity',
  'puzzleid',
  'rating',
  'ratingdeviation',
  'solution',
  'themes',
  'fen',
]);

export function parsePuzzleCsv(csvText: string): CsvParseResult {
  const lines = csvText.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return { rows: [], errors: ['Le fichier CSV est vide.'] };
  }

  const delimiter = detectDelimiter(lines[0]);
  const headerParseResult = parseCsvLine(lines[0], delimiter);
  const errors: string[] = [];

  if (headerParseResult.error) {
    return { rows: [], errors: [headerParseResult.error] };
  }

  const headers = headerParseResult.values.map(normalizeHeader);
  const seenHeaders = new Set<string>();

  if (!headers.includes('moves') && !headers.includes('solution')) {
    errors.push('Colonne obligatoire manquante : Moves ou solution.');
  }

  headers.forEach((header) => {
    if (seenHeaders.has(header)) {
      errors.push(`Colonne dupliquee : ${header}`);
      return;
    }

    seenHeaders.add(header);

    if (!knownHeaders.has(header)) {
      errors.push(`Colonne inconnue : ${header}`);
    }
  });

  if (errors.length > 0) {
    return { rows: [], errors: dedupeErrors(errors) };
  }

  const rows: PuzzleCsvRow[] = [];
  const seenPuzzleKeys = new Set<string>();

  lines.slice(1).forEach((line, index) => {
    const rowNumber = index + 2;
    const parsedRow = parseCsvLine(line, delimiter);

    if (parsedRow.error) {
      errors.push(`Ligne ${rowNumber} : ${parsedRow.error}`);
      return;
    }

    const values = parsedRow.values;

    if (values.length !== headers.length) {
      errors.push(`Ligne ${rowNumber} : nombre de colonnes invalide (${values.length} au lieu de ${headers.length}).`);
      return;
    }

    const record = Object.fromEntries(headers.map((header, valueIndex) => [header, values[valueIndex] ?? '']));
    const solution = splitList(record.moves || record.solution || '');
    const fen = cleanNullable(record.fen);

    try {
      const validatedPuzzle = validatePuzzleInput({
        fen,
        personalNote: record.personalnote ?? record.personal_note,
        solution,
        themes: splitList(record.themes ?? ''),
      });
      const rating = parseOptionalRating(record.rating ?? '');
      const duplicateKey = `${validatedPuzzle.normalizedFen ?? 'initial'}|${validatedPuzzle.normalizedSolution.join(' ')}`;

      if (seenPuzzleKeys.has(duplicateKey)) {
        errors.push(`Ligne ${rowNumber} : ${duplicateRowMessage}`);
        return;
      }

      seenPuzzleKeys.add(duplicateKey);

      rows.push({
        fen: validatedPuzzle.normalizedFen,
        solution: validatedPuzzle.normalizedSolution,
        themes: validatedPuzzle.normalizedThemes,
        rating,
        personalNote: normalizePersonalNote(record.personalnote ?? record.personal_note),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de validation inconnue.';
      errors.push(`Ligne ${rowNumber} : ${message}`);
    }
  });

  return { rows, errors: dedupeErrors(errors) };
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function cleanNullable(value: string | undefined): string | null {
  const cleanedValue = value?.trim() ?? '';
  return cleanedValue.length > 0 ? cleanedValue : null;
}

function splitList(value: string): string[] {
  return value.split(/[;,\s]+/).map((item) => item.trim()).filter(Boolean);
}

function detectDelimiter(headerLine: string): ',' | ';' {
  const commaCount = (headerLine.match(/,/g) ?? []).length;
  const semicolonCount = (headerLine.match(/;/g) ?? []).length;
  return semicolonCount > commaCount ? ';' : ',';
}

function dedupeErrors(errors: string[]): string[] {
  return [...new Set(errors)];
}

function parseCsvLine(line: string, delimiter: ',' | ';' = ','): { error?: string; values: string[] } {
  const values: string[] = [];
  let currentValue = '';
  let isInsideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"' && nextCharacter === '"') {
      currentValue += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      isInsideQuotes = !isInsideQuotes;
      continue;
    }

    if (character === delimiter && !isInsideQuotes) {
      values.push(currentValue.trim());
      currentValue = '';
      continue;
    }

    currentValue += character;
  }

  if (isInsideQuotes) {
    return { error: 'guillemets CSV non fermes.', values: [] };
  }

  values.push(currentValue.trim());
  return { values };
}
