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

const requiredHeaders = ['solution'];
const knownHeaders = new Set(['fen', 'solution', 'themes', 'rating', 'personalnote', 'personal_note']);

export function parsePuzzleCsv(csvText: string): CsvParseResult {
  const lines = csvText
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return {
      rows: [],
      errors: ['CSV file is empty.'],
    };
  }

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  const errors: string[] = [];

  for (const requiredHeader of requiredHeaders) {
    if (!headers.includes(requiredHeader)) {
      errors.push(`Missing required column: ${requiredHeader}`);
    }
  }

  headers.forEach((header) => {
    if (!knownHeaders.has(header)) {
      errors.push(`Unknown column: ${header}`);
    }
  });

  if (errors.length > 0) {
    return {
      rows: [],
      errors,
    };
  }

  const rows: PuzzleCsvRow[] = [];

  lines.slice(1).forEach((line, index) => {
    const rowNumber = index + 2;
    const values = parseCsvLine(line);
    const record = Object.fromEntries(headers.map((header, valueIndex) => [header, values[valueIndex] ?? '']));
    const solution = splitList(record.solution ?? '');

    if (solution.length === 0) {
      errors.push(`Line ${rowNumber}: solution is required.`);

      return;
    }

    const rating = parseRating(record.rating ?? '', rowNumber, errors);

    rows.push({
      fen: cleanNullable(record.fen),
      solution,
      themes: splitList(record.themes ?? ''),
      rating,
      personalNote: cleanNullable(record.personalnote ?? record.personal_note),
    });
  });

  return {
    rows,
    errors,
  };
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function cleanNullable(value: string | undefined): string | null {
  const cleanedValue = value?.trim() ?? '';

  return cleanedValue.length > 0 ? cleanedValue : null;
}

function parseRating(value: string, rowNumber: number, errors: string[]): number | null {
  const cleanedValue = value.trim();

  if (cleanedValue.length === 0) {
    return null;
  }

  const rating = Number(cleanedValue);

  if (!Number.isInteger(rating) || rating <= 0) {
    errors.push(`Line ${rowNumber}: rating must be a positive integer.`);

    return null;
  }

  return rating;
}

function splitList(value: string): string[] {
  return value
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseCsvLine(line: string): string[] {
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

    if (character === ',' && !isInsideQuotes) {
      values.push(currentValue.trim());
      currentValue = '';

      continue;
    }

    currentValue += character;
  }

  values.push(currentValue.trim());

  return values;
}
