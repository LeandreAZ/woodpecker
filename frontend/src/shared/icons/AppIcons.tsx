import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function baseProps(props: IconProps) {
  return {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...props,
  };
}

export function RepeatIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M8 6.5h9" />
      <path d="m14 3.8 3 2.7-3 2.7" />
      <path d="M16 17.5H7" />
      <path d="m10 14.8-3 2.7 3 2.7" />
      <path d="M8 6.5C5.9 6.5 5 7.7 5 9.6V11" />
      <path d="M16 17.5c2.1 0 3-1.2 3-3.1V13" />
    </svg>
  );
}

export function ShieldCheckIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 3.5c2 1.4 4.2 2.2 6.6 2.5v5c0 4.2-2.4 7.2-6.6 8.9-4.2-1.7-6.6-4.7-6.6-8.9V6c2.4-.3 4.6-1.1 6.6-2.5Z" />
      <path d="m9.4 12 1.8 1.8 3.5-3.8" />
    </svg>
  );
}

export function ChartIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M4.5 18.5h15" />
      <path d="m6.5 15.5 4-4 3.2 2.8 4.8-6.1" />
      <path d="m16.7 8.2 1.8-.1-.1 1.8" />
    </svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect x="5.2" y="10.8" width="13.6" height="9.6" rx="2.2" />
      <path d="M8.2 10.8V8.7A3.8 3.8 0 0 1 12 4.9a3.8 3.8 0 0 1 3.8 3.8v2.1" />
    </svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect x="3.8" y="5.8" width="16.4" height="12.4" rx="2.2" />
      <path d="m5.8 8.3 6.2 4.3 6.2-4.3" />
    </svg>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M2.8 12s3.4-5.3 9.2-5.3 9.2 5.3 9.2 5.3-3.4 5.3-9.2 5.3S2.8 12 2.8 12Z" />
      <circle cx="12" cy="12" r="2.1" />
    </svg>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8.2v4.6" />
      <path d="M12 15.8h.01" />
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M4.8 10.4 12 4.8l7.2 5.6" />
      <path d="M6.5 9.7v8.3h4.4v-5.3h2.2v5.3h4.4V9.7" />
    </svg>
  );
}

export function BarsIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M5.5 18.5V11" />
      <path d="M10.2 18.5V7.5" />
      <path d="M14.9 18.5V13.3" />
      <path d="M19.6 18.5V5.5" />
    </svg>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="12" r="3.1" />
      <path d="M12 4.2v1.9" />
      <path d="M12 17.9v1.9" />
      <path d="m6.4 6.4 1.3 1.3" />
      <path d="m16.3 16.3 1.3 1.3" />
      <path d="M4.2 12h1.9" />
      <path d="M17.9 12h1.9" />
      <path d="m6.4 17.6 1.3-1.3" />
      <path d="m16.3 7.7 1.3-1.3" />
    </svg>
  );
}

export function TargetIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="12" r="7.2" />
      <circle cx="12" cy="12" r="3.6" />
      <path d="M12 8.4v3.6h3.6" />
      <path d="m15.6 8.4 2.8-2.8" />
    </svg>
  );
}

export function RookIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M7.2 6.2h2.1v2H11V6.2h2v2h1.7v-2h2.1v2.6l-1.3 2.3.8 6.5H7.7l.8-6.5-1.3-2.3Z" />
      <path d="M7 19h10" />
    </svg>
  );
}

export function HistoryIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M4.8 12a7.2 7.2 0 1 0 2.1-5.1" />
      <path d="M4.8 5.8v3.7h3.7" />
      <path d="M12 8v4.2l2.8 1.7" />
    </svg>
  );
}

export function LogOutIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M9 4.8H7.2A2.4 2.4 0 0 0 4.8 7.2v9.6a2.4 2.4 0 0 0 2.4 2.4H9" />
      <path d="M13.2 8.2 18 12l-4.8 3.8" />
      <path d="M18 12H9.4" />
    </svg>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="12" r="8" />
      <path d="m8.5 12.2 2.2 2.2 4.8-5.2" />
    </svg>
  );
}

export function FlameIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12.1 4.2c1.1 2.2.3 3.6-.7 4.8-1.2 1.5-2 2.6-2 4.1a2.6 2.6 0 0 0 5.2 0c0-1.9-1.2-3-2.5-4.5-.9-1.1-1.8-2.2 0-4.4Z" />
      <path d="M8 14.2c-1 1-1.5 2-1.5 3.2A5.5 5.5 0 0 0 12 22a5.5 5.5 0 0 0 5.5-4.6c.2-2.1-.8-3.8-2.6-5.5" />
    </svg>
  );
}

export function TrendUpIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M4.5 17.5h15" />
      <path d="m5.5 14.8 4.1-4 3.2 2.8 5.7-6" />
      <path d="m16 7.6 2.5-.1-.1 2.5" />
    </svg>
  );
}

export function QueenIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M6.5 18.6h11" />
      <path d="m7.3 18.1 1.1-7.1 3.6 2.1 3.6-2.1 1.1 7.1" />
      <path d="m8.4 11 1.2-4.2 2.4 2 2.4-2 1.2 4.2" />
      <circle cx="9.4" cy="5.4" r=".9" />
      <circle cx="12" cy="4.4" r=".9" />
      <circle cx="14.6" cy="5.4" r=".9" />
    </svg>
  );
}

export function KingIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M8 18.7h8" />
      <path d="M10.1 18.1 9.3 12a18.3 18.3 0 0 0 5.4 0l-.8 6.1" />
      <path d="M9.6 12c0-2.9.9-4.5 2.4-5.8 1.5 1.3 2.4 2.9 2.4 5.8" />
      <path d="M12 3.8v3.1" />
      <path d="M10.4 5.4H13.6" />
    </svg>
  );
}

export function KnightIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M8 18.7h8.3" />
      <path d="M8.7 18.2c-.2-5 1.1-7.1 3.3-9.3-1.2-.7-2.5-2.3-1.5-4.1 1.6.2 3.4 1 4.8 2.4 1.7 1.7 2.1 4 1.8 6.2l1 4.8" />
      <path d="M11.8 9.1h2" />
      <path d="M13.6 7.5h.01" />
    </svg>
  );
}

export function BishopIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M8 18.8h8" />
      <path d="M12 5.2c1.4 1.7 2 3 2 4.4A3.4 3.4 0 0 1 12 13a3.4 3.4 0 0 1-2-3.4c0-1.4.6-2.7 2-4.4Z" />
      <path d="m10.1 13.3-1 4.7h5.8l-1-4.7" />
      <path d="m11 8.2 2 2" />
      <circle cx="12" cy="4.2" r="1" />
    </svg>
  );
}

export function PawnIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="6.7" r="2.3" />
      <path d="M9.4 18.7h5.2" />
      <path d="M10.2 16.8h3.6" />
      <path d="M10.7 16.7c.1-2.9.3-4.4 1.3-6" />
      <path d="M13.3 16.7c-.1-2.9-.3-4.4-1.3-6" />
    </svg>
  );
}

export function MoreIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="5.2" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="18.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}
