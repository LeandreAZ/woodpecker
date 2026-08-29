export type SupportedLanguage = 'fr' | 'en' | 'es' | 'pt' | 'de' | 'ru' | 'zh' | 'ja' | 'ko';
export type SupportedTheme = 'dark' | 'light';

export type BoardColorPalette = {
  darkSquareColor: string;
  lightSquareColor: string;
};

export const DEFAULT_LIGHT_SQUARE_COLOR = '#EEEED2';
export const DEFAULT_DARK_SQUARE_COLOR = '#769656';
export const DEFAULT_BOARD_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1';

const HEX_COLOR_PATTERN = /^#[0-9A-F]{6}$/;

export function normalizeHexColor(value: string, fallback: string): string {
  const normalized = value.trim().toUpperCase();
  return HEX_COLOR_PATTERN.test(normalized) ? normalized : fallback;
}

export function blendBoardSelectionColor({ darkSquareColor, lightSquareColor }: BoardColorPalette): string {
  const light = hexToRgb(normalizeHexColor(lightSquareColor, DEFAULT_LIGHT_SQUARE_COLOR));
  const dark = hexToRgb(normalizeHexColor(darkSquareColor, DEFAULT_DARK_SQUARE_COLOR));

  const mixed = {
    r: Math.round((light.r + dark.r) / 2),
    g: Math.round((light.g + dark.g) / 2),
    b: Math.round((light.b + dark.b) / 2),
  };

  return rgbToHex(adjustBrightness(mixed, -20));
}

export function buildSelectedSquareStyles(palette: BoardColorPalette) {
  const selectionColor = blendBoardSelectionColor(palette);
  const selectionRgb = hexToRgb(selectionColor);

  return {
    backgroundColor: `rgba(${selectionRgb.r}, ${selectionRgb.g}, ${selectionRgb.b}, 0.34)`,
    boxShadow: `inset 0 0 0 2px rgba(${selectionRgb.r}, ${selectionRgb.g}, ${selectionRgb.b}, 0.92)`,
  };
}

export function buildDropSquareStyle(palette: BoardColorPalette) {
  const selectionColor = blendBoardSelectionColor(palette);
  const selectionRgb = hexToRgb(selectionColor);

  return {
    boxShadow: `inset 0 0 0 4px rgba(${selectionRgb.r}, ${selectionRgb.g}, ${selectionRgb.b}, 0.52)`,
  };
}

export function getSideToMoveMeta(fen?: string | null) {
  const parts = fen?.trim().split(/\s+/) ?? [];
  const activeColor = parts[1] === 'b' ? 'black' : 'white';

  if (activeColor === 'black') {
    return {
      color: 'black' as const,
      description: 'Les Noirs doivent trouver le meilleur coup.',
      label: 'Aux Noirs',
    };
  }

  return {
    color: 'white' as const,
    description: 'Les Blancs doivent trouver le meilleur coup.',
    label: 'Aux Blancs',
  };
}

function adjustBrightness(color: { r: number; g: number; b: number }, amount: number) {
  return {
    r: clampColor(color.r + amount),
    g: clampColor(color.g + amount),
    b: clampColor(color.b + amount),
  };
}

function clampColor(value: number) {
  return Math.max(0, Math.min(255, value));
}

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '');
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex(color: { r: number; g: number; b: number }) {
  return `#${[color.r, color.g, color.b].map((value) => value.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}
