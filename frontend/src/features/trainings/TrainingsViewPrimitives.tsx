import type { ReactNode } from 'react';

export function NavButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button className={active ? 'active' : undefined} type="button" onClick={onClick}>
      {children}
    </button>
  );
}

export function PageHeader({
  action,
  description,
  eyebrow,
  title,
}: {
  action?: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <header className="wp-page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action}
    </header>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="wp-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
