import type { CSSProperties, ReactElement, SVGProps } from 'react';
import * as AppIcons from '../../shared/AppIcons';
import type { Training } from './trainingsTypes';

type TrainingBrandingSource = Pick<Training, 'id' | 'name' | 'icon' | 'logo'>;

type TrainingLogoBadgeProps = {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  training?: TrainingBrandingSource | null;
};

type ToneName = 'cobalt' | 'lime' | 'violet' | 'amber' | 'teal';
type PieceName = 'queen' | 'knight' | 'bishop' | 'rook' | 'pawn';

type Palette = {
  background: string;
  border: string;
  color: string;
  shadow: string;
};

const TONES: Record<ToneName, Palette> = {
  amber: {
    background: 'linear-gradient(180deg, rgba(118, 82, 18, 0.92), rgba(74, 50, 10, 0.96))',
    border: 'rgba(245, 190, 76, 0.34)',
    color: '#f5be4c',
    shadow: '0 18px 36px rgba(74, 50, 10, 0.28)',
  },
  cobalt: {
    background: 'linear-gradient(180deg, rgba(32, 73, 154, 0.94), rgba(18, 45, 96, 0.98))',
    border: 'rgba(92, 148, 255, 0.34)',
    color: '#86b5ff',
    shadow: '0 18px 36px rgba(13, 31, 70, 0.28)',
  },
  lime: {
    background: 'linear-gradient(180deg, rgba(66, 106, 24, 0.94), rgba(36, 66, 14, 0.98))',
    border: 'rgba(178, 227, 79, 0.3)',
    color: '#b8e34f',
    shadow: '0 18px 36px rgba(29, 57, 11, 0.28)',
  },
  teal: {
    background: 'linear-gradient(180deg, rgba(20, 104, 113, 0.94), rgba(12, 63, 69, 0.98))',
    border: 'rgba(86, 212, 228, 0.28)',
    color: '#7fe2ef',
    shadow: '0 18px 36px rgba(10, 51, 56, 0.28)',
  },
  violet: {
    background: 'linear-gradient(180deg, rgba(86, 54, 142, 0.94), rgba(52, 28, 95, 0.98))',
    border: 'rgba(182, 134, 255, 0.34)',
    color: '#c69cff',
    shadow: '0 18px 36px rgba(37, 22, 68, 0.28)',
  },
};

const PIECES: Record<PieceName, (props: SVGProps<SVGSVGElement>) => ReactElement> = {
  bishop: AppIcons.BishopIcon,
  knight: AppIcons.KnightIcon,
  pawn: AppIcons.PawnIcon,
  queen: AppIcons.QueenIcon,
  rook: AppIcons.RookIcon,
};

function normalizePiece(value?: string | null): PieceName {
  switch (value) {
    case 'knight':
    case 'bishop':
    case 'rook':
    case 'pawn':
      return value;
    default:
      return 'queen';
  }
}

function normalizeTone(value?: string | null): ToneName {
  switch (value) {
    case 'lime':
    case 'violet':
    case 'amber':
    case 'teal':
      return value;
    default:
      return 'cobalt';
  }
}

function parseLogoDescriptor(training?: TrainingBrandingSource | null) {
  const fallbackPiece = normalizePiece(training?.icon);
  const raw = training?.logo?.trim().toLowerCase() ?? '';
  const [rawTone, rawPiece] = raw.split(/[:-]/);
  const tone = normalizeTone(rawTone);
  const piece = normalizePiece(rawPiece ?? fallbackPiece);

  return {
    palette: TONES[tone],
    piece,
    tone,
  };
}

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export function TrainingLogoBadge({ className, size = 'md', training }: TrainingLogoBadgeProps) {
  const { palette, piece } = parseLogoDescriptor(training);
  const PieceIcon = PIECES[piece];

  return (
    <span
      className={joinClasses('wp-training-brand', `is-${size}`, className)}
      style={{
        '--training-brand-background': palette.background,
        '--training-brand-border': palette.border,
        '--training-brand-color': palette.color,
        '--training-brand-shadow': palette.shadow,
      } as CSSProperties}
    >
      <PieceIcon />
    </span>
  );
}

export function getTrainingLogoLabel(training?: TrainingBrandingSource | null) {
  return training?.name ?? 'Entraînement';
}

export type { TrainingBrandingSource };
export default TrainingLogoBadge;

