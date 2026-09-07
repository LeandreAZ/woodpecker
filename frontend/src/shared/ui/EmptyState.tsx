import type { PropsWithChildren, ReactNode } from 'react';
import { StatePanel } from './StatePanel';
type EmptyStateProps = PropsWithChildren<{ action?: ReactNode; description: ReactNode; title: ReactNode; compact?: boolean }>;
export function EmptyState({ action, children, description, title, compact = true }: EmptyStateProps) {
  return <StatePanel kind="empty" compact={compact} title={title} description={description} action={<>{action}{children}</>} />;
}
export type { EmptyStateProps };
export default EmptyState;
