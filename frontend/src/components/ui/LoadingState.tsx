import type { ReactNode } from 'react';

type LoadingStateProps = {
  description?: ReactNode;
  title?: ReactNode;
};

export function LoadingState({
  description = 'Le contenu se prépare.',
  title = 'Chargement en cours',
}: LoadingStateProps) {
  return (
    <section aria-live="polite" className="ui-loading-state">
      <h2 className="ui-loading-state__title">{title}</h2>
      <p className="ui-loading-state__description">{description}</p>
    </section>
  );
}

export type { LoadingStateProps };
export default LoadingState;