import type { PropsWithChildren, ReactNode } from 'react';

type EmptyStateProps = PropsWithChildren<{
  action?: ReactNode;
  description: ReactNode;
  title: ReactNode;
}>;

export function EmptyState({ action, children, description, title }: EmptyStateProps) {
  return (
    <section className="ui-empty-state">
      <h2 className="ui-empty-state__title">{title}</h2>
      <p className="ui-empty-state__description">{description}</p>
      {children}
      {action}
    </section>
  );
}

export type { EmptyStateProps };
export default EmptyState;