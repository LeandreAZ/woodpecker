import type { HTMLAttributes, ReactNode } from 'react';

type StatCardProps = HTMLAttributes<HTMLElement> & {
  icon?: ReactNode;
  label: string;
  meta?: ReactNode;
  value: ReactNode;
};

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export function StatCard({ className, icon, label, meta, value, ...props }: StatCardProps) {
  return (
    <article {...props} className={joinClassNames('ui-stat-card', className)}>
      <div className="ui-stat-card__header">
        <span className="ui-stat-card__label">{label}</span>
        {icon}
      </div>
      <strong className="ui-stat-card__value">{value}</strong>
      {meta ? <span className="ui-stat-card__meta">{meta}</span> : null}
    </article>
  );
}

export type { StatCardProps };
export default StatCard;