import type { ComponentType, CSSProperties, SVGProps } from 'react';
import {
  ChessBishop,
  ChessKing,
  ChessKnight,
  ChessPawn,
  ChessQueen,
  ChessRook,
} from 'lucide-react';
import './training-branding.css';

export type PieceName = 'pawn' | 'king' | 'queen' | 'knight' | 'bishop' | 'rook';

export type TrainingBrandingSource = {
  icon?: string | null;
  iconBackgroundColor?: string | null;
  iconColor?: string | null;
  logo?: string | null;
  name?: string | null;
};

export type TrainingBranding = {
  icon: PieceName;
  iconBackgroundColor: string;
  iconColor: string;
};

type TrainingLogoBadgeProps = {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  training?: TrainingBrandingSource | null;
};

type TrainingPieceIconProps = {
  className?: string;
  piece?: string | null;
};

type Palette = {
  background: string;
  border: string;
  color: string;
};

const DEFAULT_TRAINING_ICON_PIECE: PieceName = 'rook';
const DEFAULT_TRAINING_ICON_BACKGROUND_COLOR = '#8b5cf6';
const DEFAULT_TRAINING_ICON_COLOR = '#ffffff';
const DEFAULT_TRAINING_BRANDING: TrainingBranding = {
  icon: DEFAULT_TRAINING_ICON_PIECE,
  iconBackgroundColor: DEFAULT_TRAINING_ICON_BACKGROUND_COLOR,
  iconColor: DEFAULT_TRAINING_ICON_COLOR,
};
const TRAINING_ICON_PIECES: PieceName[] = ['pawn', 'king', 'queen', 'knight', 'bishop', 'rook'];

const PIECES: Record<PieceName, ComponentType<SVGProps<SVGSVGElement>>> = {
  bishop: ChessBishop,
  king: ChessKing,
  knight: ChessKnight,
  pawn: ChessPawn,
  queen: ChessQueen,
  rook: ChessRook,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeHex(value?: string | null) {
  const normalized = (value ?? '').trim();
  if (!/^#([0-9a-fA-F]{6})$/.test(normalized)) {
    return null;
  }

  return normalized.toLowerCase();
}

function hexToRgb(hex: string) {
  const normalized = normalizeHex(hex) ?? DEFAULT_TRAINING_ICON_BACKGROUND_COLOR;
  return {
    b: Number.parseInt(normalized.slice(5, 7), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    r: Number.parseInt(normalized.slice(1, 3), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map((channel) => clamp(channel, 0, 255).toString(16).padStart(2, '0')).join('');
}

function mix(hex: string, target: string, ratio: number) {
  const baseRgb = hexToRgb(hex);
  const targetRgb = hexToRgb(target);
  const weight = clamp(ratio, 0, 1);

  return rgbToHex(
    Math.round(baseRgb.r + (targetRgb.r - baseRgb.r) * weight),
    Math.round(baseRgb.g + (targetRgb.g - baseRgb.g) * weight),
    Math.round(baseRgb.b + (targetRgb.b - baseRgb.b) * weight),
  );
}

function legacyBackgroundFromLogo(value?: string | null): string | null {
  const raw = value?.trim().toLowerCase() ?? '';
  const toneFromLogo = raw.split(/[:-]/)[0];

  switch (toneFromLogo) {
    case 'lime':
      return '#7ebd2a';
    case 'amber':
      return '#cc8d24';
    case 'teal':
      return '#1f9ca8';
    case 'cobalt':
      return '#2b63d9';
    case 'violet':
      return '#7c5cff';
    default:
      return null;
  }
}

function buildPalette(backgroundColor: string, iconColor: string): Palette {
  const background = normalizeTrainingBackgroundColor(backgroundColor);
  const color = normalizeTrainingIconColor(iconColor);

  return {
    background,
    border: mix(background, '#ffffff', 0.22),
    color,
  };
}

function normalizeTrainingPiece(value?: string | null): PieceName {
  switch (value) {
    case 'pawn':
    case 'king':
    case 'queen':
    case 'knight':
    case 'bishop':
    case 'rook':
      return value;
    default:
      return DEFAULT_TRAINING_ICON_PIECE;
  }
}

function normalizeTrainingBackgroundColor(value?: string | null, legacyLogo?: string | null): string {
  return normalizeHex(value) ?? legacyBackgroundFromLogo(legacyLogo) ?? DEFAULT_TRAINING_ICON_BACKGROUND_COLOR;
}

function normalizeTrainingIconColor(value?: string | null): string {
  return normalizeHex(value) ?? DEFAULT_TRAINING_ICON_COLOR;
}

function resolveTrainingBranding(training?: TrainingBrandingSource | null): TrainingBranding {
  return {
    icon: normalizeTrainingPiece(training?.icon),
    iconBackgroundColor: normalizeTrainingBackgroundColor(training?.iconBackgroundColor, training?.logo),
    iconColor: normalizeTrainingIconColor(training?.iconColor),
  };
}

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export function getTrainingPieceIcon(piece?: string | null) {
  return PIECES[normalizeTrainingPiece(piece)];
}

export function TrainingPieceIcon({ className, piece }: TrainingPieceIconProps) {
  switch (normalizeTrainingPiece(piece)) {
    case 'pawn':
      return <ChessPawn className={className} strokeWidth={1.9} />;
    case 'king':
      return <ChessKing className={className} strokeWidth={1.9} />;
    case 'queen':
      return <ChessQueen className={className} strokeWidth={1.9} />;
    case 'knight':
      return <ChessKnight className={className} strokeWidth={1.9} />;
    case 'bishop':
      return <ChessBishop className={className} strokeWidth={1.9} />;
    case 'rook':
    default:
      return <ChessRook className={className} strokeWidth={1.9} />;
  }
}

export function TrainingLogoBadge({ className, size = 'md', training }: TrainingLogoBadgeProps) {
  const branding = resolveTrainingBranding(training);
  const palette = buildPalette(branding.iconBackgroundColor, branding.iconColor);
  const PieceIcon = PIECES[branding.icon];

  return (
    <span
      className={joinClasses('wp-training-brand', 'is-' + size, className)}
      style={
        {
          '--training-brand-background': palette.background,
          '--training-brand-border': palette.border,
          '--training-brand-color': palette.color,
        } as CSSProperties
      }
    >
      <PieceIcon strokeWidth={1.9} />
    </span>
  );
}

export function getTrainingLogoLabel(training?: TrainingBrandingSource | null) {
  return training?.name ?? 'Entraînement';
}

export function isValidHexColor(value?: string | null) {
  return Boolean(normalizeHex(value));
}

export {
  DEFAULT_TRAINING_BRANDING,
  DEFAULT_TRAINING_ICON_BACKGROUND_COLOR,
  DEFAULT_TRAINING_ICON_COLOR,
  DEFAULT_TRAINING_ICON_PIECE,
  TRAINING_ICON_PIECES,
  normalizeTrainingBackgroundColor,
  normalizeTrainingIconColor,
  normalizeTrainingPiece,
  resolveTrainingBranding,
};
export default TrainingLogoBadge;
