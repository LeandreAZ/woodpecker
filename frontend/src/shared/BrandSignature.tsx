import type { JSX } from 'react';

type BrandSignatureProps = {
  compact?: boolean;
  subtitle?: string;
};

const defaultSubtitle = 'Tactical repetition system';

const BrandSignature = ({
  compact = false,
  subtitle = defaultSubtitle,
}: BrandSignatureProps): JSX.Element => {
  return (
    <div className={compact ? 'cw-signature cw-signature-compact' : 'cw-signature'}>
      <svg aria-hidden="true" className="cw-signature-icon" viewBox="0 0 72 72">
        <path d="M32 8c8 0 14 6 14 14 0 4-1 8-4 11l-2 2 8 19c1 2 0 5-2 6l-5 2-9-18-8 18-5-2c-2-1-3-4-2-6l8-19-2-2c-3-3-4-7-4-11 0-8 6-14 14-14z" />
        <path d="M32 18c3 0 6 3 6 6s-3 6-6 6-6-3-6-6 3-6 6-6z" fill="currentColor" opacity="0.85" />
        <path d="M22 55h20" fill="none" opacity="0.8" stroke="currentColor" strokeLinecap="round" strokeWidth="4" />
      </svg>

      <div className="cw-signature-copy">
        <strong>Woodpecker Trainer</strong>
        <span>{subtitle}</span>
      </div>
    </div>
  );
};

export { BrandSignature };
export default BrandSignature;
