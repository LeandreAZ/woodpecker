import type { JSX } from 'react';

type BrandMarkProps = {
  compact?: boolean;
  subtitle?: string;
};

function BrandMark({
  compact = false,
  subtitle = "Traineur tactique structure",
}: BrandMarkProps): JSX.Element {
  return (
    <div className={compact ? 'cw-signature cw-signature-compact' : 'cw-signature'}>
      <svg aria-hidden="true" className="cw-signature-icon" viewBox="0 0 84 84">
        <path d="M19 14c8 0 16 3 22 8 3-1 6-1 9 0 6 2 10 6 12 12-5-2-10-3-14-2 4 2 7 4 10 7-5 0-10 1-15 4 1 6 0 12-2 18l-4 10-8-6 2-10-5 6-7-4 6-10c3-6 4-12 3-17-3-2-6-3-9-4-3 6-6 13-9 21l-4 12-7-4 6-18c3-10 8-18 15-24-2-1-4-1-6-1-3 0-7 1-11 3 2-6 5-11 10-14 3-2 7-3 10-3z" />
        <circle cx="53" cy="31" r="3" fill="currentColor" />
        <path d="M58 31l10-4-7 8z" fill="currentColor" />
      </svg>
      <div className="cw-signature-copy">
        <strong>WOODPECKER</strong>
        <span>TRAINER</span>
        {!compact && subtitle ? <small>{subtitle}</small> : null}
      </div>
    </div>
  );
}

export { BrandMark };
export default BrandMark;
