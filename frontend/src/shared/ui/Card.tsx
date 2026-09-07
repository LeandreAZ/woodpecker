import type { HTMLAttributes, PropsWithChildren } from 'react';

type CardProps = PropsWithChildren<
  HTMLAttributes<HTMLElement> & {
    as?: 'article' | 'div' | 'section';
    interactive?: boolean;
  }
>;

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export function Card({
  as = 'div',
  children,
  className,
  interactive = false,
  ...props
}: CardProps) {
  const Component = as;

  return (
    <Component
      {...props}
      className={joinClassNames('ui-card', interactive && 'ui-card--interactive', className)}
    >
      {children}
    </Component>
  );
}

export type { CardProps };
export default Card;