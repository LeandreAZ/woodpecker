import type { HTMLAttributes, PropsWithChildren } from 'react';

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'violet';

type BadgeProps = PropsWithChildren<
  HTMLAttributes<HTMLSpanElement> & {
    tone?: BadgeTone;
  }
>;

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export function Badge({ children, className, tone = 'neutral', ...props }: BadgeProps) {
  return (
    <span {...props} className={joinClassNames('ui-badge', `ui-badge--${tone}`, className)}>
      {children}
    </span>
  );
}

export type { BadgeProps, BadgeTone };
export default Badge;